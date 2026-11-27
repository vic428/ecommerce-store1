/**
 * Commission engine. Pure functions, no I/O. Every amount is an integer in minor units (kobo,
 * cents) and every rate is an integer in basis points (1000 = 10.00%). Intermediate products
 * use BigInt so large orders can't lose precision, and rounding is explicit (half up).
 *
 * The rules are documented in DATABASE.md ("Commission calculation"). Results are written to
 * OrderItem as a snapshot when the order is created and never recalculated afterwards.
 */

export type CommissionType = "PERCENTAGE" | "FIXED_PER_UNIT";
export type CommissionBasis = "GROSS_BEFORE_DISCOUNT" | "NET_OF_DISCOUNT";
export type CostBearer = "VARCH" | "MERCHANT";
export type CommissionSource = "PRODUCT_OVERRIDE" | "MERCHANT_AGREEMENT" | "MARKETPLACE_DEFAULT";

export const MAX_BPS = 10_000;

/** The rule that applies to one order line, as it will be snapshotted. */
export type CommissionRule = {
  source: CommissionSource;
  agreementId: string | null;
  type: CommissionType;
  rateBps: number | null;
  fixedAmount: number | null;
  basis: CommissionBasis;
  discountBearer: CostBearer;
  paymentFeeBearer: CostBearer;
};

export type AgreementInput = {
  id: string;
  status: "DRAFT" | "ACTIVE" | "SUPERSEDED" | "TERMINATED";
  commissionType: CommissionType;
  rateBps: number | null;
  fixedAmount: number | null;
  commissionBasis: CommissionBasis;
  discountBearer: CostBearer;
  paymentFeeBearer: CostBearer;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type ProductOverrideInput = {
  commissionType: CommissionType | null;
  commissionRateBps: number | null;
  commissionFixedAmount: number | null;
};

/** Marketplace default from the "commission" setting. Null when VARCH hasn't configured one. */
export type MarketplaceDefaultInput = {
  type: CommissionType;
  rateBps: number | null;
  fixedAmount: number | null;
  basis: CommissionBasis;
  discountBearer: CostBearer;
  paymentFeeBearer: CostBearer;
} | null;

export class CommissionError extends Error {}

function assertInt(name: string, v: number, min = 0) {
  if (!Number.isSafeInteger(v) || v < min)
    throw new CommissionError(`${name} must be an integer ≥ ${min} (got ${v})`);
}

function validateShape(
  type: CommissionType,
  rateBps: number | null,
  fixedAmount: number | null,
  where: string,
) {
  if (type === "PERCENTAGE") {
    if (rateBps === null) throw new CommissionError(`${where}: percentage commission needs rateBps`);
    assertInt(`${where}.rateBps`, rateBps);
    if (rateBps > MAX_BPS) throw new CommissionError(`${where}: rateBps cannot exceed ${MAX_BPS}`);
  } else {
    if (fixedAmount === null) throw new CommissionError(`${where}: fixed commission needs fixedAmount`);
    assertInt(`${where}.fixedAmount`, fixedAmount);
  }
}

/** Is the agreement in force at `at`? effectiveFrom is inclusive, effectiveTo exclusive. */
export function agreementApplies(a: AgreementInput, at: Date) {
  return a.status === "ACTIVE" && a.effectiveFrom <= at && (a.effectiveTo === null || at < a.effectiveTo);
}

/**
 * Pick the rule for a line, in priority order:
 *   1. Product override (product.commissionType set)
 *   2. The merchant's ACTIVE agreement in force at `at` (latest effectiveFrom wins)
 *   3. The marketplace default
 * Cost-bearer settings come from the agreement when there is one, otherwise the default.
 * Throws if nothing applies: an item must never be sold without a commission rule.
 */
export function resolveCommissionRule(input: {
  product: ProductOverrideInput;
  agreements: AgreementInput[];
  marketplaceDefault: MarketplaceDefaultInput;
  at: Date;
}): CommissionRule {
  const { product, agreements, marketplaceDefault, at } = input;
  const agreement =
    agreements
      .filter((a) => agreementApplies(a, at))
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0] ?? null;

  const bearerSource = agreement
    ? {
        basis: agreement.commissionBasis,
        discountBearer: agreement.discountBearer,
        paymentFeeBearer: agreement.paymentFeeBearer,
      }
    : marketplaceDefault
      ? {
          basis: marketplaceDefault.basis,
          discountBearer: marketplaceDefault.discountBearer,
          paymentFeeBearer: marketplaceDefault.paymentFeeBearer,
        }
      : null;

  if (product.commissionType) {
    if (!bearerSource) {
      throw new CommissionError(
        "Product override needs a merchant agreement or marketplace default for cost-bearer rules",
      );
    }
    validateShape(
      product.commissionType,
      product.commissionRateBps,
      product.commissionFixedAmount,
      "product override",
    );
    return {
      source: "PRODUCT_OVERRIDE",
      agreementId: agreement?.id ?? null,
      type: product.commissionType,
      rateBps: product.commissionType === "PERCENTAGE" ? product.commissionRateBps : null,
      fixedAmount: product.commissionType === "FIXED_PER_UNIT" ? product.commissionFixedAmount : null,
      ...bearerSource,
    };
  }

  if (agreement) {
    validateShape(
      agreement.commissionType,
      agreement.rateBps,
      agreement.fixedAmount,
      `agreement ${agreement.id}`,
    );
    return {
      source: "MERCHANT_AGREEMENT",
      agreementId: agreement.id,
      type: agreement.commissionType,
      rateBps: agreement.commissionType === "PERCENTAGE" ? agreement.rateBps : null,
      fixedAmount: agreement.commissionType === "FIXED_PER_UNIT" ? agreement.fixedAmount : null,
      basis: agreement.commissionBasis,
      discountBearer: agreement.discountBearer,
      paymentFeeBearer: agreement.paymentFeeBearer,
    };
  }

  if (marketplaceDefault) {
    validateShape(
      marketplaceDefault.type,
      marketplaceDefault.rateBps,
      marketplaceDefault.fixedAmount,
      "marketplace default",
    );
    return {
      source: "MARKETPLACE_DEFAULT",
      agreementId: null,
      type: marketplaceDefault.type,
      rateBps: marketplaceDefault.type === "PERCENTAGE" ? marketplaceDefault.rateBps : null,
      fixedAmount: marketplaceDefault.type === "FIXED_PER_UNIT" ? marketplaceDefault.fixedAmount : null,
      basis: marketplaceDefault.basis,
      discountBearer: marketplaceDefault.discountBearer,
      paymentFeeBearer: marketplaceDefault.paymentFeeBearer,
    };
  }

  throw new CommissionError(
    "No commission rule applies: set a merchant agreement or the marketplace default",
  );
}

