import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPrincipal } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/permissions";
import { SetPasswordForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Choose a new password" };

/** Only reachable with a valid session (from the emailed link, or when signed in). */
async function SetPassword() {
  const principal = await getPrincipal();
  if (!principal || !isStaff(principal)) redirect("/admin/login?error=link");
  return <SetPasswordForm email={principal.email} />;
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-80" aria-busy="true" />}>
      <SetPassword />
    </Suspense>
  );
}
