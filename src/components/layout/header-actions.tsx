"use client";

import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { useWishlist } from "@/lib/client/wishlist";
import { useStoreConfig } from "@/components/common/store-provider";

function CountBadge({ count, testId }: { count: number; testId: string }) {
  if (count <= 0) return null;
  return (
    <span
      data-testid={testId}
      className="bg-danger absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const iconLink =
  "relative flex h-10 w-10 items-center justify-center rounded-brand text-text hover:bg-surface";

export function HeaderActions() {
  const { features } = useStoreConfig();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();

  return (
    <div className="flex items-center gap-1">
      {features.customerAccounts && (
        <Link href="/account" className={`${iconLink} hidden sm:flex`} aria-label="Account">
          <User aria-hidden className="h-6 w-6" strokeWidth={1.75} />
        </Link>
      )}
      {features.wishlist && (
        <Link
          href="/wishlist"
          className={iconLink}
          aria-label={`Wishlist, ${wishCount} items`}
          data-testid="header-wishlist"
        >
          <Heart aria-hidden className="h-6 w-6" strokeWidth={1.75} />
          <CountBadge count={wishCount} testId="wishlist-count" />
        </Link>
      )}
      <Link
        href="/cart"
        className={iconLink}
        aria-label={`Cart, ${cartCount} items`}
        data-testid="header-cart"
      >
        <ShoppingCart aria-hidden className="h-6 w-6" strokeWidth={1.75} />
        <CountBadge count={cartCount} testId="cart-count" />
      </Link>
    </div>
  );
}
