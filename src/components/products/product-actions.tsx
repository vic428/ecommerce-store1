"use client";

import { useState } from "react";
import { Check, Heart } from "lucide-react";
import { cart } from "@/lib/client/cart";
import { useWishlist, wishlist } from "@/lib/client/wishlist";
import { useStoreConfig } from "@/components/common/store-provider";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import Link from "next/link";

export function WishlistButton({ productId, productName }: { productId: string; productName: string }) {
  const { features } = useStoreConfig();
  const { has } = useWishlist();
  if (!features.wishlist) return null;
  const saved = has(productId);
  return (
    <button
      type="button"
      onClick={() => wishlist.toggle(productId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      className="bg-background/90 text-text hover:text-danger flex h-9 w-9 items-center justify-center rounded-full"
    >
      <Heart aria-hidden className={cn("h-5 w-5", saved && "fill-danger text-danger")} strokeWidth={1.75} />
    </button>
  );
}

type AddToCartProps = {
  product: { id: string; slug: string; name: string; imageUrl: string | null; price: number };
  /** Set for single-variant products. Multi-variant products link to the product page instead. */
  variantId: string | null;
  inStock: boolean;
};

export function AddToCartButton({ product, variantId, inStock }: AddToCartProps) {
  const [added, setAdded] = useState(false);
  const cls = buttonClasses({ size: "sm", className: "w-full" });

  if (!inStock) {
    return (
      <button type="button" disabled className={cls}>
        Out of Stock
      </button>
    );
  }

  if (!variantId) {
    return (
      <Link href={`/product/${product.slug}`} className={cls}>
        Choose Options
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      aria-live="polite"
      onClick={() => {
        cart.add({
          variantId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPrice: product.price,
        });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? (
        <>
          <Check aria-hidden className="h-4 w-4" /> Added
        </>
      ) : (
        "Add to Cart"
      )}
    </button>
  );
}
