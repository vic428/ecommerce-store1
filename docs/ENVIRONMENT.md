# Environment variables

Set these in `.env` for local development, and in the hosting provider's environment settings
for each deployed store. `.env` is gitignored; `.env.example` is the committed template.

Variables prefixed `NEXT_PUBLIC_` are sent to the browser. **Never** put a secret in one.

| Variable                 | Required          | Secret | Supplied by     | Purpose                                                             |
| ------------------------ | ----------------- | ------ | --------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`           | Always            | Yes    | Developer       | Postgres connection string for this store's own database            |
| `DATABASE_POOL_MAX`      | Optional          | No     | Developer       | Max DB connections per process; `1` for the local `db:dev` database |
| `NEXT_PUBLIC_SITE_URL`   | Always            | No     | Developer       | Public base URL; used in emails, canonical URLs, payment callbacks  |
| `AUTH_SECRET`            | From Phase 3      | Yes    | Developer       | Signs session/CSRF tokens. Generate per deployment; never reuse     |
| `PAYMENT_PROVIDER`       | From Phase 3      | No     | Developer       | `mock` (test only) or a real provider key                           |
| `PAYMENT_SECRET_KEY`     | Real payments     | Yes    | Business owner  | Provider secret key, from the business's own provider account       |
| `PAYMENT_PUBLIC_KEY`     | If provider needs | No     | Business owner  | Provider publishable key                                            |
| `PAYMENT_WEBHOOK_SECRET` | Real payments     | Yes    | Business owner  | Verifies payment webhooks                                           |
| `STORAGE_DRIVER`         | From Phase 4      | No     | Developer       | `local` (development only) or `s3`                                  |
| `S3_*`                   | Production        | Yes    | Developer/owner | Bucket for product images (AWS S3, Cloudflare R2, …)                |
| `EMAIL_DRIVER`           | From Phase 3      | No     | Developer       | `console` (development only) or `resend`                            |
| `EMAIL_FROM`             | Production        | No     | Business owner  | Sender, on a domain the business has verified                       |
| `RESEND_API_KEY`         | Production        | Yes    | Developer/owner | Email API key                                                       |

## Generating `AUTH_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Notes

- Payment keys always belong to the **business's** provider account, so payouts go to them.
  Use the provider's test keys until launch day.
- `mock` payments and `local` storage/email are refused in production builds (enforced from
  Phase 3/4), so a store can't accidentally go live without real integrations.
- The local `npm run db:dev` database uses fixed `postgres/postgres` credentials and listens on
  localhost only. Don't reuse that pattern anywhere else.
