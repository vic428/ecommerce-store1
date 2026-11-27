import type { PoolConfig } from "pg";

/**
 * One place for Postgres connection settings, shared by the app (src/lib/db.ts), the seed and
 * scripts.
 *
 * - Local databases (localhost) connect without TLS.
 * - Every other host is encrypted. If DATABASE_SSL_CA holds the provider's CA certificate (PEM
 *   text, e.g. Supabase → Project Settings → Database → SSL configuration), the server
 *   certificate is also verified.
 * - Without a CA the connection is encrypted but the server isn't verified. That is allowed only
 *   for development/test: Netlify production deploys (NETLIFY=true, CONTEXT=production) and any
 *   environment with DATABASE_SSL_REQUIRE_CA=true refuse to connect without DATABASE_SSL_CA.
 */
/** Environment variables as a plain map (so tests can pass a partial set). */
type Env = Readonly<Record<string, string | undefined>>;

export function requiresVerifiedTls(env: Env): boolean {
  if (env.DATABASE_SSL_REQUIRE_CA === "true") return true;
  return env.NETLIFY === "true" && env.CONTEXT === "production";
}

export function pgPoolConfig(env: Env = process.env): PoolConfig {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. See SETUP.md.");

  let host = "";
  try {
    const parsed = new URL(connectionString);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") throw new Error();
    host = parsed.hostname;
  } catch {
    // Common mistake: pasting the https:// project URL instead of the database connection string.
    throw new Error("DATABASE_URL is not a valid postgres:// connection string.");
  }
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";

  // Remove sslmode/ssl from the URL so the explicit `ssl` option below is what applies.
  const url = new URL(connectionString);
  for (const p of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(p);

  const ca = env.DATABASE_SSL_CA?.replace(/\\n/g, "\n").trim();
  if (!isLocal && !ca && requiresVerifiedTls(env)) {
    throw new Error(
      "DATABASE_SSL_CA is required here so the database server certificate is verified. " +
        "Add the provider's CA certificate (see SETUP.md).",
    );
  }
  const ssl: PoolConfig["ssl"] = isLocal
    ? false
    : ca
      ? { ca, rejectUnauthorized: true }
      : { rejectUnauthorized: false };

  return {
    connectionString: url.toString(),
    ssl,
    max: Number(env.DATABASE_POOL_MAX) || undefined,
    // Resilience on slow or lossy networks: fail a stuck connect quickly instead of hanging,
    // recycle idle connections before NATs/poolers silently drop them, and keep active
    // sockets alive.
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 20_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  };
}
