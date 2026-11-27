# Architecture change: single-store template → VARCH multi-vendor marketplace

Status (on `main`):

- **M1 foundation: done.** Running on the Supabase dev/test project.
- **M2 admin operations: in progress.**
  - Slice 1 done: staff sign-in (Supabase Auth, server actions), set/reset password by email,
    session refresh (`src/proxy.ts`), role-gated admin shell, real-data dashboard, audit log of
    sign-ins/outs and password changes, `npm run staff:create`.
  - Slice 2 done: merchants. Searchable/filterable list; create/edit with server validation;
    contacts; commission agreements (draft → activate → terminate, scheduled switch-overs,
    active terms immutable); status changes with confirmation (non-active hides listings
    immediately, terminated is final, terminating needs `merchants:offboard`); settlement
    details for Finance/Super Admin only; per-merchant activity log.
  - Next: products, categories and inventory (slice 3).

## 1. What existed before the pivot

Built in Phases 0–1 of the original single-store template (branch `phase-1-storefront`, PR #1):

| Area            | State                                                                                              | Notes                                                     |
| --------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Stack           | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind 4                        | Keep                                                      |
| Data            | Prisma 7 + PostgreSQL, one migration, integer money (minor units)                                  | Keep Prisma; evolve schema                                |
| Settings        | `Setting` key/value rows validated by zod (`src/lib/settings-schema.ts`), seeded from `src/config` | Keep; add `commission` and `marketplace` keys             |
| Catalogue       | Categories (nested), products, variants with per-variant stock, inventory ledger                   | Keep; add merchant ownership and review status            |
| Storefront      | Themed shell, homepage blocks, product cards, localStorage cart/wishlist, newsletter               | Keep; add “Sold by” and merchant visibility rules         |
| Orders/payments | Schema only, nothing implemented                                                                   | Redesign for merchants, commission snapshots, settlements |
| Auth            | Schema only (own password hashing + session tables), nothing implemented                           | Replace with Supabase Auth + `profiles`/roles             |
| Admin           | Not built                                                                                          | Build as the VARCH operations dashboard                   |
| Tests           | Playwright homepage suite (desktop/tablet/mobile)                                                  | Keep; extend                                              |

Nothing was deployed and no real data exists, so schema changes can be made as a clean
migration on the development database.

## 2. Decisions

1. **Keep Prisma; use Supabase as the hosted Postgres.** Prisma talks to Supabase Postgres
   directly. Switching to supabase-js for data access would rewrite every query for no gain.
2. **Supabase Auth for identity.** The unimplemented custom password/session tables are removed.
   A `Profile` row (id = `auth.users.id`) holds app data; `UserRole` rows grant platform roles;
   `MerchantUser` links a profile to a merchant for the future portal.
3. **Authorisation is enforced on the server.** All reads and writes go through Next.js server
   code, which checks roles (`src/lib/auth/permissions.ts`) and merchant scope before querying.
4. **RLS as defence in depth.** Supabase exposes every `public` table through its REST API using
   the public anon key. The migration enables RLS on every table and grants no policies to
   `anon`/`authenticated`, so the browser can't read or write the database directly. Only the
   server connection (table owner) can. Narrow policies are added only if a feature ever needs
   direct client access (e.g. Storage uploads).
5. **Commission is snapshotted per order item.** Rate, type, source (product override → merchant
   agreement → marketplace default), basis and resulting amounts are written when the order is
   created and never recalculated. Rates are integer basis points; money is integer minor units.
   No floating point anywhere in financial maths.
6. **One customer order, merchant fulfilment groups.** Each order has one or more
   `OrderFulfilment` rows (one per merchant). The MVP checkout allows one merchant per order;
   the data model already supports split orders later.
7. **Payments behind a provider interface** with server-side verification, signed webhooks and
   an idempotency table (`PaymentEvent`). No card data is stored. Which provider (and whether it
   supports marketplace split settlement) is a business/regulatory decision. See
   `BUSINESS_DECISIONS.md`.
8. **Settlements are manual records.** A settlement groups payable order items and refund
   reversals for one merchant. “Marked paid” records that VARCH reports a transfer, with its
   reference; it does not claim the bank transfer succeeded. No wallets or stored balances.
9. **Merchants are never hard-deleted.** Offboarding changes status, hides listings and keeps
   all order/financial history (`onDelete: Restrict` on financial relations).
10. **Hosting:** one production app (Netlify) + one production Supabase project; separate
    staging app + staging Supabase project. See `SETUP.md`.

## 3. Retain / modify / defer

**Retain:** design system, theme tokens, store shell, homepage blocks, product card, cart and
wishlist stores, settings pattern, cache tags, seed pattern, Playwright setup.

**Modify:** product status set and publish rules, catalogue queries (published + active merchant
only), demo data (multiple merchants), order/payment schema, auth model, audit log actor.

**Defer (designed for, not built):** merchant self-service portal, multi-merchant checkout,
automatic split settlement, automated merchant notifications beyond email/WhatsApp links.

## 4. Phased plan

| Phase                       | Scope                                                                                                                                                                                                                                                                                                               | Depends on                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **M1 Foundation**           | Schema (merchants, contacts, agreements, product ownership/review, fulfilments, commission snapshots, payments + webhook events, refunds, settlements, campaigns, referrals, profiles/roles, audit log), RLS lockdown migration, commission engine, permission matrix, multi-merchant seed, “Sold by” on storefront | —                                     |
| **M2 Admin operations**     | Supabase Auth sign-in for staff, admin shell, merchants CRUD + agreements, products CRUD (images to Supabase Storage, variants, review workflow), categories, inventory, audit logging, cache invalidation                                                                                                          | M1, Supabase dev/test project (ready) |
| **M3 Customer experience**  | Shop/category/search/filter/sort pages, product page with merchant, cart page, single-merchant checkout with server re-pricing and stock reservation, customer accounts and order history/tracking, reviews with moderation, content/policy pages                                                                   | M1, M2                                |
| **M4 Financial operations** | Payment provider adapter + mock, verification and idempotent webhooks, order lifecycle, refunds with commission reversal, settlement builder/statements/CSV export, finance dashboard, campaign/referral attribution reports                                                                                        | M3, provider decision                 |
| **M5 Reliability**          | Merchant offboarding + data export (CSV + images ZIP), rate limiting, security tests (role isolation, merchant isolation, bundle secret scan), full Playwright coverage, Netlify config, docs                                                                                                                       | M2–M4                                 |

## 5. What needs you

See `BUSINESS_DECISIONS.md`. The Supabase dev/test project is connected, migrated, locked down
(RLS + no browser-role access, verified via its REST API) and seeded. M2 still needs the email
address of the first super admin.
