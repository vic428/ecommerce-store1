"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { getVerifiedUserId } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/config";

export type FormState = { status: "idle" | "error" | "success"; message?: string; email?: string };

const email = z.email("Enter a valid email address.").max(254);

/**
 * Staff sign-in. Credentials are checked by Supabase Auth; access is then decided by OUR
 * database (active profile with a staff role). Error messages never reveal whether an account
 * exists. TODO(M5): per-IP rate limiting in front of this action.
 */
export async function signInStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password.").max(200) }).safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: formData.get("password"),
  });
  const typedEmail = String(formData.get("email") ?? "").slice(0, 254);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message, email: typedEmail };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: "Incorrect email or password.", email: typedEmail };
  }

  // Read the just-issued session directly (the request-cached principal predates sign-in).
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const profile = userId
    ? await db.profile.findUnique({
        where: { id: userId },
        select: { isActive: true, roles: { select: { role: true } } },
      })
    : null;
  const staff =
    !!userId &&
    !!profile?.isActive &&
    isStaff({ profileId: userId, roles: profile.roles.map((r) => r.role), merchantIds: [] });

  if (!staff) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account doesn't have access to the admin area.",
      email: typedEmail,
    };
  }

  await recordAudit({
    actorProfileId: userId!,
    action: "auth.sign_in",
    entity: "Profile",
    entityId: userId!,
  });
  redirect("/admin");
}

/**
 * Sends a set/reset-password email to active staff accounts. Always returns the same message,
 * so it can't be used to find out which emails have accounts. The link goes to the configured
 * site URL, never one derived from the request.
 */
export async function requestPasswordEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = email.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };

  const done: FormState = {
    status: "success",
    message:
      "If that email belongs to a staff account, a link to set your password is on its way. It expires in 1 hour.",
  };

  const profile = await db.profile.findUnique({
    where: { email: parsed.data },
    select: { id: true, isActive: true, roles: { select: { role: true } } },
  });
  const staff = profile?.isActive && profile.roles.some((r) => r.role !== "CUSTOMER");
  if (!staff) return done;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/admin/auth/callback?next=/admin/set-password`,
  });
  if (error) console.error("[auth] password email failed:", error.code ?? error.status, error.message);
  await recordAudit({
    actorProfileId: profile!.id,
    action: "auth.password_email_requested",
    entity: "Profile",
    entityId: profile!.id,
  });
  return done;
}

const newPassword = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(200)
      .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Include at least one letter and one number."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

/** Sets the signed-in user's password (after following an emailed link, or when changing it). */
export async function setOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await getVerifiedUserId();
  if (!userId) redirect("/admin/login?error=expired");

  const parsed = newPassword.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      status: "error",
      message:
        error.code === "same_password"
          ? "Choose a password you haven't used here before."
          : "Couldn't update the password. Try again.",
    };
  }
  await recordAudit({
    actorProfileId: userId,
    action: "auth.password_set",
    entity: "Profile",
    entityId: userId,
  });
  redirect("/admin");
}

export async function signOutStaff() {
  const userId = await getVerifiedUserId();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  if (userId)
    await recordAudit({
      actorProfileId: userId,
      action: "auth.sign_out",
      entity: "Profile",
      entityId: userId,
    });
  redirect("/admin/login");
}
