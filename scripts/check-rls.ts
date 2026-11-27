/**
 * Database lockdown check. Exits 1 if:
 *   - any table in the public schema has Row Level Security disabled, or
 *   - (on Supabase) the browser-facing `anon` / `authenticated` roles hold any privilege on a
 *     public table, or any RLS policy grants them access.
 * Run after every migration, locally and in CI:  npm run db:check-rls
 *
 * Why: Supabase exposes public tables to the browser via its REST API. The marketplace relies on
 * RLS being on with no anon/authenticated access, so the database can only be reached through
 * server code. See DATABASE.md, "Security".
 */
import "dotenv/config";
import { Client } from "pg";
import { pgPoolConfig } from "../src/lib/pg-config";

async function main() {
  const { connectionString, ssl } = pgPoolConfig();
  const client = new Client({ connectionString, ssl });
  await client.connect();
  let failed = false;
  try {
    const { rows } = await client.query<{ tablename: string; rowsecurity: boolean }>(
      "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    if (rows.length === 0)
      throw new Error("No tables found. Is DATABASE_URL pointing at the right database?");
    const missing = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
    if (missing.length) {
      console.error(`✗ RLS disabled on: ${missing.join(", ")}`);
      failed = true;
    } else {
      console.log(`✓ RLS enabled on all ${rows.length} public tables`);
    }

    const roles = (
      await client.query<{ rolname: string }>(
        "SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')",
      )
    ).rows.map((r) => r.rolname);

    if (roles.length === 0) {
      console.log("• anon/authenticated roles not present (not Supabase); privilege check skipped");
    } else {
      const grants = await client.query<{ grantee: string; table_name: string; privilege_type: string }>(
        `SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
         WHERE table_schema = 'public' AND grantee = ANY($1) ORDER BY 1, 2, 3`,
        [roles],
      );
      if (grants.rows.length) {
        console.error(`✗ ${roles.join("/")} hold ${grants.rows.length} table privileges, e.g.:`);
        for (const g of grants.rows.slice(0, 10))
          console.error(`    ${g.grantee} ${g.privilege_type} ${g.table_name}`);
        failed = true;
      } else {
        console.log(`✓ ${roles.join(" and ")} have no privileges on any public table`);
      }

      const policies = await client.query<{ tablename: string; policyname: string }>(
        `SELECT tablename, policyname FROM pg_policies
         WHERE schemaname = 'public' AND roles && $1::name[]`,
        [[...roles, "public"]],
      );
      if (policies.rows.length) {
        console.error(
          `✗ RLS policies apply to browser roles: ${policies.rows.map((p) => `${p.tablename}.${p.policyname}`).join(", ")}`,
        );
        failed = true;
      } else {
        console.log("✓ no RLS policies grant browser roles access");
      }
    }
  } finally {
    await client.end();
  }
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
