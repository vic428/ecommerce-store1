import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
  /** false = shown as "Soon" (not a link) until the module is built. */
  ready: boolean;
};

/** Admin sidebar. Items are filtered by the signed-in user's permissions on the server. */
export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", permission: "admin:access", ready: true },
  { label: "Merchants", href: "/admin/merchants", icon: "store", permission: "merchants:read", ready: false },
  { label: "Products", href: "/admin/products", icon: "package", permission: "products:read", ready: false },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: "folder",
    permission: "categories:write",
    ready: false,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: "boxes",
    permission: "inventory:write",
    ready: false,
  },
  { label: "Orders", href: "/admin/orders", icon: "receipt", permission: "orders:read", ready: false },
  { label: "Customers", href: "/admin/customers", icon: "users", permission: "customers:read", ready: false },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: "megaphone",
    permission: "marketing:write",
    ready: false,
  },
  { label: "Reviews", href: "/admin/reviews", icon: "star", permission: "reviews:moderate", ready: false },
  {
    label: "Settlements",
    href: "/admin/settlements",
    icon: "wallet",
    permission: "finance:read",
    ready: false,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "settings",
    permission: "settings:write",
    ready: false,
  },
  { label: "Staff", href: "/admin/staff", icon: "shield", permission: "staff:manage", ready: false },
  { label: "Activity log", href: "/admin/activity", icon: "history", permission: "audit:read", ready: false },
];
