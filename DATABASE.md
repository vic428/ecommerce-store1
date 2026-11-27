# Database

One shared PostgreSQL database (Supabase in staging/production) for the whole marketplace.
Merchants are rows, not separate databases. Schema: `prisma/schema.prisma`. Changes are made
only through migrations in `prisma/migrations/`.

## Conventions

| Rule      | How                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Money     | `Int` in minor units (kobo). Never floats.                                                                                       |
| Rates     | `Int` basis points: 1000 = 10.00%, max 10000.                                                                                    |
| Rounding  | Half up, done once per line in `src/lib/commission.ts` (BigInt maths).                                                           |
| History   | Order items snapshot product, price, merchant and commission.                                                                    |
| Deletes   | Financial/order relations use `onDelete: Restrict`. Merchants are terminated, products archived.                                 |
| Integrity | CHECK constraints for non-negative amounts, rate ranges, refund ≤ line, rating 1–5 (see the `marketplace_foundation` migration). |
| Security  | RLS enabled on every table; no `anon`/`authenticated` access. `npm run db:check-rls` verifies.                                   |

## Entity map

Table names follow the Prisma model names. Mapping to the logical entities in the brief:

| Brief                                               | Model(s)                                                        |
| --------------------------------------------------- | --------------------------------------------------------------- |
| profiles                                            | `Profile` (id = Supabase `auth.users.id`)                       |
| user_roles                                          | `UserRole` (SUPER_ADMIN, OPERATIONS, FINANCE, CUSTOMER)         |
| merchants / merchant_contacts / merchant_agreements | `Merchant`, `MerchantContact`, `MerchantAgreement`              |
| (future portal)                                     | `MerchantUser` links a profile to the merchants it may act for  |
| categories                                          | `Category` (nested via `parentId`, VARCH-controlled)            |
| products / product_variants / product_images        | `Product`, `ProductVariant`, `ProductImage`                     |
| inventory / inventory_movements                     | `ProductVariant.stock` + `InventoryAdjustment` ledger           |
| customers / customer_addresses                      | `Customer` (optional `profileId`), `Address`                    |
| orders / order_items                                | `Order`, `OrderFulfilment` (per merchant), `OrderItem`          |
| payments                                            | `Payment`, `PaymentEvent` (webhook idempotency)                 |
| commissions                                         | Snapshot columns on `OrderItem` (+ reversals on `RefundItem`)   |
| refunds                                             | `Refund`, `RefundItem`                                          |
| merchant_settlements / settlement_items             | `MerchantSettlement`, `SettlementItem`                          |
| reviews / coupons                                   | `Review`, `Coupon`                                              |
| campaigns / referral_sources                        | `Campaign`, `ReferralSource` (+ attribution columns on `Order`) |
| store_settings                                      | `Setting` (key/value, zod-validated)                            |
| admin_activity_logs                                 | `AuditLog`                                                      |
| (offboarding)                                       | `MerchantExport`                                                |

## Key relationships

```
Merchant 1─* Product *─1 Category (shared, nested)
Merchant 1─* MerchantAgreement
Product  1─* ProductVariant 1─* InventoryAdjustment

Order 1─* OrderFulfilment *─1 Merchant        (one per merchant in the order)
Order 1─* OrderItem       *─1 Merchant        (snapshot: merchantName, commission…)
OrderItem *─1 OrderFulfilment
OrderItem *─0..1 MerchantAgreement            (which agreement priced it)
Order 1─* Payment ; PaymentEvent keyed by (provider, eventId)
Order 1─* Refund 1─* RefundItem *─1 OrderItem

MerchantSettlement 1─* SettlementItem
SettlementItem ─0..1 OrderItem   (SALE line, unique: an item is settled once)
SettlementItem ─0..1 RefundItem  (REFUND line, unique: a refund is deducted once)
```

**Ownership rules**

- `Product.merchantId` is required. Every product belongs to exactly one merchant.
- `OrderItem.merchantId` is required and copied from the product at sale time, along with
  `merchantName`. Later product edits or merchant changes don't alter it.
- MVP checkout: one merchant per order (`commission.checkoutMode = SINGLE_MERCHANT`). The model
  already allows several `OrderFulfilment` rows per order for split orders later.

## Visibility and purchase rules (`src/lib/availability.ts`)

- **Listed publicly:** product status `PUBLISHED` or `OUT_OF_STOCK`, merchant status `ACTIVE`,
  category active (or none).
- **Purchasable:** merchant `ACTIVE`, product `PUBLISHED`, variant active, stock ≥ quantity.
- Any other merchant status (LEAD, ONBOARDING, PENDING_APPROVAL, SUSPENDED, INACTIVE,
  TERMINATED) hides and blocks all of that merchant's products, without deleting them.

## Commission calculation (`src/lib/commission.ts`)

### Agreement lifecycle (`src/lib/merchants/rules.ts`)

