import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getDashboardData } from "@/lib/admin/dashboard";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/currency";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  testId?: string;
}) {
  return (
    <div className="border-border bg-background rounded-brand border p-4" data-testid={testId}>
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-border bg-background rounded-brand border">
      <h2 className="border-border border-b px-4 py-3 text-sm font-bold">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted py-6 text-center text-sm">{children}</p>;
}

const statusLabel = (s: string) => s.toLowerCase().replace(/_/g, " ");

async function Dashboard() {
  const principal = await requireStaffPage("admin:access");
  if (!principal) return null;
  const [data, { commerce }] = await Promise.all([getDashboardData(), getSettings()]);
  const money = (n: number) => formatMoney(n, commerce);
  const showFinance = can(principal, "finance:read");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="text-muted text-sm">Marketplace overview. Figures update as orders come in.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Gross sales"
          value={money(data.sales.gross)}
          hint="Paid orders, before refunds"
          testId="stat-gross"
        />
        <Stat
          label="VARCH commission"
          value={money(data.sales.commission)}
          hint="Earned, after refund reversals"
          testId="stat-commission"
        />
        <Stat label="Refunds" value={money(data.sales.refunds)} hint="Completed refunds" />
        <Stat
          label="Orders"
          value={data.orders.total}
          hint={`${data.orders.completed} completed`}
          testId="stat-orders"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="In progress" value={data.orders.inProgress} hint="Pending payment to delivered" />
        <Stat label="Cancelled" value={data.orders.cancelled} />
        <Stat
          label="Active merchants"
          value={data.catalogue.activeMerchants}
          hint={`${data.catalogue.totalMerchants} on record`}
          testId="stat-merchants"
        />
        <Stat
          label="Listed products"
          value={data.catalogue.publishedProducts}
          hint="Published, active merchants"
          testId="stat-products"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Stat
          label="Low stock"
          value={data.catalogue.lowStock}
          hint={`${data.catalogue.outOfStock} variants out of stock`}
          testId="stat-low-stock"
        />
        {showFinance && (
          <>
            <Stat
              label="Open settlements"
              value={data.settlements.openCount}
              hint={`${money(data.settlements.openAmount)} awaiting payment`}
            />
            <Stat
              label="Payable, not yet settled"
              value={money(data.settlements.payableNotSettled)}
              hint="Owed to merchants, not on a statement"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent orders">
          {data.recentOrders.length === 0 ? (
            <Empty>No orders yet. They&apos;ll appear here once checkout is live.</Empty>
          ) : (
            <ul className="divide-border divide-y">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-semibold">{o.number}</span>
                  <span className="text-muted truncate">{o.customerName}</span>
                  <span className="text-muted capitalize">{statusLabel(o.status)}</span>
                  <span className="font-semibold">{money(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent activity">
          {data.recentActivity.length === 0 ? (
            <Empty>No activity recorded yet.</Empty>
          ) : (
            <ul className="divide-border divide-y" data-testid="recent-activity">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold">{a.actor?.fullName || a.actor?.email || "System"}</span>{" "}
                    <span className="text-muted">{a.action.replace(/[._]/g, " ")}</span>
                  </span>
                  <time className="text-muted shrink-0 text-xs" dateTime={a.createdAt.toISOString()}>
                    {a.createdAt.toLocaleString(commerce.locale, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Sales over time">
        {data.orders.total === 0 ? (
          <Empty>No sales to chart yet. This fills in once orders are placed (checkout arrives in M3).</Empty>
        ) : (
          <Empty>Sales chart arrives with order management (M4).</Empty>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-muted text-sm">Loading dashboard…</div>}>
      <Dashboard />
    </Suspense>
  );
}
