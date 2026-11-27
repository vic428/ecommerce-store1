import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getPrincipal } from "@/lib/auth/session";
import { can, isStaff } from "@/lib/auth/permissions";
import { getSettings } from "@/lib/settings";
import { adminNav } from "@/components/admin/nav";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Role gate + chrome for every signed-in admin page. Reading the session is request-time, so it
 * lives inside Suspense. Pages still check their own permissions: this gate only guarantees the
 * visitor is active staff.
 */
async function Gate({ children }: { children: ReactNode }) {
  const principal = await getPrincipal();
  if (!principal || !isStaff(principal)) redirect("/admin/login");
  const { business } = await getSettings();
  const items = adminNav.filter((i) => can(principal, i.permission));
  return (
    <AdminShell
      storeName={business.name}
      items={items}
      user={{ email: principal.email, name: principal.fullName, roles: principal.roles }}
    >
      {children}
    </AdminShell>
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="bg-surface flex min-h-screen" aria-busy="true">
          <div className="bg-secondary hidden w-64 lg:block" />
          <div className="flex-1" />
        </div>
      }
    >
      <Gate>{children}</Gate>
    </Suspense>
  );
}
