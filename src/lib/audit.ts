import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Append an entry to the audit log (AuditLog). Call for every staff action that changes data,
 * every sign-in/sign-out, and every financial action. Never log secrets or passwords.
 * Pass `tx` to write inside the same transaction as the change being recorded.
 */
export async function recordAudit(
  entry: {
    actorProfileId: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    merchantId?: string | null;
    data?: Prisma.InputJsonValue;
  },
  tx: Pick<typeof db, "auditLog"> = db,
) {
  await tx.auditLog.create({
    data: {
      actorProfileId: entry.actorProfileId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      merchantId: entry.merchantId ?? null,
      data: entry.data,
    },
  });
}
