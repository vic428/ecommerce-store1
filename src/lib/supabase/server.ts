import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabasePublicConfig } from "./config";

/**
 * Supabase client bound to the current request's auth cookies. Use in server components,
 * server actions and route handlers. Reading cookies makes the caller request-time, so in
 * server components it must sit inside a <Suspense> boundary.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  // Supabase reads the clock while loading the session. Mark this as request-time work so Next
  // never tries to prerender past it (Cache Components rejects Date.now() during prerendering).
  await connection();
  const { url, key } = supabasePublicConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server components can't set cookies. Session refresh happens in src/proxy.ts, and
          // server actions/route handlers (where setting works) handle sign-in and sign-out.
        }
      },
    },
  });
}
