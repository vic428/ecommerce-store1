import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Landing point for emailed auth links (set/reset password). Exchanges the one-time code for a
 * session, then continues to `next`, which must be an /admin path on this site (no open
 * redirects).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/admin";
  const next = /^\/admin(\/[A-Za-z0-9\-/]*)?$/.test(nextParam) ? nextParam : "/admin";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", origin));
}
