# Onboarding a new client store

> Draft — expanded as each phase lands. Steps marked _(Phase n)_ aren't built yet.

Each client is an independent deployment of this template with its own database. You should not
need to edit components to onboard a client; if you do, that's a template gap worth fixing here
first.

## 1. Collect from the client

- Business name, tagline, short description, logo (SVG or PNG), favicon
- Contact email, phone, address, social links
- Brand colours (primary, secondary) and preferred fonts
- Currency and locale (e.g. `NGN` / `en-NG`, `USD` / `en-US`)
- Categories and products (name, price, sale price, images, stock, variants)
- Delivery options and prices; free-delivery threshold
- Policies: shipping, returns, privacy
- Payment provider account (they own it) and which methods to offer
- Which features they want: wishlist, newsletter, reviews, accounts, promos
- Domain name

## 2. Create the deployment

1. Create the client repo from this template (keep this repo as an upstream remote so template
   fixes can be merged in later).
2. Create a fresh Postgres database for the client.
3. Fill in `.env` from `.env.example` (see [ENVIRONMENT.md](ENVIRONMENT.md)).

## 3. Replace the demo content

| File                              | Change                                                    |
| --------------------------------- | --------------------------------------------------------- |
| `src/config/store.config.ts`      | Business info, currency, features, announcement, shipping |
| `src/config/theme.config.ts`      | Colours, fonts, corner radius                             |
| `src/config/navigation.config.ts` | Header and footer links                                   |
| `src/config/homepage.config.ts`   | Hero copy/images, featured products, promo, benefits      |
| `src/data/categories.ts`          | Client categories                                         |
| `src/data/products.ts`            | Client products (prices in major units)                   |
| `public/`                         | Logo, favicon, hero and product images                    |

Search for `DEMO CONTENT` to make sure nothing is left over. Large catalogues can be entered in
`/admin/products` instead _(Phase 4)_.

## 4. Load and check

```bash
npm run db:deploy
npm run db:seed
npm run test:e2e
```

## 5. Hand over _(Phase 4+)_

1. Create the first Owner admin account with the one-time admin script (no default password).
2. Switch `PAYMENT_PROVIDER` to the real provider with the client's keys; place one live test
   order and refund it.
3. Point the domain, set `NEXT_PUBLIC_SITE_URL`, and confirm HTTPS.
4. Walk the client through `/admin`.
