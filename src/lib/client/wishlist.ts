"use client";

import { z } from "zod";
import { createLocalStore } from "./local-store";

/** Guest wishlist (product ids). Signed-in customers sync to the database from Phase 3. */
const state = z.object({ version: z.literal(1), productIds: z.array(z.string().min(1)).max(500) });
type WishlistState = z.infer<typeof state>;

const empty: WishlistState = { version: 1, productIds: [] };

const store = createLocalStore<WishlistState>("store.wishlist.v1", empty, (raw) => {
  const parsed = state.safeParse(raw);
  return parsed.success ? parsed.data : null;
});

export const wishlist = {
  toggle(productId: string) {
    store.set((s) => ({
      ...s,
      productIds: s.productIds.includes(productId)
        ? s.productIds.filter((id) => id !== productId)
        : [...s.productIds, productId],
    }));
  },
  remove(productId: string) {
    store.set((s) => ({ ...s, productIds: s.productIds.filter((id) => id !== productId) }));
  },
};

export function useWishlist() {
  const s = store.useStore();
  return {
    productIds: s.productIds,
    count: s.productIds.length,
    has: (id: string) => s.productIds.includes(id),
  };
}
