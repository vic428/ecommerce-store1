import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";

/** Order statuses where the customer has paid (counts towards gross sales). */
const PAID_STATUSES: OrderStatus[] = [
  "PAID",
  "AWAITING_MERCHANT_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
  "COMPLETED",
  "REFUND_REQUESTED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

const IN_PROGRESS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "AWAITING_MERCHANT_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
  "REFUND_REQUESTED",
];

/**
 * Dashboard figures. All amounts in minor units. Definitions match DATABASE.md
 * ("Reporting terms"): gross = Σ line gross of paid orders; commission = Σ commission minus
 * reversals; refunds = Σ completed refunds.
 */
export async function getDashboardData() {
  const [
    orderGroups,
    lineTotals,
    refunds,
    activeMerchants,
    totalMerchants,
    publishedProducts,
    stockRows,
    openSettlements,
    payableItems,
    recentOrders,
    recentActivity,
  ] = await Promise.all([
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.orderItem.aggregate({
      where: { order: { status: { in: PAID_STATUSES } } },
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        commissionReversed: true,
        merchantNetAmount: true,
        merchantNetReversed: true,
      },
    }),
    db.refund.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    db.merchant.count({ where: { status: "ACTIVE" } }),
    db.merchant.count(),
    db.product.count({ where: { status: "PUBLISHED", merchant: { status: "ACTIVE" } } }),
    db.productVariant.findMany({
      where: {
        isActive: true,
        product: { status: { in: ["PUBLISHED", "OUT_OF_STOCK"] }, merchant: { status: "ACTIVE" } },
      },
      select: { stock: true, lowStockThreshold: true },
    }),
    db.merchantSettlement.aggregate({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
      _count: { _all: true },
      _sum: { netPayable: true },
    }),
    db.orderItem.aggregate({
      where: { settlementStatus: "PAYABLE" },
      _sum: { merchantNetAmount: true, merchantNetReversed: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
        currency: true,
      },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
        actor: { select: { email: true, fullName: true } },
      },
    }),
  ]);

  const countBy = (statuses: OrderStatus[]) =>
    orderGroups.filter((g) => statuses.includes(g.status)).reduce((n, g) => n + g._count._all, 0);
  const s = lineTotals._sum;

  return {
    sales: {
      gross: s.grossAmount ?? 0,
      commission: (s.commissionAmount ?? 0) - (s.commissionReversed ?? 0),
      merchantNet: (s.merchantNetAmount ?? 0) - (s.merchantNetReversed ?? 0),
      refunds: refunds._sum.amount ?? 0,
    },
    orders: {
      total: orderGroups.reduce((n, g) => n + g._count._all, 0),
      completed: countBy(["COMPLETED"]),
      inProgress: countBy(IN_PROGRESS),
      cancelled: countBy(["CANCELLED"]),
    },
    catalogue: {
      activeMerchants,
      totalMerchants,
      publishedProducts,
      lowStock: stockRows.filter((v) => v.stock > 0 && v.stock <= v.lowStockThreshold).length,
      outOfStock: stockRows.filter((v) => v.stock <= 0).length,
    },
    settlements: {
      openCount: openSettlements._count._all,
      openAmount: openSettlements._sum.netPayable ?? 0,
      payableNotSettled:
        (payableItems._sum.merchantNetAmount ?? 0) - (payableItems._sum.merchantNetReversed ?? 0),
    },
    recentOrders,
    recentActivity,
  };
}
