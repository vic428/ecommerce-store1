import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import { CacheTags } from "./cache-tags";
import { LISTABLE_PRODUCT_STATUSES, SELLING_MERCHANT_STATUSES } from "./availability";
import type { Prisma } from "@/generated/prisma/client";

/** Everything a product card needs. Prices are minor units. */
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  image: { url: string; alt: string } | null;
  ratingAvg: number;
  ratingCount: number;
  /** Sum of stock across active variants. */
  stock: number;
  lowStock: boolean;
  /** Set when the product has exactly one active variant, so it can be added straight to the cart. */
  defaultVariantId: string | null;
  variantCount: number;
  /** The merchant that sells and fulfils this product. */
  merchant: { slug: string; name: string };
};

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
};

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  price: true,
  compareAtPrice: true,
  ratingAvg: true,
  ratingCount: true,
  status: true,
  merchant: { select: { slug: true, businessName: true } },
  images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, price: true, stock: true, lowStockThreshold: true },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow): ProductCardData {
  // A product marked OUT_OF_STOCK by staff shows as sold out whatever the variant counts say.
  const stock =
    p.status === "OUT_OF_STOCK" ? 0 : p.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  // Show the lowest variant price ("from" price) when variants override the base price.
  const prices = p.variants.map((v) => v.price ?? p.price);
  const price = prices.length ? Math.min(...prices) : p.price;
  const lowStock = stock > 0 && p.variants.some((v) => v.stock > 0 && v.stock <= v.lowStockThreshold);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    price,
    compareAtPrice: p.compareAtPrice && p.compareAtPrice > price ? p.compareAtPrice : null,
    image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt ?? p.name } : null,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    stock,
    lowStock,
    defaultVariantId: p.variants.length === 1 ? p.variants[0].id : null,
    variantCount: p.variants.length,
    merchant: { slug: p.merchant.slug, name: p.merchant.businessName },
  };
}

/**
 * Public products: listable status, sold by a merchant allowed to sell, in an active (or no)
 * category. Mirrors `isListed` in ./availability.
 */
const publicProduct: Prisma.ProductWhereInput = {
  status: { in: [...LISTABLE_PRODUCT_STATUSES] },
  merchant: { status: { in: [...SELLING_MERCHANT_STATUSES] } },
  OR: [{ categoryId: null }, { category: { isActive: true } }],
};

/** Top-level active categories in display order. Cached (tag: catalog). */
export async function getActiveCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheTag(CacheTags.catalog);
  cacheLife("minutes");
  return db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, description: true, imageUrl: true, icon: true },
  });
}

/** Products for a homepage block. Cached per (source, slugs, limit) with tag: catalog. */
export async function getProductsForBlock(
  source: "featured" | "slugs" | "newest" | "bestsellers",
  productSlugs: string[],
  limit: number,
): Promise<ProductCardData[]> {
  "use cache";
  cacheTag(CacheTags.catalog);
  cacheLife("minutes");

  if (source === "slugs") {
    const rows = await db.product.findMany({
      where: { ...publicProduct, slug: { in: productSlugs } },
      select: cardSelect,
    });
    const order = new Map(productSlugs.map((s, i) => [s, i]));
    return rows
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
      .slice(0, limit)
      .map(toCard);
  }

  const rows = await db.product.findMany({
    where: { ...publicProduct, ...(source === "featured" ? { isFeatured: true } : {}) },
    orderBy:
      source === "bestsellers"
        ? [{ salesCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }, { name: "asc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}
