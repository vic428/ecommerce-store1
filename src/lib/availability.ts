/**
 * Marketplace visibility and purchase rules, shared by the storefront queries and (from phase M3)
 * the server-side checkout. Pure functions so the rules are unit tested in one place.
 */

export type MerchantStatus =
  "LEAD" | "ONBOARDING" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TERMINATED";

export type ProductStatus =
  "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "OUT_OF_STOCK" | "UNAVAILABLE" | "ARCHIVED" | "REJECTED";

/** Product statuses that may appear in public browsing (when the merchant is active). */
export const LISTABLE_PRODUCT_STATUSES: readonly ProductStatus[] = ["PUBLISHED", "OUT_OF_STOCK"];

/** Only ACTIVE merchants are visible and can sell. Every other status hides their listings. */
export const SELLING_MERCHANT_STATUSES: readonly MerchantStatus[] = ["ACTIVE"];

export function isListed(product: { status: ProductStatus }, merchant: { status: MerchantStatus }) {
  return (
    LISTABLE_PRODUCT_STATUSES.includes(product.status) && SELLING_MERCHANT_STATUSES.includes(merchant.status)
  );
}

export type PurchaseBlock =
  | "MERCHANT_NOT_ACTIVE"
  | "PRODUCT_NOT_PUBLISHED"
  | "VARIANT_INACTIVE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK";

/**
 * Can `quantity` of this variant be bought right now? Returns null when purchasable, otherwise
 * the first reason it isn't. Checkout must call this server-side with fresh database values.
 */
export function purchaseBlock(input: {
  merchant: { status: MerchantStatus };
  product: { status: ProductStatus };
  variant: { isActive: boolean; stock: number };
  quantity: number;
}): PurchaseBlock | null {
  const { merchant, product, variant, quantity } = input;
  if (!SELLING_MERCHANT_STATUSES.includes(merchant.status)) return "MERCHANT_NOT_ACTIVE";
  if (product.status !== "PUBLISHED")
    return product.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "PRODUCT_NOT_PUBLISHED";
  if (!variant.isActive) return "VARIANT_INACTIVE";
  if (variant.stock <= 0) return "OUT_OF_STOCK";
  if (variant.stock < quantity) return "INSUFFICIENT_STOCK";
  return null;
}
