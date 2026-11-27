import type { CommerceSettings } from "./settings-schema";

type MoneyFormat = Pick<CommerceSettings, "currency" | "locale" | "minorUnits">;

/** Format an integer amount in minor units, e.g. 8999900 → "₦89,999.00". */
export function formatMoney(amountMinor: number, fmt: MoneyFormat, opts?: { hideZeroDecimals?: boolean }) {
  const major = amountMinor / fmt.minorUnits;
  const hideDecimals = (opts?.hideZeroDecimals ?? true) && Number.isInteger(major);
  return new Intl.NumberFormat(fmt.locale, {
    style: "currency",
    currency: fmt.currency,
    minimumFractionDigits: hideDecimals ? 0 : undefined,
    maximumFractionDigits: hideDecimals ? 0 : undefined,
  }).format(major);
}

/** Convert a major-unit amount (e.g. 89999.5) to integer minor units without float drift. */
export function toMinor(amountMajor: number, minorUnits: number) {
  return Math.round(amountMajor * minorUnits);
}

/** Percentage saved between compare-at and current price, rounded down. Null if not on sale. */
export function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}
