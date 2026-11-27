# Business decisions needed from VARCH

The code uses clearly marked placeholders for everything below. Nothing here has been invented
as a final value. Grouped by what each one blocks.

## Blocking the next phase (M2: admin dashboard)

| #   | Decision / input                  | What I need                                                                                                                                                                                         | Where it goes           |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | ~~**Supabase dev/test project**~~ | **Done (2026-11-27):** existing GitHub-linked project, migrated, locked down and seeded. Production project still to create before launch.                                                          | `.env` (see `SETUP.md`) |
| 2   | ~~**First super-admin**~~         | **Done (2026-11-27):** admin@varchstores.com created as SUPER_ADMIN (no password; set via /admin/login → Set or reset password).                                                                    | `npm run staff:create`  |
| 3   | **Staff roles**                   | Confirm the three staff roles (Super Admin, Operations, Finance) and the permission split in `src/lib/auth/permissions.ts`. In particular: may Operations see merchant bank details? (currently no) | `permissions.ts`        |

## Commercial terms

| #   | Decision                                                                                                                                     | Current placeholder                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 4   | **Default marketplace commission**: percentage or fixed, and the rate. Or no default (every merchant must have an agreement before selling). | DEMO 10% in `src/config/store.config.ts`                    |
| 5   | **Commission basis**: on the price before or after discounts?                                                                                | `NET_OF_DISCOUNT`                                           |
| 6   | **Who absorbs discounts** (VARCH-funded promotions vs merchant-funded)?                                                                      | VARCH by default; configurable per agreement and per coupon |
| 7   | **Who absorbs payment-gateway fees**: VARCH, the merchant, or split?                                                                         | VARCH by default; configurable per agreement                |
| 8   | **Shipping**: who charges/keeps delivery fees? Does the merchant deliver, or VARCH's courier? Delivery prices and free-delivery threshold.   | DEMO: ₦2,500 standard, ₦5,000 express, free over ₦50,000    |
| 9   | **When a sale becomes payable to the merchant**: on delivery? N days after delivery (return window)?                                         | Not set: settlement module (M4) needs it                    |
| 10  | **Settlement schedule**: weekly, fortnightly, monthly? Minimum payout?                                                                       | Not set                                                     |
| 11  | **Merchant agreements**: actual signed terms per merchant (rates, effective dates).                                                          | DEMO agreements in `src/data/merchants.ts`                  |
| 12  | **Final product prices**: agreed per merchant.                                                                                               | DEMO prices                                                 |

## Payments and regulation

| #   | Decision                                                                                                              | Notes                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 13  | **Payment provider** (e.g. Paystack, Flutterwave).                                                                    | Must support marketplace **split payments / subaccounts** if customer money for merchants should never sit in VARCH's account.                                                                                                             |
| 14  | **Legal structure for collecting money on behalf of merchants.**                                                      | Collecting and later paying out third-party funds through an ordinary business account may require authorisation or a provider-managed split. Get advice from the provider and a lawyer before launch. The code doesn't assume either way. |
| 15  | **Merchant KYC**: what VARCH must collect (CAC registration, BVN/NIN of owners, bank verification) and who stores it. | Only minimal fields exist; KYC documents would go to the provider or a dedicated secure store.                                                                                                                                             |
| 16  | **Refund policy**: who approves, time limits, who bears refund costs.                                                 | Refund approval is Finance-only in the permission matrix                                                                                                                                                                                   |
| 17  | **Tax/VAT**: are prices VAT-inclusive? Does VARCH charge VAT on commission?                                           | `pricesIncludeTax: true`, 0% tax placeholder                                                                                                                                                                                               |

## Brand and content

| #   | Decision                                                                                                                                                      | Current placeholder                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 18  | Final marketplace **name**, tagline, logo, favicon, colours                                                                                                   | "VARCH Marketplace", yellow/black reference theme |
| 19  | **Production domain** (and staging subdomain)                                                                                                                 | none                                              |
| 20  | Support **email, phone, WhatsApp**, business address                                                                                                          | `support@varch.example`, `+234 000 000 0000`      |
| 21  | **Legal pages**: terms, privacy policy, shipping & returns, merchant terms                                                                                    | not written. Needs legal review                   |
| 22  | Social media links                                                                                                                                            | generic platform URLs                             |
| 23  | **Data retention**: how long to keep customer and merchant data after an account closes or a merchant leaves; export availability period for merchant exports | not set; M5 offboarding needs it                  |

## Operations

| #   | Decision                                                                                             | Notes                                                |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 24  | How merchants are **notified of new orders** (email, WhatsApp, phone) and expected confirmation time | `Merchant.preferredChannel` exists; automation in M4 |
| 25  | **Marketplace categories** final list                                                                | demo list in `src/data/categories.ts`                |
| 26  | Campaign/referral programme: do referrers earn anything?                                             | Tracking only, no payouts implemented                |
