# Setup

How to run the marketplace locally and how staging and production are configured, without
secrets ever entering the repository or chat.

## Environments

| Environment      | App                       | Database / Auth / Storage                                   | Data      |
| ---------------- | ------------------------- | ----------------------------------------------------------- | --------- |
| Local + dev/test | `npm run dev`             | **Supabase dev/test project** (the one linked to this repo) | Demo seed |
| Production       | Netlify site (production) | **Supabase production project** (create closer to launch)   | Real data |
| Offline (option) | `npm run dev`             | Prisma's local Postgres (`npm run db:dev`)                  | Demo seed |

Dev/test and production never share keys. Each Netlify site has its own environment variables.
The free Supabase plan allows two projects, so no paid branching is needed.

## Local development

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and the three SUPABASE_* values
npm run db:deploy         # apply migrations to the Supabase dev/test project
npm run db:check-rls      # verify RLS + no browser-role access
npm run db:seed           # demo marketplace: 8 merchants, 8 categories, 26 products
npm run dev               # http://localhost:3000
```

Use `npm run db:deploy` (not `db:migrate`) against Supabase: `db:migrate` needs a throwaway shadow
database and may offer to reset the database. Create new migrations against the offline local
database (`npm run db:dev`, with `DATABASE_POOL_MAX="1"`), then deploy them to Supabase.

**Latency:** every query is a round trip to Supabase's region. From a distant location expect
0.4–2 s per round trip, so seeding takes minutes and cold pages are slow. Run migrations and
long scripts in the background.

Tests:

```bash
npm run test:unit         # commission, permissions and availability rules (no DB needed)
npx playwright install chromium   # first time only
npm run test:e2e          # builds and starts the app, then runs desktop/tablet/mobile tests
```

E2E tests write to the database (newsletter sign-ups), so point them at the dev/test project,
never production.

## Supabase projects

For each project (dev/test now, production later):

1. **Connect** dialog → connection string:
   - **Direct** (`db.<ref>.supabase.co:5432`, user `postgres`): fine from a PC with IPv6.
   - **Session pooler** (`aws-0-<region>.pooler.supabase.com:5432`, user `postgres.<ref>`):
     works everywhere (IPv4). **Use this on Netlify.**
   - Replace `[YOUR-PASSWORD]` (brackets included) with the database password. Letters and
     digits only avoids URL-encoding problems.
2. **Project Settings → API Keys**: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (public) and
   `SUPABASE_SECRET_KEY`. **The secret key bypasses all security. It goes only in server-side
   environment variables, never in `NEXT_PUBLIC_*` variables, code or chat.**
3. **Project Settings → Database → SSL configuration**: download the CA certificate and set
   `DATABASE_SSL_CA` (PEM text) so the app verifies the server, not just encrypts. **Required on
   Netlify production deploys**: the app refuses to connect there without it. Elsewhere,
   connections without it are encrypted but unverified (set `DATABASE_SSL_REQUIRE_CA="true"` to
   enforce verification in any environment).
4. **Integrations → GitHub**: leave automatic migration deploys off. This repo's migrations
   are in `prisma/migrations`, applied deliberately with `npm run db:deploy`.
5. **Authentication → URL configuration** (M2): site URL and redirect URLs for the matching
   Netlify domain.
6. Apply migrations: `npm run db:deploy`, then `npm run db:check-rls`.
7. Production only: seed settings and categories with `npm run db:seed -- --no-demo`. Never load
   demo merchants into production.

## Environment variables

See `.env.example` for the full list. Server-only unless prefixed `NEXT_PUBLIC_`.

| Variable                                       | Staging                        | Production             | Notes                                                              |
| ---------------------------------------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                                 | dev/test session pooler URI    | production pooler URI  | Secret                                                             |
| `DATABASE_SSL_CA`                              | optional                       | recommended            | Supabase CA certificate (PEM)                                      |
| `DATABASE_POOL_MAX`                            | unset                          | unset                  | Only `1` for the offline local DB                                  |
| `NEXT_PUBLIC_SITE_URL`                         | dev/test URL                   | production URL         |                                                                    |
| `SUPABASE_URL`                                 | dev/test project URL           | production project URL | M2                                                                 |
| `SUPABASE_PUBLISHABLE_KEY`                     | dev/test publishable key       | production key         | Public by design; RLS blocks table access                          |
| `SUPABASE_SECRET_KEY`                          | dev/test secret key            | production secret key  | **Secret, server only** (M2: Storage uploads, admin user creation) |
| `PAYMENT_PROVIDER`                             | `mock` or provider (test keys) | provider (live keys)   | `mock` refused in production (M4)                                  |
| `PAYMENT_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET` | provider test keys             | provider live keys     | **Secret**                                                         |
| `EMAIL_*`                                      | test sender                    | verified domain        | M3/M4                                                              |

## Netlify (M5 finalises this)

- One site per environment, both linked to this GitHub repo: production deploys `main`,
  staging deploys a `staging` branch (or deploy previews).
- Build command `npm run build`; Next.js runtime is detected automatically.
- **The build reads the database** (pages are prerendered), so the build environment needs
  `DATABASE_URL`.
- Set variables in **Site configuration → Environment variables**, scoped per site. Mark secrets
  as secret so they're hidden in logs.
- Run `npm run db:deploy` and `npm run db:check-rls` before (not during) the deploy that needs
  the new schema.

## Never commit

`.env`, Supabase keys, provider keys, database URLs with passwords, exported customer or
merchant data. `.env*` is gitignored except `.env.example`, which holds placeholders only.