/** round(numerator / denominator), half up, for non-negative integers. */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= BigInt(0)) throw new CommissionError("denominator must be positive");
  return (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
}

export type LineCommission = {
  grossAmount: number;
  discountAmount: number;
  commissionBaseAmount: number;
  commissionAmount: number;
  /** Owed to the merchant before payment fees and refunds. */
  merchantNetAmount: number;
};

/**
 * Commission for one line.
 *   gross      = unitPrice × quantity
 *   base       = gross (GROSS_BEFORE_DISCOUNT) or gross − discount (NET_OF_DISCOUNT)
 *   commission = round(base × rateBps / 10000)        (PERCENTAGE)
 *              = min(fixedAmount × quantity, base)     (FIXED_PER_UNIT)
 *   merchant   = gross − commission − (discount if the merchant bears discounts)
 * Commission is capped so the merchant amount never goes below zero.
 */
export function calculateLineCommission(input: {
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  rule: CommissionRule;
}): LineCommission {
  const { unitPrice, quantity, discountAmount, rule } = input;
  assertInt("unitPrice", unitPrice);
  assertInt("quantity", quantity, 1);
  assertInt("discountAmount", discountAmount);

  const gross = BigInt(unitPrice) * BigInt(quantity);
  const discount = BigInt(discountAmount);
  if (discount > gross) throw new CommissionError("discount cannot exceed the line amount");

  const base = rule.basis === "GROSS_BEFORE_DISCOUNT" ? gross : gross - discount;

  let commission =
    rule.type === "PERCENTAGE"
      ? divRoundHalfUp(base * BigInt(rule.rateBps ?? 0), BigInt(MAX_BPS))
      : BigInt(rule.fixedAmount ?? 0) * BigInt(quantity);
  if (commission > base) commission = base;

  const merchantDiscount = rule.discountBearer === "MERCHANT" ? discount : BigInt(0);
  let merchantNet = gross - commission - merchantDiscount;
  if (merchantNet < BigInt(0)) {
    // Only reachable when the merchant bears a discount larger than gross − commission.
    commission = commission + merchantNet; // reduce commission so merchant net is exactly 0
    merchantNet = BigInt(0);
  }

  return {
    grossAmount: Number(gross),
    discountAmount: Number(discount),
    commissionBaseAmount: Number(base),
    commissionAmount: Number(commission),
    merchantNetAmount: Number(merchantNet),
  };
}

