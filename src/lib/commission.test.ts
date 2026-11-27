import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  allocateProportionally,
  calculateLineCommission,
  calculateRefundReversal,
  CommissionError,
  merchantPayableForLine,
  resolveCommissionRule,
  type AgreementInput,
  type CommissionRule,
  type MarketplaceDefaultInput,
} from "./commission";

const noOverride = { commissionType: null, commissionRateBps: null, commissionFixedAmount: null };

const marketplaceDefault: MarketplaceDefaultInput = {
  type: "PERCENTAGE",
  rateBps: 1000,
  fixedAmount: null,
  basis: "NET_OF_DISCOUNT",
  discountBearer: "VARCH",
  paymentFeeBearer: "VARCH",
};

function agreement(over: Partial<AgreementInput> = {}): AgreementInput {
  return {
    id: "agr_1",
    status: "ACTIVE",
    commissionType: "PERCENTAGE",
    rateBps: 1500,
    fixedAmount: null,
    commissionBasis: "NET_OF_DISCOUNT",
    discountBearer: "VARCH",
    paymentFeeBearer: "MERCHANT",
    effectiveFrom: new Date("2026-01-01T00:00:00Z"),
    effectiveTo: null,
    ...over,
  };
}

const at = new Date("2026-06-01T12:00:00Z");

describe("resolveCommissionRule", () => {
  test("uses the marketplace default when the merchant has no agreement", () => {
    const rule = resolveCommissionRule({ product: noOverride, agreements: [], marketplaceDefault, at });
    assert.equal(rule.source, "MARKETPLACE_DEFAULT");
    assert.equal(rule.rateBps, 1000);
  });

  test("merchant agreement overrides the default", () => {
    const rule = resolveCommissionRule({
      product: noOverride,
      agreements: [agreement()],
      marketplaceDefault,
      at,
    });
    assert.equal(rule.source, "MERCHANT_AGREEMENT");
    assert.equal(rule.agreementId, "agr_1");
    assert.equal(rule.rateBps, 1500);
    assert.equal(rule.paymentFeeBearer, "MERCHANT");
  });

  test("product override wins but keeps the agreement's cost-bearer rules", () => {
    const rule = resolveCommissionRule({
      product: { commissionType: "FIXED_PER_UNIT", commissionRateBps: null, commissionFixedAmount: 50_000 },
      agreements: [agreement()],
      marketplaceDefault,
      at,
    });
    assert.equal(rule.source, "PRODUCT_OVERRIDE");
    assert.equal(rule.fixedAmount, 50_000);
    assert.equal(rule.paymentFeeBearer, "MERCHANT");
  });

  test("ignores draft, terminated, future and expired agreements", () => {
    const agreements = [
      agreement({ id: "draft", status: "DRAFT" }),
      agreement({ id: "ended", status: "TERMINATED" }),
      agreement({ id: "future", effectiveFrom: new Date("2027-01-01T00:00:00Z") }),
      agreement({ id: "expired", effectiveTo: new Date("2026-03-01T00:00:00Z") }),
    ];
    const rule = resolveCommissionRule({ product: noOverride, agreements, marketplaceDefault, at });
    assert.equal(rule.source, "MARKETPLACE_DEFAULT");
  });

  test("the latest agreement in force applies", () => {
    const agreements = [
      agreement({ id: "old", rateBps: 1500, effectiveFrom: new Date("2026-01-01T00:00:00Z") }),
      agreement({ id: "new", rateBps: 1200, effectiveFrom: new Date("2026-05-01T00:00:00Z") }),
    ];
    const rule = resolveCommissionRule({ product: noOverride, agreements, marketplaceDefault, at });
    assert.equal(rule.agreementId, "new");
    assert.equal(rule.rateBps, 1200);
  });

  test("refuses to price an item with no applicable rule", () => {
    assert.throws(
      () => resolveCommissionRule({ product: noOverride, agreements: [], marketplaceDefault: null, at }),
      CommissionError,
    );
  });

  test("rejects rates above 100%", () => {
    assert.throws(
      () =>
        resolveCommissionRule({
          product: noOverride,
          agreements: [agreement({ rateBps: 10_001 })],
          marketplaceDefault,
          at,
        }),
      CommissionError,
    );
  });
});

