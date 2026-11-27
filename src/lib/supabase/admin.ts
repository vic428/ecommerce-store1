import { createClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "./config";

/**
 * Supabase client using the SECRET key. It bypasses every security rule, so it is only for
 * trusted server code and scripts (creating staff accounts, storage uploads). Never import this
 * into anything that can run in the browser.
 */
export function createSupabaseAdminClient(env: Readonly<Record<string, string | undefined>> = process.env) {
  const { url } = supabasePublicConfig(env);
  const secret = env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY must be set (server only). See SETUP.md.");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
