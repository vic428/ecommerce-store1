import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPrincipal } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/permissions";
import { LoginForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

const notices: Record<string, string> = {
  link: "That link is invalid or has expired. Request a new one below.",
  expired: "Your session has expired. Please sign in again.",
};

/** Reads the session and query string, so it renders at request time inside Suspense. */
async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const principal = await getPrincipal();
  if (principal && isStaff(principal)) redirect("/admin");
  const { error } = await searchParams;
  return <LoginForm notice={error ? notices[error] : undefined} />;
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <Suspense fallback={<div className="h-80" aria-busy="true" />}>
      <Login searchParams={searchParams as Promise<{ error?: string }>} />
    </Suspense>
  );
}
