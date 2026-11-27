/**
 * Create (or update) a staff account.
 *
 *   npm run staff:create -- --email admin@example.com --role SUPER_ADMIN [--name "Full Name"]
 *
 * - Creates the Supabase Auth user if missing (email marked confirmed, NO password), then
 *   upserts the Profile and grants the role. Safe to re-run.
 * - The person sets their own password from /admin/login → "Set or reset password".
 * - Test accounts only: `--password-env VAR` sets the password from the named environment
 *   variable (never pass passwords as command-line arguments).
 *
 * Needs DATABASE_URL, SUPABASE_URL and SUPABASE_SECRET_KEY.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgPoolConfig } from "../src/lib/pg-config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

const ROLES = ["SUPER_ADMIN", "OPERATIONS", "FINANCE", "CUSTOMER"] as const;
type Role = (typeof ROLES)[number];

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    role: { type: "string" },
    name: { type: "string" },
    "password-env": { type: "string" },
  },
});

async function findAuthUserByEmail(admin: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const email = values.email?.trim().toLowerCase();
  const role = values.role?.toUpperCase() as Role | undefined;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("--email is required");
  if (!role || !ROLES.includes(role)) throw new Error(`--role must be one of ${ROLES.join(", ")}`);

  let password: string | undefined;
  if (values["password-env"]) {
    password = process.env[values["password-env"]];
    if (!password || password.length < 12) {
      throw new Error(`${values["password-env"]} must be set to a password of 12+ characters`);
    }
  }

  const admin = createSupabaseAdminClient();
  const db = new PrismaClient({ adapter: new PrismaPg(pgPoolConfig()) });
  try {
    let user = await findAuthUserByEmail(admin, email);
    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, password });
      if (error) throw error;
      user = data.user;
      console.log(`✓ created auth user ${email}${password ? " (password from env)" : " (no password yet)"}`);
    } else {
      console.log(`• auth user ${email} already exists`);
      if (password) {
        const { error } = await admin.auth.admin.updateUserById(user.id, { password });
        if (error) throw error;
        console.log("✓ password updated from env");
      }
    }

    await db.$transaction(
      async (tx) => {
        await tx.profile.upsert({
          where: { id: user!.id },
          create: { id: user!.id, email, fullName: values.name ?? null },
          update: { email, isActive: true, ...(values.name ? { fullName: values.name } : {}) },
        });
        await tx.userRole.upsert({
          where: { profileId_role: { profileId: user!.id, role } },
          create: { profileId: user!.id, role },
          update: {},
        });
        await tx.auditLog.create({
          data: {
            actorProfileId: null,
            action: "staff.role_granted",
            entity: "Profile",
            entityId: user!.id,
            data: { role, via: "scripts/create-staff.ts" },
          },
        });
      },
      { timeout: 60_000, maxWait: 20_000 },
    ); // generous: remote DB round trips can be slow
    console.log(`✓ ${email} has role ${role}`);
    if (!password && role !== "CUSTOMER") {
      console.log("Next: open /admin/login → “Set or reset password” to choose a password.");
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
