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
};

export type SeedVariant = {
  sku: string;
  name?: string;
  options?: Record<string, string>;
  /** Overrides the product price, major units. */
  price?: number;
  stock: number;
};

export type SeedProduct = {
  slug: string;
  name: string;
  categorySlug: string;
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
