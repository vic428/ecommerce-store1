"use client";

import { z } from "zod";
import { createLocalStore } from "./local-store";

/**
 * Client-side cart. It stores what the shopper picked plus display data for instant UI.
 * Prices here are for display only: checkout re-prices every line on the server from the
 * database (Phase 3), so tampering with localStorage cannot change what is charged.
 */
const cartLine = z.object({
  variantId: z.string().min(1),
  productId: z.string().min(1),
  slug: z.string(),
  name: z.string(),
  variantName: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  unitPrice: z.number().int().nonnegative(),
  quantity: z.number().int().positive().max(99),
});

export type CartLine = z.infer<typeof cartLine>;

const cartState = z.object({ version: z.literal(1), lines: z.array(cartLine) });
type CartState = z.infer<typeof cartState>;

const MAX_QTY = 99;
const empty: CartState = { version: 1, lines: [] };

const store = createLocalStore<CartState>("store.cart.v1", empty, (raw) => {
  const parsed = cartState.safeParse(raw);
  return parsed.success ? parsed.data : null;
});

export const cart = {
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    store.set((s) => {
      const existing = s.lines.find((l) => l.variantId === line.variantId);
      const lines = existing
        ? s.lines.map((l) =>
            l.variantId === line.variantId
              ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) }
              : l,
          )
        : [...s.lines, { ...line, quantity: Math.min(MAX_QTY, quantity) }];
      return { ...s, lines };
    });
  },
  setQuantity(variantId: string, quantity: number) {
    store.set((s) => ({
      ...s,
      lines:
        quantity <= 0
          ? s.lines.filter((l) => l.variantId !== variantId)
          : s.lines.map((l) =>
              l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l,
            ),
    }));
  },
  remove(variantId: string) {
    store.set((s) => ({ ...s, lines: s.lines.filter((l) => l.variantId !== variantId) }));
  },
  clear() {
    store.set(() => empty);
  },
};

export function useCart() {
  const state = store.useStore();
  const count = state.lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = state.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  return { lines: state.lines, count, subtotal };
}
