import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import type { CommerceSettings } from "@/lib/settings-schema";
import { discountPercent, formatMoney } from "@/lib/currency";
import { StoreImage } from "@/components/common/store-image";
import { Badge } from "@/components/ui/badge";
import { Rating } from "./rating";
import { AddToCartButton, WishlistButton } from "./product-actions";

export function ProductCard({
  product,
  money,
  showRating = true,
}: {
  product: ProductCardData;
  money: Pick<CommerceSettings, "currency" | "locale" | "minorUnits">;
  showRating?: boolean;
}) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;
  const fromPrice = product.variantCount > 1;

  return (
    <article
      className="group rounded-brand border-border bg-background relative flex h-full flex-col border p-3 transition-shadow hover:shadow-md sm:p-4"
      data-testid="product-card"
    >
      <div className="absolute top-3 right-3 z-10">
        <WishlistButton productId={product.id} productName={product.name} />
      </div>
      <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
        {off !== null && <Badge tone="danger">-{off}%</Badge>}
        {!inStock && <Badge tone="muted">Sold out</Badge>}
        {inStock && product.lowStock && <Badge tone="secondary">Low stock</Badge>}
      </div>

      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative mb-3 aspect-square w-full overflow-hidden">
          <StoreImage
            src={product.image?.url}
            alt={product.image?.alt ?? product.name}
            sizes="(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 45vw"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="text-text line-clamp-2 text-sm font-semibold">{product.name}</h3>
      </Link>
      <p className="text-muted mt-0.5 truncate text-xs" data-testid="product-merchant">
        Sold by <span className="text-text font-medium">{product.merchant.name}</span>
      </p>

      {showRating && product.ratingCount > 0 && (
        <div className="mt-1.5">
          <Rating value={product.ratingAvg} count={product.ratingCount} />
        </div>
      )}

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-text text-base font-extrabold sm:text-lg" data-testid="product-price">
          {fromPrice && <span className="text-muted mr-1 text-xs font-medium">From</span>}
          {formatMoney(product.price, money)}
        </span>
        {product.compareAtPrice && (
          <span className="text-muted text-xs line-through">
            <span className="sr-only">Was </span>
            {formatMoney(product.compareAtPrice, money)}
          </span>
        )}
      </p>

      <div className="mt-3">
        <AddToCartButton
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.image?.url ?? null,
            price: product.price,
          }}
          variantId={product.defaultVariantId}
          inStock={inStock}
        />
      </div>
    </article>
  );
}
