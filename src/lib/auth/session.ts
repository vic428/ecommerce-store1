import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { can, isStaff, type Permission, type PlatformRole, type Principal } from "./permissions";

export type StaffPrincipal = Principal & { email: string; fullName: string | null };

/**
 * The verified user id for this request, or null. `getClaims()` verifies the session JWT
 * (signature and expiry) rather than trusting the cookie's contents.
 */
export const getVerifiedUserId = cache(async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
});

/**
 * The current user's principal (profile, roles, merchant links) loaded from OUR database.
 * Roles are never read from the token or the browser. Null when signed out, when the auth user
 * has no profile, or when the profile is deactivated.
 */
export const getPrincipal = cache(async (): Promise<StaffPrincipal | null> => {
  const userId = await getVerifiedUserId();
  if (!userId) return null;
  const profile = await db.profile.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      roles: { select: { role: true } },
      merchantUsers: { where: { isActive: true }, select: { merchantId: true } },
    },
  });
  if (!profile || !profile.isActive) return null;
  return {
    profileId: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    roles: profile.roles.map((r) => r.role as PlatformRole),
    merchantIds: profile.merchantUsers.map((m) => m.merchantId),
  };
});

/**
 * For admin pages: returns the staff principal, or redirects to sign-in. If the user is signed
 * in but lacks `permission`, returns null so the page can render a "no access" state.
 */
export async function requireStaffPage(permission: Permission = "admin:access") {
  const principal = await getPrincipal();
  if (!principal || !isStaff(principal)) redirect("/admin/login");
  return can(principal, permission) ? principal : null;
}