- New agreements start as **DRAFT** (editable by deleting and re-creating) or are activated
  immediately. Activating sets status **ACTIVE**; its terms are then never edited. To change
  terms, add a new agreement.
- Activating an agreement starting on date D gives every ACTIVE agreement still running at D an
  `effectiveTo` of D, so exactly one is in force at a time and the old one applies until the
  switch-over. An ACTIVE agreement that starts on/after D is a conflict (terminate it first).
- **Terminate** sets status TERMINATED and caps `effectiveTo` at now. Draft agreements can be
  discarded. Past windows are never rewritten, and orders keep their commission snapshot either
  way.
- Only `agreements:write` (Super Admin) can create, activate or end agreements.

### Which rule applies (resolved when the order is created)

1. **Product override**: `Product.commissionType` set.
2. **Merchant agreement**: the `ACTIVE` agreement whose window contains the order time
   (`effectiveFrom` ≤ t < `effectiveTo`). If several overlap, the latest `effectiveFrom` wins.
3. **Marketplace default**: `Setting["commission"].default`.
4. **None**: the item cannot be checked out. There is no silent fallback rate.

Cost-bearer rules (who absorbs discounts and payment fees) and the commission basis come from
the agreement, or the default when there's no agreement, including for product overrides.

### Per line

```
gross       = unitPrice × quantity
discount    = order discount allocated to this line (proportional to gross, exact-sum)
base        = gross                       if basis = GROSS_BEFORE_DISCOUNT
            = gross − discount            if basis = NET_OF_DISCOUNT
commission  = round_half_up(base × rateBps / 10000)     PERCENTAGE
            = min(fixedAmount × quantity, base)          FIXED_PER_UNIT
merchantNet = gross − commission − (discount if discountBearer = MERCHANT)
              (commission is reduced if needed so merchantNet ≥ 0)
```

Coupons carry `fundedBy`, which overrides the agreement's `discountBearer` for that discount.

**Snapshot written to `OrderItem`:** `commissionSource`, `agreementId`, `commissionType`,
`commissionRateBps` / `commissionFixedAmount`, `commissionBasis`, `discountBearer`,
`paymentFeeBearer`, `grossAmount`, `discountAmount`, `commissionBaseAmount`,
`commissionAmount`, `merchantNetAmount`. Never recalculated afterwards.

### Payment fees

The provider's fee for a payment is allocated across the order's lines in proportion to the
amount paid per line (`paymentFeeAmount`). It reduces the merchant's payable amount only when
`paymentFeeBearer = MERCHANT`; otherwise VARCH absorbs it.

### Refunds

Each `RefundItem` reverses commission and merchant net in proportion to the share of the
customer-paid line amount (`gross − discount`) refunded. Reversals are computed on the cumulative
refunded amount and differenced, so a run of partial refunds ending in a full refund reverses
exactly 100%. Running totals live on `OrderItem` (`refundedAmount`, `commissionReversed`,
`merchantNetReversed`).

### What VARCH owes a merchant for a line

```
payable = merchantNet − merchantNetReversed − (paymentFee if paymentFeeBearer = MERCHANT)
```

### Reporting terms

| Figure                     | Source                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| Gross marketplace sales    | Σ `OrderItem.grossAmount` (paid orders)                                   |
| Discounts                  | Σ `OrderItem.discountAmount`                                              |
| Refunds                    | Σ `RefundItem.amount` (completed refunds)                                 |
| Payment processing charges | Σ `Payment.feeAmount`                                                     |
| VARCH commission           | Σ `commissionAmount − commissionReversed`                                 |
| Merchant amount payable    | Σ payable (above) for items with settlementStatus PAYABLE / IN_SETTLEMENT |
| Merchant amount settled    | Σ `MerchantSettlement.paidAmount` where status MARKED_PAID                |

Shipping charges are not part of any commission base and aren't owed to merchants unless a
delivery arrangement says otherwise (pending business decision).

## Settlements

A settlement groups one merchant's payable `OrderItem`s (SALE lines) and refund reversals
(REFUND lines, negative) for a period into a statement. Unique keys stop an item or refund being
settled twice. Status flow: DRAFT → APPROVED → MARKED_PAID (or CANCELLED). **MARKED_PAID means
VARCH recorded a transfer and its reference; it does not prove the bank completed it.** No
wallet or stored balance exists. The payable amount is always recomputed from line records.

## Security

- All data access goes through server code with the table-owner connection; it checks roles and
  merchant scope in `src/lib/auth/permissions.ts` before every protected query.
- RLS is enabled on every public table with no policies for `anon`/`authenticated`, and those
  roles' table privileges are revoked. Supabase's public REST API therefore can't read or write
  anything. **Every new table needs `ENABLE ROW LEVEL SECURITY` in its migration**;
  `npm run db:check-rls` fails otherwise.
- Bank details: only bank name, account name and last 4 digits are stored; full details live
  with the payment provider (`providerRecipientRef`).
