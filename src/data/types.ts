/**
 * Shapes for catalogue seed data. Prices here are in MAJOR units (e.g. 89999 = ₦89,999)
 * for readability; the seed script converts them to minor units using commerce.minorUnits.
 */
export type SeedCategory = {
  slug: string;
  name: string;
  description?: string;
  /** Icon key used when no image is supplied (see components/common/icon). */
  icon?: string;
  imageUrl?: string;
  /** Nest under another category. Parents must appear earlier in the list. */
  parentSlug?: string;
};

export type SeedVariant = {
  sku: string;
  name?: string;
  options?: Record<string, string>;
  /** Overrides the product price, major units. */
  price?: number;
  stock: number;
};

export type SeedMerchant = {
  slug: string;
  businessName: string;
  description?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  preferredChannel?: "EMAIL" | "PHONE" | "WHATSAPP" | "SMS";
  status: "LEAD" | "ONBOARDING" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TERMINATED";
  agreementStatus: "NONE" | "DRAFT" | "SENT" | "SIGNED" | "EXPIRED" | "TERMINATED";
  contact?: { name: string; role?: string; email?: string; phone?: string };
  /** Agreements in date order. Rates in basis points (1000 = 10%). */
  agreements?: {
    status: "DRAFT" | "ACTIVE" | "SUPERSEDED" | "TERMINATED";
    rateBps: number;
    effectiveFrom: string;
    effectiveTo?: string;
    paymentFeeBearer?: "VARCH" | "MERCHANT";
    discountBearer?: "VARCH" | "MERCHANT";
  }[];
};

export type SeedProduct = {
  slug: string;
  name: string;
  merchantSlug: string;
  categorySlug: string;
  /** Defaults to PUBLISHED. */
  status?:
    "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "OUT_OF_STOCK" | "UNAVAILABLE" | "ARCHIVED" | "REJECTED";
  /** Per-product commission override, basis points. */
  commissionRateBps?: number;
  brand?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  attributes?: Record<string, string>;
  isFeatured?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  salesCount?: number;
  /** Simple products: one stock figure. Products with options: list variants instead. */
  stock?: number;
  variants?: SeedVariant[];
};
