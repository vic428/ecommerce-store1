import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { AGREEMENT_STATUSES, MERCHANT_STATUSES, type MerchantStatus } from "@/lib/merchants/rules";

export const MERCHANTS_PAGE_SIZE = 20;

export type MerchantListFilters = { q: string; status: string; agreement: string; page: number };

export function parseMerchantFilters(sp: Record<string, string | string[] | undefined>): MerchantListFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const status = one(sp.status);
  const agreement = one(sp.agreement);
  return {
    q: one(sp.q).trim().slice(0, 100),
    status: (MERCHANT_STATUSES as readonly string[]).includes(status) ? status : "",
    agreement: (AGREEMENT_STATUSES as readonly string[]).includes(agreement) ? agreement : "",
    page: Math.max(1, Math.min(1000, Number.parseInt(one(sp.page), 10) || 1)),
  };
}

export async function listMerchants(f: MerchantListFilters) {
  const where: Prisma.MerchantWhereInput = {
    ...(f.status ? { status: f.status as MerchantStatus } : {}),
    ...(f.agreement ? { agreementStatus: f.agreement as (typeof AGREEMENT_STATUSES)[number] } : {}),
    ...(f.q
      ? {
          OR: [
            { businessName: { contains: f.q, mode: "insensitive" } },
            { legalName: { contains: f.q, mode: "insensitive" } },
            { email: { contains: f.q, mode: "insensitive" } },
            { slug: { contains: f.q, mode: "insensitive" } },
            { city: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const now = new Date();
  const [total, rows, statusCounts] = await Promise.all([
    db.merchant.count({ where }),
    db.merchant.findMany({
      where,
      orderBy: [{ businessName: "asc" }],
      skip: (f.page - 1) * MERCHANTS_PAGE_SIZE,
      take: MERCHANTS_PAGE_SIZE,
      select: {
        id: true,
        businessName: true,
        email: true,
        city: true,
        status: true,
        agreementStatus: true,
        onboardedAt: true,
        _count: { select: { products: true } },
        agreements: {
          where: {
            status: "ACTIVE",
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
          },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
          select: { commissionType: true, rateBps: true, fixedAmount: true },
        },
      },
    }),
    db.merchant.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return {
    total,
    pages: Math.max(1, Math.ceil(total / MERCHANTS_PAGE_SIZE)),
    rows,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])) as Partial<
      Record<MerchantStatus, number>
    >,
  };
}

export async function getMerchantDetail(id: string) {
  return db.merchant.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      agreements: { orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] },
      _count: { select: { products: true, orderItems: true, settlements: true } },
    },
  });
}

export async function getMerchantProductCounts(merchantId: string) {
  const rows = await db.product.groupBy({ by: ["status"], where: { merchantId }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
}

export async function getMerchantActivity(merchantId: string) {
  return db.auditLog.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      action: true,
      data: true,
      createdAt: true,
      actor: { select: { email: true, fullName: true } },
    },
  });
}