/**
 * Split `total` across `weights` in proportion, so the parts always sum exactly to `total`
 * (largest-remainder method). Used to allocate order discounts and payment fees to lines.
 */
export function allocateProportionally(total: number, weights: number[]): number[] {
  assertInt("total", total);
  weights.forEach((w, i) => assertInt(`weights[${i}]`, w));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0) return [];
  if (sum === 0) {
    if (total !== 0) throw new CommissionError("cannot allocate a non-zero total across zero weights");
    return weights.map(() => 0);
  }
  const T = BigInt(total);
  const S = BigInt(sum);
  const raw = weights.map((w) => {
    const num = T * BigInt(w);
    return { floor: num / S, rem: num % S };
  });
  let leftover = T - raw.reduce((a, r) => a + r.floor, BigInt(0));
  const order = raw
    .map((r, i) => ({ i, rem: r.rem }))
    .sort((a, b) => (a.rem === b.rem ? a.i - b.i : a.rem > b.rem ? -1 : 1));
  const out = raw.map((r) => r.floor);
  for (const { i } of order) {
    if (leftover === BigInt(0)) break;
    out[i] += BigInt(1);
    leftover -= BigInt(1);
  }
  return out.map(Number);
}

export type RefundReversal = {
  commissionReversed: number;
  merchantNetReversed: number;
};

/**
 * How much commission and merchant net to reverse for a refund on one line.
 *
 * Reversal is proportional to the share of the customer-paid line amount (gross − discount)
 * refunded so far. It is computed on the cumulative total and then differenced, so a series of
 * partial refunds that ends in a full refund reverses exactly 100%, with no rounding drift.
 */
export function calculateRefundReversal(input: {
  line: {
    grossAmount: number;
    discountAmount: number;
    commissionAmount: number;
    merchantNetAmount: number;
    refundedAmount: number;
    commissionReversed: number;
    merchantNetReversed: number;
  };
  refundAmount: number;
}): RefundReversal {
  const { line, refundAmount } = input;
  assertInt("refundAmount", refundAmount, 1);
  const paid = line.grossAmount - line.discountAmount;
  const newRefunded = line.refundedAmount + refundAmount;
  if (newRefunded > paid) throw new CommissionError("refund exceeds the amount paid for this line");

  const P = BigInt(paid);
  const R = BigInt(newRefunded);
  const targetCommission =
    newRefunded === paid
      ? BigInt(line.commissionAmount)
      : divRoundHalfUp(BigInt(line.commissionAmount) * R, P);
  const targetMerchant =
    newRefunded === paid
      ? BigInt(line.merchantNetAmount)
      : divRoundHalfUp(BigInt(line.merchantNetAmount) * R, P);

  return {
    commissionReversed: Number(targetCommission) - line.commissionReversed,
    merchantNetReversed: Number(targetMerchant) - line.merchantNetReversed,
  };
}

/**
 * Amount payable to the merchant for a line right now:
 *   merchantNet − merchantNetReversed − (paymentFee if the merchant bears payment fees)
 * Never negative; a negative result means the line needs a manual adjustment.
 */
export function merchantPayableForLine(line: {
  merchantNetAmount: number;
  merchantNetReversed: number;
  paymentFeeAmount: number;
  paymentFeeBearer: CostBearer;
}): number {
  const fee = line.paymentFeeBearer === "MERCHANT" ? line.paymentFeeAmount : 0;
  return Math.max(0, line.merchantNetAmount - line.merchantNetReversed - fee);
}
