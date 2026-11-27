-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'FINANCE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "MerchantUserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('LEAD', 'ONBOARDING', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('NONE', 'DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED_PER_UNIT');

-- CreateEnum
CREATE TYPE "CommissionBasis" AS ENUM ('GROSS_BEFORE_DISCOUNT', 'NET_OF_DISCOUNT');

-- CreateEnum
CREATE TYPE "CostBearer" AS ENUM ('VARCH', 'MERCHANT');

-- CreateEnum
CREATE TYPE "AgreementRecordStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('VARCH_SOCIAL', 'MERCHANT_SOCIAL', 'INFLUENCER', 'DIRECT', 'EMAIL', 'PAID_ADS', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('INFLUENCER', 'CREATOR', 'MERCHANT', 'PARTNER', 'CUSTOMER', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'AWAITING_MERCHANT_CONFIRMATION', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUND_REQUESTED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FulfilmentStatus" AS ENUM ('AWAITING_MERCHANT_CONFIRMATION', 'CONFIRMED', 'UNAVAILABLE', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "CommissionSource" AS ENUM ('PRODUCT_OVERRIDE', 'MERCHANT_AGREEMENT', 'MARKETPLACE_DEFAULT');

-- CreateEnum
CREATE TYPE "SettlementItemStatus" AS ENUM ('NOT_DUE', 'PAYABLE', 'IN_SETTLEMENT', 'SETTLED', 'ON_HOLD', 'VOID');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'APPROVED', 'MARKED_PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementItemType" AS ENUM ('SALE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('REQUESTED', 'READY', 'EXPIRED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductStatus_new" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'OUT_OF_STOCK', 'UNAVAILABLE', 'ARCHIVED', 'REJECTED');
ALTER TABLE "Product" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
DROP TYPE "ProductStatus_old";
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
ALTER TYPE "InventoryReason" ADD VALUE 'MERCHANT_UPDATE';

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryAdjustment" DROP CONSTRAINT "InventoryAdjustment_variantId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryAdjustment" DROP CONSTRAINT "InventoryAdjustment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryAdjustment" DROP CONSTRAINT "InventoryAdjustment_adminUserId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerSession" DROP CONSTRAINT "CustomerSession_customerId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_couponId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderEvent" DROP CONSTRAINT "OrderEvent_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "AdminSession" DROP CONSTRAINT "AdminSession_adminUserId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_adminUserId_fkey";

-- DropIndex
DROP INDEX "Order_paymentStatus_fulfillmentStatus_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "commissionFixedAmount" INTEGER,
ADD COLUMN     "commissionRateBps" INTEGER,
ADD COLUMN     "commissionType" "CommissionType",
ADD COLUMN     "merchantId" TEXT NOT NULL,
ADD COLUMN     "merchantQuotedPrice" INTEGER,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" UUID,
ADD COLUMN     "statusReason" TEXT;

-- AlterTable
ALTER TABLE "InventoryAdjustment" DROP COLUMN "adminUserId",
ADD COLUMN     "actorProfileId" UUID;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "orderItemId" TEXT;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "emailVerifiedAt",
DROP COLUMN "passwordHash",
ADD COLUMN     "anonymisedAt" TIMESTAMP(3),
ADD COLUMN     "profileId" UUID;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "fulfillmentStatus",
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "referralSourceId" TEXT,
ADD COLUMN     "refundedTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "lineTotal",
ADD COLUMN     "agreementId" TEXT,
ADD COLUMN     "commissionAmount" INTEGER NOT NULL,
ADD COLUMN     "commissionBaseAmount" INTEGER NOT NULL,
ADD COLUMN     "commissionBasis" "CommissionBasis" NOT NULL,
ADD COLUMN     "commissionFixedAmount" INTEGER,
ADD COLUMN     "commissionRateBps" INTEGER,
ADD COLUMN     "commissionReversed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "commissionSource" "CommissionSource" NOT NULL,
ADD COLUMN     "commissionType" "CommissionType" NOT NULL,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountBearer" "CostBearer" NOT NULL,
ADD COLUMN     "fulfilmentId" TEXT NOT NULL,
ADD COLUMN     "grossAmount" INTEGER NOT NULL,
ADD COLUMN     "merchantId" TEXT NOT NULL,
ADD COLUMN     "merchantName" TEXT NOT NULL,
ADD COLUMN     "merchantNetAmount" INTEGER NOT NULL,
ADD COLUMN     "merchantNetReversed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentFeeAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentFeeBearer" "CostBearer" NOT NULL,
ADD COLUMN     "refundedAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "settlementStatus" "SettlementItemStatus" NOT NULL DEFAULT 'NOT_DUE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "feeAmount" INTEGER,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "fundedBy" "CostBearer" NOT NULL DEFAULT 'VARCH',
ADD COLUMN     "merchantId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "adminUserId",
ADD COLUMN     "actorProfileId" UUID,
ADD COLUMN     "merchantId" TEXT;

-- DropTable
DROP TABLE "CustomerSession";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "AdminUser";

-- DropTable
DROP TABLE "AdminSession";

-- DropEnum
DROP TYPE "FulfillmentStatus";

-- DropEnum
DROP TYPE "AdminRole";

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "profileId" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "grantedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("profileId","role")
);

-- CreateTable
CREATE TABLE "MerchantUser" (
    "profileId" UUID NOT NULL,
    "merchantId" TEXT NOT NULL,
    "role" "MerchantUserRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantUser_pkey" PRIMARY KEY ("profileId","merchantId")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "legalName" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "registrationNumber" TEXT,
    "registrationType" TEXT,
    "preferredChannel" "ContactChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "MerchantStatus" NOT NULL DEFAULT 'LEAD',
    "agreementStatus" "AgreementStatus" NOT NULL DEFAULT 'NONE',
    "settlementBankName" TEXT,
    "settlementAccountName" TEXT,
    "settlementAccountLast4" TEXT,
    "providerRecipientRef" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantContact" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAgreement" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "AgreementRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "rateBps" INTEGER,
    "fixedAmount" INTEGER,
    "commissionBasis" "CommissionBasis" NOT NULL DEFAULT 'NET_OF_DISCOUNT',
    "discountBearer" "CostBearer" NOT NULL DEFAULT 'VARCH',
    "paymentFeeBearer" "CostBearer" NOT NULL DEFAULT 'VARCH',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "documentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "merchantId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralSource" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL,
    "contact" TEXT,
    "campaignId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderFulfilment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "FulfilmentStatus" NOT NULL DEFAULT 'AWAITING_MERCHANT_CONFIRMATION',
    "merchantNotifiedAt" TIMESTAMP(3),
    "merchantConfirmedAt" TIMESTAMP(3),
    "confirmationNote" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderFulfilment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "payload" JSONB NOT NULL,
    "signatureOk" BOOLEAN NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "providerRef" TEXT,
    "requestedById" UUID,
    "approvedById" UUID,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundItem" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "commissionReversed" INTEGER NOT NULL,
    "merchantNetReversed" INTEGER NOT NULL,

    CONSTRAINT "RefundItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSettlement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "grossAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "refundAmount" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "paymentFeeAmount" INTEGER NOT NULL,
    "adjustmentAmount" INTEGER NOT NULL DEFAULT 0,
    "netPayable" INTEGER NOT NULL,
    "paidAmount" INTEGER,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "approvedById" UUID,
    "markedPaidById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementItem" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "type" "SettlementItemType" NOT NULL,
    "orderItemId" TEXT,
    "refundItemId" TEXT,
    "description" TEXT NOT NULL,
    "merchantAmount" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantExport" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'REQUESTED',
    "files" JSONB,
    "expiresAt" TIMESTAMP(3),
    "requestedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "MerchantUser_merchantId_idx" ON "MerchantUser"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");

-- CreateIndex
CREATE INDEX "Merchant_status_idx" ON "Merchant"("status");

-- CreateIndex
CREATE INDEX "MerchantContact_merchantId_idx" ON "MerchantContact"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantAgreement_merchantId_status_effectiveFrom_idx" ON "MerchantAgreement"("merchantId", "status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_code_key" ON "Campaign"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralSource_code_key" ON "ReferralSource"("code");

-- CreateIndex
CREATE INDEX "OrderFulfilment_merchantId_status_idx" ON "OrderFulfilment"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrderFulfilment_orderId_merchantId_key" ON "OrderFulfilment"("orderId", "merchantId");

-- CreateIndex
CREATE INDEX "PaymentEvent_reference_idx" ON "PaymentEvent"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_eventId_key" ON "PaymentEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "RefundItem_orderItemId_idx" ON "RefundItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSettlement_reference_key" ON "MerchantSettlement"("reference");

-- CreateIndex
CREATE INDEX "MerchantSettlement_merchantId_status_idx" ON "MerchantSettlement"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementItem_orderItemId_key" ON "SettlementItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementItem_refundItemId_key" ON "SettlementItem"("refundItemId");

-- CreateIndex
CREATE INDEX "SettlementItem_settlementId_idx" ON "SettlementItem"("settlementId");

-- CreateIndex
CREATE INDEX "MerchantExport_merchantId_idx" ON "MerchantExport"("merchantId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Product_merchantId_status_idx" ON "Product"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_profileId_key" ON "Customer"("profileId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "OrderItem_merchantId_settlementStatus_idx" ON "OrderItem"("merchantId", "settlementStatus");

-- CreateIndex
CREATE INDEX "OrderItem_fulfilmentId_idx" ON "OrderItem"("fulfilmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "AuditLog_merchantId_createdAt_idx" ON "AuditLog"("merchantId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantUser" ADD CONSTRAINT "MerchantUser_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantUser" ADD CONSTRAINT "MerchantUser_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantContact" ADD CONSTRAINT "MerchantContact_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAgreement" ADD CONSTRAINT "MerchantAgreement_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralSource" ADD CONSTRAINT "ReferralSource_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_referralSourceId_fkey" FOREIGN KEY ("referralSourceId") REFERENCES "ReferralSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFulfilment" ADD CONSTRAINT "OrderFulfilment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFulfilment" ADD CONSTRAINT "OrderFulfilment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "OrderFulfilment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "MerchantAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "RefundItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSettlement" ADD CONSTRAINT "MerchantSettlement_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementItem" ADD CONSTRAINT "SettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "MerchantSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementItem" ADD CONSTRAINT "SettlementItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementItem" ADD CONSTRAINT "SettlementItem_refundItemId_fkey" FOREIGN KEY ("refundItemId") REFERENCES "RefundItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantExport" ADD CONSTRAINT "MerchantExport_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorProfileId_fkey" FOREIGN KEY ("actorProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security lockdown (defence in depth)
--
-- All application reads/writes go through server code (Prisma, table owner), which bypasses
-- RLS. Supabase also exposes every public table through its REST API to the `anon` and
-- `authenticated` roles using the public anon key. Enabling RLS with NO policies, and revoking
-- table privileges from those roles, means the browser cannot read or write any table directly.
--
-- Any future table must be added here too (see DATABASE.md, "RLS"). The `rls.spec` check in
-- the test suite fails if a public table has RLS disabled.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  -- Supabase roles only exist on Supabase; skip quietly elsewhere (local dev, CI).
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
  END IF;
END $$;

-- Financial integrity constraints Prisma can't express.
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_amounts_nonnegative" CHECK (
  "unitPrice" >= 0 AND "grossAmount" >= 0 AND "discountAmount" >= 0 AND "commissionAmount" >= 0
  AND "refundedAmount" >= 0 AND "commissionReversed" >= 0 AND "merchantNetReversed" >= 0
);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_refund_within_line" CHECK (
  "refundedQuantity" <= "quantity" AND "refundedAmount" <= "grossAmount" - "discountAmount"
  AND "commissionReversed" <= "commissionAmount"
);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_commission_shape" CHECK (
  ("commissionType" = 'PERCENTAGE' AND "commissionRateBps" BETWEEN 0 AND 10000)
  OR ("commissionType" = 'FIXED_PER_UNIT' AND "commissionFixedAmount" >= 0)
);
ALTER TABLE "MerchantAgreement" ADD CONSTRAINT "MerchantAgreement_commission_shape" CHECK (
  ("commissionType" = 'PERCENTAGE' AND "rateBps" BETWEEN 0 AND 10000)
  OR ("commissionType" = 'FIXED_PER_UNIT' AND "fixedAmount" >= 0)
);
ALTER TABLE "MerchantAgreement" ADD CONSTRAINT "MerchantAgreement_window" CHECK (
  "effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom"
);
ALTER TABLE "Product" ADD CONSTRAINT "Product_prices_nonnegative" CHECK (
  "price" >= 0 AND ("compareAtPrice" IS NULL OR "compareAtPrice" >= 0)
);
ALTER TABLE "Product" ADD CONSTRAINT "Product_commission_override_shape" CHECK (
  "commissionType" IS NULL
  OR ("commissionType" = 'PERCENTAGE' AND "commissionRateBps" BETWEEN 0 AND 10000)
  OR ("commissionType" = 'FIXED_PER_UNIT' AND "commissionFixedAmount" >= 0)
);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_nonnegative" CHECK ("amount" >= 0);
