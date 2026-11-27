/**
 * Supabase settings read from the environment. Only the project URL and publishable key are
 * used here; both are public by design, but this app still keeps them server-side because all
 * auth calls run in server actions and route handlers.
 */
export function supabasePublicConfig(env: Readonly<Record<string, string | undefined>> = process.env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set. See SETUP.md.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * Absolute base URL used in links sent by email (password reset). Taken from configuration,
 * never from the request's Host header, so reset links can't be pointed at another site.
 */
export function siteUrl(env: Readonly<Record<string, string | undefined>> = process.env) {
  return (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
