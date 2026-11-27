/**
 * Role-based permissions and merchant scoping. Pure and framework-free so it can be unit tested
 * and reused by server actions, route handlers and server components.
 *
 * Rule: every server-side read or write of protected data calls `assertCan` and, for
 * merchant-owned data, `assertMerchantAccess`. Hiding UI is never the security control.
 */

export type PlatformRole = "SUPER_ADMIN" | "OPERATIONS" | "FINANCE" | "CUSTOMER";

export const PERMISSIONS = [
  "admin:access",
  "merchants:read",
  "merchants:write",
  "merchants:offboard",
  "merchants:export",
  "agreements:write",
  "merchant-bank:read",
  "products:read",
  "products:write",
  "products:review",
  "categories:write",
  "inventory:write",
  "orders:read",
  "orders:update",
  "orders:cancel",
  "refunds:request",
  "refunds:approve",
  "customers:read",
  "reviews:moderate",
  "marketing:write",
  "finance:read",
  "settlements:create",
  "settlements:approve",
  "settlements:mark-paid",
  "settings:write",
  "staff:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const OPERATIONS: Permission[] = [
  "admin:access",
  "merchants:read",
  "merchants:write",
  "products:read",
  "products:write",
  "products:review",
  "categories:write",
  "inventory:write",
  "orders:read",
  "orders:update",
  "orders:cancel",
  "refunds:request",
  "customers:read",
  "reviews:moderate",
  "marketing:write",
];

const FINANCE: Permission[] = [
  "admin:access",
  "merchants:read",
  "merchant-bank:read",
  "products:read",
  "orders:read",
  "refunds:request",
  "refunds:approve",
  "finance:read",
  "settlements:create",
  "settlements:approve",
  "settlements:mark-paid",
  "audit:read",
];

const ROLE_PERMISSIONS: Record<PlatformRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set(PERMISSIONS),
  OPERATIONS: new Set(OPERATIONS),
  FINANCE: new Set(FINANCE),
  CUSTOMER: new Set(),
};

export const STAFF_ROLES: readonly PlatformRole[] = ["SUPER_ADMIN", "OPERATIONS", "FINANCE"];

/** Who is making the request, as established server-side from the verified session. */
export type Principal = {
  profileId: string;
  roles: PlatformRole[];
  /** Merchants this user is an active member of (future merchant portal). */
  merchantIds: string[];
};

export class ForbiddenError extends Error {
  readonly status = 403;
}

export function can(principal: Principal | null, permission: Permission): boolean {
  if (!principal) return false;
  return principal.roles.some((r) => ROLE_PERMISSIONS[r]?.has(permission));
}

export function assertCan(
  principal: Principal | null,
  permission: Permission,
): asserts principal is Principal {
  if (!can(principal, permission)) throw new ForbiddenError(`Missing permission: ${permission}`);
}

export function isStaff(principal: Principal | null): boolean {
  return !!principal && principal.roles.some((r) => STAFF_ROLES.includes(r));
}

/**
 * May this principal act on data belonging to `merchantId`?
 * Staff with merchants:read can see every merchant; merchant users only their own merchants.
 * The merchant id must come from the database record being accessed, never from the browser
 * alone.
 */
export function canAccessMerchant(principal: Principal | null, merchantId: string): boolean {
  if (!principal) return false;
  if (can(principal, "merchants:read")) return true;
  return principal.merchantIds.includes(merchantId);
}

export function assertMerchantAccess(
  principal: Principal | null,
  merchantId: string,
): asserts principal is Principal {
  if (!canAccessMerchant(principal, merchantId)) throw new ForbiddenError("No access to this merchant");
}

/** Customers may only read their own orders; staff with orders:read may read any. */
export function canReadOrder(
  principal: Principal | null,
  order: { customerProfileId: string | null },
): boolean {
  if (!principal) return false;
  if (can(principal, "orders:read")) return true;
  return order.customerProfileId !== null && order.customerProfileId === principal.profileId;
}
