"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOutStaff } from "@/actions/admin-auth";
import { cn } from "@/lib/cn";
import type { AdminNavItem } from "./nav";

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  store: Store,
  package: Package,
  folder: FolderTree,
  boxes: Boxes,
  receipt: Receipt,
  users: Users,
  megaphone: Megaphone,
  star: Star,
  wallet: Wallet,
  settings: Settings,
  shield: ShieldCheck,
  history: History,
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
};

const COLLAPSE_KEY = "admin.sidebar.collapsed";

function NavList({
  items,
  collapsed,
  onNavigate,
}: {
  items: AdminNavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = icons[item.icon] ?? LayoutDashboard;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const body = (
          <>
            <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span className={cn("truncate", collapsed && "lg:sr-only")}>{item.label}</span>
            {!item.ready && !collapsed && (
              <span className="rounded-brand ml-auto bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/60 uppercase">
                Soon
              </span>
            )}
          </>
        );
        const base = "flex items-center gap-3 rounded-brand px-3 py-2 text-sm";
        return (
          <li key={item.href}>
            {item.ready ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  base,
                  active
                    ? "bg-primary text-primary-fg font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {body}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title={`${item.label}: coming soon`}
                className={cn(base, "cursor-not-allowed text-white/35")}
              >
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({
  storeName,
  items,
  user,
  children,
}: {
  storeName: string;
  items: AdminNavItem[];
  user: { email: string; name: string | null; roles: string[] };
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); // eslint-disable-line react-hooks/set-state-in-effect -- read a per-browser preference after hydration
    } catch {
      /* storage unavailable: keep default */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }

  const roleText = user.roles
    .map((r) => roleLabels[r])
    .filter(Boolean)
    .join(", ");

  const sidebar = (mobile: boolean) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
        <span className={cn("truncate font-extrabold text-white", collapsed && !mobile && "lg:hidden")}>
          {storeName} <span className="text-primary">Admin</span>
        </span>
        {mobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-brand p-2 text-white hover:bg-white/10"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="rounded-brand hidden p-2 text-white/70 hover:bg-white/10 hover:text-white lg:block"
          >
            {collapsed ? (
              <ChevronsRight aria-hidden className="h-5 w-5" />
            ) : (
              <ChevronsLeft aria-hidden className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
        <NavList items={items} collapsed={collapsed && !mobile} onNavigate={() => setMobileOpen(false)} />
      </nav>
    </div>
  );

  return (
    <div className="bg-surface flex min-h-screen">
      <aside
        className={cn(
          "bg-secondary sticky top-0 hidden h-screen shrink-0 transition-[width] lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {sidebar(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="bg-secondary absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar(true)}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-brand hover:bg-surface -ml-2 p-2 lg:hidden"
          >
            <Menu aria-hidden className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold" data-testid="admin-user-email">
                {user.name || user.email}
              </p>
              {roleText && <p className="text-muted text-xs">{roleText}</p>}
            </div>
            <form action={signOutStaff}>
              <button
                type="submit"
                className="rounded-brand border-border hover:bg-surface flex items-center gap-2 border px-3 py-2 text-sm font-semibold"
              >
                <LogOut aria-hidden className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
