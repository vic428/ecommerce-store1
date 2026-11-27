# Storefront notes (original template phases 0–1)

> The project pivoted to a multi-vendor marketplace. The current plan and phases (M1–M5) are in
> [ARCHITECTURE_CHANGE.md](ARCHITECTURE_CHANGE.md). The notes below still describe how the
> storefront shell works.

## Phase 1 notes

- **Caching.** Next.js 16 runs with Cache Components. Storefront reads (`getSettings`,
  `getHomepageBlocks`, `getActiveCategories`, `getProductsForBlock`) use `"use cache"` with the
  tags in `src/lib/cache-tags.ts` and expire after a few minutes. Phase 4 admin actions must call
  `updateTag()` for the matching tag so edits show immediately.
- **Builds read the database.** Pages are prerendered at build time, so `next build` needs a
  reachable `DATABASE_URL` (CI included).
- **Cart and wishlist** live in `localStorage` (`src/lib/client/`). Cart prices are display-only;
  checkout re-prices on the server in Phase 3.
- **Not built yet (404 for now):** `/shop`, `/categories/*`, `/product/*`, `/cart`, `/wishlist`,
  `/account/*`, `/about`, `/contact`, `/help`, `/policies/*`. Phase 2 adds the shopping pages;
  content pages (about, contact, policies) are scheduled with the Phase 4 settings work.
- **Images.** Demo product and hero images are still missing; components show a neutral placeholder.
  Add files under `public/demo/` (see `src/data/products.ts` for the expected names).
- **Newsletter** sign-ups are stored in `NewsletterSubscriber`. Rate limiting is still a TODO
  (Phase 5).
- **Configuration e2e tests** (store name, theme, currency, feature toggles changing the UI) need
  the admin settings actions to invalidate caches, so they land in Phase 4/5.

## Phase 0 notes

- Customer and admin sessions are designed as hashed-token rows in the database
  (`CustomerSession`, `AdminSession`); implemented in Phases 3 and 4.
