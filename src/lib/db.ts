import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { pgPoolConfig } from "./pg-config";

/**
 * Shared Prisma client. Server-only: importing this from a client component fails the build,
 * which keeps database access (and DATABASE_URL) off the browser. Connection settings (TLS,
 * pool size) come from ./pg-config.
 */
function createClient() {
  return new PrismaClient({ adapter: new PrismaPg(pgPoolConfig()) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Reuse one client across hot reloads in development.
export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
