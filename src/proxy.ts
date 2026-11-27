import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabasePublicConfig } from "@/lib/supabase/config";

/**
 * Keeps Supabase auth sessions fresh. Server components can't write cookies, so this runs before
 * signed-in areas render, validates the session (refreshing the access token when needed) and
 * writes any updated cookies to the response.
 *
 * This is NOT the authorisation check: pages and server actions verify the user and their roles
 * themselves (src/lib/auth/session.ts).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabasePublicConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Validates the JWT and refreshes it if expired. Must run before the response is returned.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
