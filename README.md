# VARCH Marketplace

One curated, commission-based multi-vendor marketplace operated by VARCH Enterprises.
Independent merchants supply products; VARCH lists, promotes and sells them, coordinates
fulfilment, and earns an agreed commission on completed sales. ("VARCH Marketplace" is a
placeholder name; see [BUSINESS_DECISIONS.md](BUSINESS_DECISIONS.md).)

**Status:** marketplace phase **M1 (foundation)** is done: schema, commission engine, permissions,
RLS lockdown, multi-merchant demo data, "Sold by" on the storefront. Admin, checkout and finance
modules follow; see [docs/ARCHITECTURE_CHANGE.md](docs/ARCHITECTURE_CHANGE.md).

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 +
PostgreSQL (Supabase in staging/production) · zod · Playwright · Node's built-in test runner.

## Getting started

See [SETUP.md](SETUP.md) for local, staging and production setup. Short version:

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL
npm run db:dev              # local Postgres; set DATABASE_POOL_MAX="1"
npm run db:migrate && npm run db:check-rls && npm run db:seed
npm run dev
```

## Scripts

| Script                 | What it does                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run dev`          | Development server                                                        |
| `npm run build`        | Production build (reads the database to prerender)                        |
| `npm run lint`         | ESLint                                                                    |
| `npm run typecheck`    | Route types + TypeScript                                                  |
| `npm run format`       | Prettier                                                                  |
| `npm run test:unit`    | Commission, permission and availability rules                             |
| `npm run test:e2e`     | Playwright (desktop, tablet, mobile) against a production build           |
| `npm run db:dev`       | Start local Prisma Postgres                                               |
| `npm run db:migrate`   | Create/apply migrations (development)                                     |
| `npm run db:deploy`    | Apply migrations (staging/production)                                     |
| `npm run db:check-rls` | Fail if any table has Row Level Security disabled                         |
| `npm run db:seed`      | Seed settings + categories (+ demo merchants/products unless `--no-demo`) |
| `npm run db:studio`    | Browse the database                                                       |

## Project layout

```
prisma/
  schema.prisma          marketplace schema (merchants, products, orders, commissions, settlements)
  migrations/            all schema changes, incl. RLS lockdown and CHECK constraints
  seed.ts                loads src/config + src/data
scripts/check-rls.ts     RLS verification
src/
  config/                marketplace settings seed (brand, commerce, commission default…)
  data/                  DEMO merchants, categories, products
  lib/
    commission.ts        commission engine (integer maths, snapshots, refunds)
    availability.ts      listing and purchase rules
    auth/permissions.ts  roles, permissions, merchant scoping
    settings-schema.ts   zod schemas for every setting
    catalog.ts, settings.ts  cached storefront reads
  components/, app/      storefront UI
e2e/                     Playwright tests
```

## Docs

- [docs/ARCHITECTURE_CHANGE.md](docs/ARCHITECTURE_CHANGE.md): what changed from the single-store
  template, decisions, phased plan
- [DATABASE.md](DATABASE.md): data relationships, commission formulas, settlements, security
- [SETUP.md](SETUP.md): environments, Supabase, Netlify, secrets
- [BUSINESS_DECISIONS.md](BUSINESS_DECISIONS.md): decisions and inputs needed from VARCH
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md): environment variable reference
- [docs/ROADMAP.md](docs/ROADMAP.md): storefront phase notes from the original template