const pct = (bps: number, over: Partial<CommissionRule> = {}): CommissionRule => ({
  source: "MARKETPLACE_DEFAULT",
  agreementId: null,
  type: "PERCENTAGE",
  rateBps: bps,
  fixedAmount: null,
  basis: "NET_OF_DISCOUNT",
  discountBearer: "VARCH",
  paymentFeeBearer: "VARCH",
  ...over,
});

describe("calculateLineCommission", () => {
  test("default 10% on ₦89,999 × 2", () => {
    const r = calculateLineCommission({
      unitPrice: 8_999_900,
      quantity: 2,
      discountAmount: 0,
      rule: pct(1000),
    });
    assert.deepEqual(r, {
      grossAmount: 17_999_800,
      discountAmount: 0,
      commissionBaseAmount: 17_999_800,
      commissionAmount: 1_799_980,
      merchantNetAmount: 16_199_820,
    });
  });

  test("rounds half up", () => {
    // 12.5% of 1001 = 125.125 → 125; 12.5% of 1004 = 125.5 → 126
    assert.equal(
      calculateLineCommission({ unitPrice: 1001, quantity: 1, discountAmount: 0, rule: pct(1250) })
        .commissionAmount,
      125,
    );
    assert.equal(
      calculateLineCommission({ unitPrice: 1004, quantity: 1, discountAmount: 0, rule: pct(1250) })
        .commissionAmount,
      126,
    );
  });

  test("VARCH-funded discount: commission on net, merchant unaffected by the discount", () => {
    const r = calculateLineCommission({
      unitPrice: 10_000,
      quantity: 1,
      discountAmount: 2_000,
      rule: pct(1000),
    });
    assert.equal(r.commissionBaseAmount, 8_000);
    assert.equal(r.commissionAmount, 800);
    assert.equal(r.merchantNetAmount, 9_200);
  });

  test("merchant-funded discount reduces merchant net", () => {
    const r = calculateLineCommission({
      unitPrice: 10_000,
      quantity: 1,
      discountAmount: 2_000,
      rule: pct(1000, { discountBearer: "MERCHANT" }),
    });
    assert.equal(r.commissionAmount, 800);
    assert.equal(r.merchantNetAmount, 7_200);
  });

  test("commission on gross before discount", () => {
    const r = calculateLineCommission({
      unitPrice: 10_000,
      quantity: 1,
      discountAmount: 2_000,
      rule: pct(1000, { basis: "GROSS_BEFORE_DISCOUNT" }),
    });
    assert.equal(r.commissionAmount, 1_000);
    assert.equal(r.merchantNetAmount, 9_000);
  });

  test("fixed per-unit commission, capped at the line base", () => {
    const fixed = (amount: number) => pct(0, { type: "FIXED_PER_UNIT", rateBps: null, fixedAmount: amount });
    assert.equal(
      calculateLineCommission({ unitPrice: 5_000, quantity: 3, discountAmount: 0, rule: fixed(500) })
        .commissionAmount,
      1_500,
    );
    assert.equal(
      calculateLineCommission({ unitPrice: 100, quantity: 2, discountAmount: 0, rule: fixed(500) })
        .commissionAmount,
      200,
    );
  });

  test("merchant net never goes negative", () => {
    const r = calculateLineCommission({
      unitPrice: 1_000,
      quantity: 1,
      discountAmount: 1_000,
      rule: pct(5000, { discountBearer: "MERCHANT", basis: "GROSS_BEFORE_DISCOUNT" }),
    });
    assert.equal(r.merchantNetAmount, 0);
    assert.equal(r.commissionAmount + r.merchantNetAmount + r.discountAmount, r.grossAmount);
  });

  test("rejects non-integer money", () => {
    assert.throws(
      () => calculateLineCommission({ unitPrice: 10.5, quantity: 1, discountAmount: 0, rule: pct(1000) }),
      CommissionError,
    );
  });

  test("handles very large amounts without precision loss", () => {
    const r = calculateLineCommission({
      unitPrice: 900_000_000_000,
      quantity: 9,
      discountAmount: 0,
      rule: pct(1234),
    });
    assert.equal(r.commissionAmount, 999_540_000_000);
  });
});

