# Setup

How to run the marketplace locally and how staging and production are configured, without
secrets ever entering the repository or chat.

## Environments

| Environment | App                       | Database / Auth / Storage                                                             | Data                   |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------- | ---------------------- |
| Local       | `npm run dev`             | Local Postgres (`npm run db:dev`) now; staging Supabase once Supabase Auth lands (M2) | Demo seed              |
| Staging     | Netlify site (staging)    | **Supabase staging project**                                                          | Demo or test data only |
| Production  | Netlify site (production) | **Supabase production project**                                                       | Real data              |

Staging and production never share keys. Each Netlify site has its own environment variables.

## Local development

```bash
npm install
cp .env.example .env
npm run db:dev            # starts Prisma's local Postgres; paste its URL into DATABASE_URL
                          # and set DATABASE_POOL_MAX="1"
npm run db:migrate        # apply migrations
npm run db:check-rls      # verify RLS is on for every table
npm run db:seed           # demo marketplace: 8 merchants, 8 categories, 26 products
npm run dev               # http://localhost:3000
```

Tests:

```bash
npm run test:unit         # commission, permissions and availability rules (no DB needed)
npx playwright install chromium   # first time only
npm run test:e2e          # builds and starts the app, then runs desktop/tablet/mobile tests
```

The local dev database handles about one connection at a time. If it stops responding
(`ECONNREFUSED` or `P1017`), restart it with `npm run db:dev`.

## Supabase projects (you create these)

For **each** of staging and production:

1. Create a Supabase project. Note its region.
2. **Database → Connection string**: copy the _Session pooler_ URI (port 5432) for migrations
   and the _Transaction pooler_ URI (port 6543) for the running app.
3. **Project Settings → API**: note the project URL, the `anon` public key and the
   `service_role` key. **The service-role key bypasses all security. It goes only in
   server-side environment variables, never in `NEXT_PUBLIC_*` variables, code or chat.**
4. **Authentication → URL configuration**: set the site URL and redirect URLs to the matching
   Netlify domain.
5. Apply migrations from your machine or CI: `DATABASE_URL=<session pooler URI> npm run db:deploy`,
   then `npm run db:check-rls`.
6. Seed only settings and categories: `npm run db:seed -- --no-demo`. Never load demo
   merchants into production.

## Environment variables

See `.env.example` for the full list. Server-only unless prefixed `NEXT_PUBLIC_`.

| Variable                                       | Staging                        | Production             | Notes                                                              |
| ---------------------------------------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                                 | staging pooler URI             | production pooler URI  | Secret                                                             |
| `DATABASE_POOL_MAX`                            | unset                          | unset                  | Only `1` for the local dev DB                                      |
| `NEXT_PUBLIC_SITE_URL`                         | staging URL                    | production URL         |                                                                    |
| `NEXT_PUBLIC_SUPABASE_URL`                     | staging project URL            | production project URL | M2                                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                | staging anon key               | production anon key    | Public by design; RLS blocks table access                          |
| `SUPABASE_SERVICE_ROLE_KEY`                    | staging                        | production             | **Secret, server only** (M2: Storage uploads, admin user creation) |
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
