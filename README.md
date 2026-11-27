# E-commerce Store Template

A reusable storefront and admin dashboard for single-store deployments. Each client gets
their own deployment and their own database; branding, catalogue, currency and features are
configuration, not code.

The bundled demo store is **ShopEase** (yellow/black, Naira prices). Everything ShopEase-specific
lives in `src/config/` and `src/data/` and is marked `⚠ DEMO CONTENT`.

**Status:** Phase 1 done: the themed storefront shell and homepage render from database settings.
Shop, product, cart and checkout pages come next. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL ·
zod · Playwright

## Getting started

Requirements: Node.js 20.9+ (developed on Node 24).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in DATABASE_URL (see below)
npm run db:dev              # optional: starts a local Postgres, prints its URL
npm run db:migrate          # create tables
npm run db:seed             # load the demo store
npm run dev                 # http://localhost:3000
```

No local Postgres? `npm run db:dev` runs Prisma's local Postgres server (no Docker needed).
Copy the `postgres://…` URL it prints into `DATABASE_URL`, and set `DATABASE_POOL_MAX="1"`: that
local server only handles about one connection at a time. A hosted database (Neon, Supabase,
RDS…) works the same way and needs no pool limit.

`npm run build` prerenders pages from the database, so the database must be reachable when you build.

## Scripts

| Script               | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run dev`        | Development server                                      |
| `npm run build`      | Production build                                        |
| `npm run lint`       | ESLint                                                  |
| `npm run typecheck`  | TypeScript check                                        |
| `npm run format`     | Prettier (write)                                        |
| `npm run db:dev`     | Start local Prisma Postgres in the background           |
| `npm run db:migrate` | Create/apply migrations in development                  |
| `npm run db:deploy`  | Apply migrations in production (CI/CD)                  |
| `npm run db:seed`    | Seed settings, homepage, shipping, categories, products |
| `npm run db:reset`   | Drop and recreate the dev database, then seed           |
| `npm run db:studio`  | Browse the database                                     |
| `npm run test:e2e`   | Playwright tests (desktop, tablet, mobile)              |

First Playwright run: `npx playwright install chromium`. Tests build and start the production
app on port 3100 (set `E2E_DEV=1` to use the dev server instead) and expect the demo seed. Point
`DATABASE_URL` at a test database, never a live store.

## Project layout

```
prisma/
  schema.prisma        database schema (one store per database)
  seed.ts              loads src/config + src/data into the database
src/
  config/              store identity, theme, navigation, homepage  ← per client
  data/                demo catalogue (categories, products)         ← per client
  lib/
    settings-schema.ts zod schemas + defaults for every setting
    currency.ts        money formatting (integer minor units)
    db.ts              server-only Prisma client
  generated/prisma/    generated client (gitignored)
e2e/                   Playwright tests
docs/                  environment, onboarding, roadmap
```

## How configuration works

1. `src/config/*` and `src/data/*` hold the **starting values** for a store.
2. `npm run db:seed` validates them against `src/lib/settings-schema.ts` and writes them to the
   database.
3. At runtime the storefront reads settings **from the database**, so staff can change them in
   `/admin` without a redeploy. Missing values fall back to the schema defaults.
4. Re-running the seed never overwrites settings a store has already saved, unless you pass
   `--reset-settings`.

Money is always stored as integers in minor units (kobo, cents). Prices are recalculated on the
server at checkout; client-side totals are display-only.

## Docs

- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — every environment variable and who supplies it
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — setting up a new client store
- [docs/ROADMAP.md](docs/ROADMAP.md) — build phases and status
