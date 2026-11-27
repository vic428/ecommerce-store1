import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { listMerchants, parseMerchantFilters, type MerchantListFilters } from "@/lib/admin/merchants";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/currency";
import { AGREEMENT_STATUSES, formatBps, MERCHANT_STATUSES, merchantStatusLabel } from "@/lib/merchants/rules";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/ui";
import { merchantStatusTone } from "@/components/admin/merchants/tones";
import { ButtonLink, buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Merchants" };

function pageHref(f: MerchantListFilters, page: number) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status) p.set("status", f.status);
  if (f.agreement) p.set("agreement", f.agreement);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return `/admin/merchants${s ? `?${s}` : ""}`;
}

async function MerchantList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const principal = await requireStaffPage("merchants:read");
  if (!principal) return <EmptyState title="You don't have access to merchants." />;
  const f = parseMerchantFilters(await searchParams);
  const [{ rows, total, pages, statusCounts }, { commerce }] = await Promise.all([
    listMerchants(f),
    getSettings(),
  ]);
  const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

  return (
    <>
      <PageHeader
        title="Merchants"
        description="Businesses supplying products to the marketplace."
        actions={
          can(principal, "merchants:write") && (
            <ButtonLink href="/admin/merchants/new">Add merchant</ButtonLink>
          )
        }
      />

      <form
        method="get"
        className="border-border bg-background rounded-brand mb-4 grid gap-3 border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
        role="search"
      >
        <label className="sr-only" htmlFor="q">
          Search merchants
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={f.q}
          placeholder="Search name, email, city…"
          className="rounded-brand border-border h-10 border px-3 text-sm"
        />
        <label className="sr-only" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={f.status}
          className="rounded-brand border-border h-10 border px-2 text-sm"
        >
          <option value="">All statuses</option>
          {MERCHANT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {merchantStatusLabel[s]} ({statusCounts[s] ?? 0})
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="agreement">
          Agreement status
        </label>
        <select
          id="agreement"
          name="agreement"
          defaultValue={f.agreement}
          className="rounded-brand border-border h-10 border px-2 text-sm"
        >
          <option value="">All agreement states</option>
          {AGREEMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              Agreement: {label(s)}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={buttonClasses({ variant: "secondary" })}>
            Filter
          </button>
          {(f.q || f.status || f.agreement) && (
            <Link href="/admin/merchants" className={buttonClasses({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="border-border bg-background rounded-brand border">
        {rows.length === 0 ? (
          <EmptyState
            title={f.q || f.status || f.agreement ? "No merchants match these filters." : "No merchants yet."}
          >
            {can(principal, "merchants:write") &&
              !(f.q || f.status || f.agreement) &&
              "Add the first merchant to start listing products."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm" data-testid="merchants-table">
              <thead className="text-muted border-border border-b text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Merchant</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Agreement</th>
                  <th className="px-4 py-3 font-semibold">Commission in force</th>
                  <th className="px-4 py-3 text-right font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {rows.map((m) => {
                  const a = m.agreements[0];
                  return (
                    <tr key={m.id} className="hover:bg-surface/60">
                      <td className="px-4 py-3">
                        <Link href={`/admin/merchants/${m.id}`} className="font-semibold hover:underline">
                          {m.businessName}
                        </Link>
                        {m.email && <span className="text-muted block text-xs">{m.email}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={merchantStatusTone[m.status]}>
                          {merchantStatusLabel[m.status]}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">{label(m.agreementStatus)}</td>
                      <td className="px-4 py-3">
                        {a ? (
                          a.commissionType === "PERCENTAGE" ? (
                            formatBps(a.rateBps ?? 0)
                          ) : (
                            `${formatMoney(a.fixedAmount ?? 0, commerce)} / unit`
                          )
                        ) : (
                          <span className="text-muted">Marketplace default</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{m._count.products}</td>
                      <td className="px-4 py-3">{m.city ?? <span className="text-muted">-</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">
          {total} merchant{total === 1 ? "" : "s"}
          {pages > 1 && ` · page ${f.page} of ${pages}`}
        </span>
        {pages > 1 && (
          <span className="flex gap-2">
            {f.page > 1 && (
              <Link
                className={buttonClasses({ variant: "outline", size: "sm" })}
                href={pageHref(f, f.page - 1)}
              >
                Previous
              </Link>
            )}
            {f.page < pages && (
              <Link
                className={buttonClasses({ variant: "outline", size: "sm" })}
                href={pageHref(f, f.page + 1)}
              >
                Next
              </Link>
            )}
          </span>
        )}
      </nav>
    </>
  );
}

export default function MerchantsPage({ searchParams }: PageProps<"/admin/merchants">) {
  return (
    <Suspense fallback={<p className="text-muted text-sm">Loading merchants…</p>}>
      <MerchantList searchParams={searchParams} />
    </Suspense>
  );
}