describe("historical snapshots", () => {
  test("a stored snapshot is not affected by later agreement changes", () => {
    const original = agreement({ rateBps: 1500 });
    const rule = resolveCommissionRule({
      product: noOverride,
      agreements: [original],
      marketplaceDefault,
      at,
    });
    const snapshot = calculateLineCommission({ unitPrice: 20_000, quantity: 1, discountAmount: 0, rule });

    // Later: the agreement is superseded by a new 20% agreement.
    const later = new Date("2026-09-01T00:00:00Z");
    const superseded = { ...original, status: "SUPERSEDED" as const };
    const replacement = agreement({
      id: "agr_2",
      rateBps: 2000,
      effectiveFrom: new Date("2026-08-01T00:00:00Z"),
    });
    const newRule = resolveCommissionRule({
      product: noOverride,
      agreements: [superseded, replacement],
      marketplaceDefault,
      at: later,
    });

    assert.equal(snapshot.commissionAmount, 3_000); // unchanged: 15% of 20,000
    assert.equal(
      calculateLineCommission({ unitPrice: 20_000, quantity: 1, discountAmount: 0, rule: newRule })
        .commissionAmount,
      4_000,
    );
  });
});

describe("allocateProportionally", () => {
  test("parts always sum to the total", () => {
    const parts = allocateProportionally(1_000, [3_333, 3_333, 3_334]);
    assert.equal(
      parts.reduce((a, b) => a + b, 0),
      1_000,
    );
    assert.deepEqual(parts, [333, 333, 334]);
  });

  test("zero total and single line", () => {
    assert.deepEqual(allocateProportionally(0, [5, 7]), [0, 0]);
    assert.deepEqual(allocateProportionally(999, [42]), [999]);
  });
});

describe("refund reversals", () => {
  const line = {
    grossAmount: 10_000,
    discountAmount: 0,
    commissionAmount: 1_000,
    merchantNetAmount: 9_000,
    refundedAmount: 0,
    commissionReversed: 0,
    merchantNetReversed: 0,
  };

  test("full refund reverses all commission and merchant net", () => {
    assert.deepEqual(calculateRefundReversal({ line, refundAmount: 10_000 }), {
      commissionReversed: 1_000,
      merchantNetReversed: 9_000,
    });
  });

  test("partial refunds reverse proportionally and end exactly at 100%", () => {
    const first = calculateRefundReversal({ line, refundAmount: 3_333 });
    assert.deepEqual(first, { commissionReversed: 333, merchantNetReversed: 3_000 });
    const after = { ...line, refundedAmount: 3_333, commissionReversed: 333, merchantNetReversed: 3_000 };
    const rest = calculateRefundReversal({ line: after, refundAmount: 6_667 });
    assert.equal(first.commissionReversed + rest.commissionReversed, 1_000);
    assert.equal(first.merchantNetReversed + rest.merchantNetReversed, 9_000);
  });

  test("cannot refund more than was paid", () => {
    assert.throws(() => calculateRefundReversal({ line, refundAmount: 10_001 }), CommissionError);
  });
});

describe("merchantPayableForLine", () => {
  test("deducts payment fees only when the merchant bears them", () => {
    const base = { merchantNetAmount: 9_000, merchantNetReversed: 0, paymentFeeAmount: 150 };
    assert.equal(merchantPayableForLine({ ...base, paymentFeeBearer: "VARCH" }), 9_000);
    assert.equal(merchantPayableForLine({ ...base, paymentFeeBearer: "MERCHANT" }), 8_850);
  });

  test("refund reversals reduce the payable amount", () => {
    assert.equal(
      merchantPayableForLine({
        merchantNetAmount: 9_000,
        merchantNetReversed: 9_000,
        paymentFeeAmount: 0,
        paymentFeeBearer: "VARCH",
      }),
      0,
    );
  });
});
