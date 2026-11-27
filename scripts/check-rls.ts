/**
 * Fails (exit code 1) if any table in the public schema has Row Level Security disabled.
 * Run after every migration, locally and in CI:  npm run db:check-rls
 *
 * Why: Supabase exposes public tables to the browser via its REST API. The marketplace relies on
 * RLS being on (with no anon/authenticated policies) so the database can only be reached through
 * server code. See DATABASE.md, "Security".
 */
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string; rowsecurity: boolean }>(
      "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    const missing = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
    if (rows.length === 0)
      throw new Error("No tables found. Is DATABASE_URL pointing at the right database?");
    if (missing.length) {
      console.error(`✗ RLS disabled on: ${missing.join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log(`✓ RLS enabled on all ${rows.length} public tables`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
