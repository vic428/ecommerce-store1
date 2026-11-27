import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getMerchantActivity, getMerchantDetail, getMerchantProductCounts } from "@/lib/admin/merchants";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/currency";
import { agreementPhase, formatBps, hidesListings, merchantStatusLabel } from "@/lib/merchants/rules";
import { EmptyState, PageHeader, Section, StatusBadge } from "@/components/admin/ui";
import { FlashMessage } from "@/components/admin/form-bits";
import { merchantStatusTone } from "@/components/admin/merchants/tones";
import {
  AgreementsPanel,
  ContactsManager,
  MerchantProfileForm,
  SettlementDetailsForm,
  StatusChanger,
  type AgreementRow,
} from "@/components/admin/merchants/merchant-forms";

export const metadata: Metadata = { title: "Merchant" };

const productStatusLabel: Record<string, string> = {
  PUBLISHED: "Published",
  OUT_OF_STOCK: "Out of stock",
  PENDING_REVIEW: "Pending review",
  DRAFT: "Draft",
  UNAVAILABLE: "Unavailable",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

async function MerchantDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const principal = await requireStaffPage("merchants:read");
  if (!principal) return <EmptyState title="You don't have access to merchants." />;
  const { id } = await params;
  const sp = await searchParams;
  const [m, productCounts, activity, { commerce }] = await Promise.all([
    getMerchantDetail(id),
    getMerchantProductCounts(id),
    getMerchantActivity(id),
    getSettings(),
  ]);
  if (!m) notFound();

  const canWrite = can(principal, "merchants:write");
  const canAgree = can(principal, "agreements:write");
  const canBank = can(principal, "merchant-bank:read");
  const now = new Date();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString(commerce.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const bearer = (b: string) => (b === "VARCH" ? "VARCH" : "Merchant");

  const agreements: AgreementRow[] = m.agreements.map((a) => ({
    id: a.id,
    status: a.status,
    phase: agreementPhase(a, now),
    summary:
      a.commissionType === "PERCENTAGE"
        ? formatBps(a.rateBps ?? 0)
        : `${formatMoney(a.fixedAmount ?? 0, commerce)} per unit`,
    basis: a.commissionBasis === "NET_OF_DISCOUNT" ? "After discounts" : "Before discounts",
    bearers: `Discounts: ${bearer(a.discountBearer)} · Fees: ${bearer(a.paymentFeeBearer)}`,
    window: `${fmtDate(a.effectiveFrom)} → ${a.effectiveTo ? fmtDate(a.effectiveTo) : "open"}`,
    documentRef: a.documentRef,
    notes: a.notes,
  }));

  const totalProducts = m._count.products;
  const listed = (productCounts.PUBLISHED ?? 0) + (productCounts.OUT_OF_STOCK ?? 0);

  return (
    <>
      {sp.created === "1" && (
        <FlashMessage message="Merchant created. Add contacts and an agreement below." />
      )}
      <PageHeader
        title={m.businessName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={merchantStatusTone[m.status]}>{merchantStatusLabel[m.status]}</StatusBadge>
            <span>
              {totalProducts} product{totalProducts === 1 ? "" : "s"}
              {hidesListings(m.status) && totalProducts > 0
                ? " · hidden from the storefront"
                : listed
                  ? ` · ${listed} listed`
                  : ""}
            </span>
            {m.onboardedAt && <span>· onboarded {fmtDate(m.onboardedAt)}</span>}
            {m.terminatedAt && <span>· terminated {fmtDate(m.terminatedAt)}</span>}
          </span>
        }
        back={
          <Link href="/admin/merchants" className="text-muted text-sm hover:underline">
            ← Merchants
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Section title="Business details" id="details">
            {canWrite ? (
              <MerchantProfileForm
                merchantId={m.id}
                initial={{
                  businessName: m.businessName,
                  legalName: m.legalName,
                  description: m.description,
                  logoUrl: m.logoUrl,
                  email: m.email,
                  phone: m.phone,
                  addressLine1: m.addressLine1,
                  addressLine2: m.addressLine2,
                  city: m.city,
                  state: m.state,
                  country: m.country,
                  registrationType: m.registrationType,
                  registrationNumber: m.registrationNumber,
                  preferredChannel: m.preferredChannel,
                  agreementStatus: m.agreementStatus,
                  internalNotes: m.internalNotes,
                }}
              />
            ) : (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Email", m.email],
                  ["Phone", m.phone],
                  ["City", m.city],
                  ["Registration", [m.registrationType, m.registrationNumber].filter(Boolean).join(" ")],
                ].map(([k, val]) => (
                  <div key={k}>
                    <dt className="text-muted text-xs">{k}</dt>
                    <dd>{val || "-"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          <Section
            title="Commission agreements"
            id="agreements"
            description="The agreement in force on the order date sets the commission, and each order keeps that rate permanently."
          >
            <AgreementsPanel
              merchantId={m.id}
              agreements={agreements}
              canEdit={canAgree}
              currency={commerce.currency}
            />
          </Section>

          <Section title="Contacts" id="contacts">
            <ContactsManager merchantId={m.id} contacts={m.contacts} canEdit={canWrite} />
          </Section>
        </div>

        <div className="space-y-6">
          {canWrite && (
            <Section title="Status" id="status" description="Only Active merchants appear on the storefront.">
              <StatusChanger
                merchantId={m.id}
                current={m.status}
                productCount={listed}
                canTerminate={can(principal, "merchants:offboard")}
              />
            </Section>
          )}

          <Section title="Products" id="products">
            {totalProducts === 0 ? (
              <p className="text-muted text-sm">
                No products yet. Product management arrives in the next update.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {Object.entries(productCounts).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{productStatusLabel[status] ?? status}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Settlement details" id="settlement">
            {canBank ? (
              <SettlementDetailsForm
                merchantId={m.id}
                initial={{
                  settlementBankName: m.settlementBankName,
                  settlementAccountName: m.settlementAccountName,
                  settlementAccountLast4: m.settlementAccountLast4,
                  providerRecipientRef: m.providerRecipientRef,
                }}
              />
            ) : (
              <p className="text-muted text-sm">Visible to Finance and Super Admin only.</p>
            )}
          </Section>

          <Section title="Recent activity" id="activity">
            {activity.length === 0 ? (
              <p className="text-muted text-sm">No activity recorded.</p>
            ) : (
              <ul className="divide-border divide-y text-sm" data-testid="merchant-activity">
                {activity.map((a) => (
                  <li key={a.id} className="py-2">
                    <span className="font-semibold">{a.actor?.fullName || a.actor?.email || "System"}</span>{" "}
                    <span className="text-muted">
                      {a.action.replace(/^merchant\.|^agreement\./, "").replace(/[._]/g, " ")}
                    </span>
                    <time className="text-muted block text-xs" dateTime={a.createdAt.toISOString()}>
                      {a.createdAt.toLocaleString(commerce.locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

export default function MerchantPage({ params, searchParams }: PageProps<"/admin/merchants/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted text-sm">Loading merchant…</p>}>
      <MerchantDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}
