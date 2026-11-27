"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { CacheTags } from "@/lib/cache-tags";
import { getSettings } from "@/lib/settings";
import { authorizeAction, actionError, formValues, type ActionState } from "@/lib/auth/action";
import { ForbiddenError } from "@/lib/auth/permissions";
import {
  AgreementConflictError,
  canChangeStatus,
  MERCHANT_STATUSES,
  needsConfirmation,
  planAgreementActivation,
  slugify,
  type MerchantStatus,
} from "@/lib/merchants/rules";
import {
  agreementSchema,
  contactSchema,
  fieldErrors,
  merchantCreateSchema,
  merchantProfileSchema,
  settlementDetailsSchema,
} from "@/lib/merchants/schema";
import type { Prisma } from "@/generated/prisma/client";

/** Interactive transactions over a remote pooler need more than Prisma's 5s default. */
const TX = { timeout: 30_000, maxWait: 15_000 } as const;

const invalid = (fd: FormData, errors: Record<string, string>): ActionState => ({
  status: "error",
  message: "Please fix the highlighted fields.",
  fieldErrors: errors,
  values: formValues(fd),
});

/** Which keys changed between before/after (for the audit log). */
function changedFields<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [k, v] of Object.entries(after)) {
    const prev = before[k];
    const a = prev instanceof Date ? prev.toISOString() : prev;
    const b = v instanceof Date ? v.toISOString() : v;
    if (a !== b) changes[k] = { from: a ?? null, to: b ?? null };
  }
  return changes;
}

async function uniqueSlug(tx: Prisma.TransactionClient, name: string) {
  const base = slugify(name) || "merchant";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    if (!(await tx.merchant.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  throw new Error("Could not allocate a unique slug");
}

// ─── Merchant profile ────────────────────────────────────────────────────────

export async function createMerchant(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let id: string;
  try {
    const principal = await authorizeAction("merchants:write");
    const parsed = merchantCreateSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return invalid(fd, fieldErrors(parsed.error));
    const data = parsed.data;

    id = await db.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          ...data,
          slug: await uniqueSlug(tx, data.businessName),
          onboardedAt: data.status === "ACTIVE" ? new Date() : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: "merchant.created",
          entity: "Merchant",
          entityId: merchant.id,
          merchantId: merchant.id,
          data: { businessName: data.businessName, status: data.status },
        },
      });
      return merchant.id;
    }, TX);
    if (data.status === "ACTIVE") updateTag(CacheTags.catalog);
  } catch (err) {
    return actionError(err, "merchant.create");
  }
  redirect(`/admin/merchants/${id}?created=1`);
}

export async function updateMerchantProfile(
  merchantId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    const principal = await authorizeAction("merchants:write");
    const parsed = merchantProfileSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return invalid(fd, fieldErrors(parsed.error));

    const nameChanged = await db.$transaction(async (tx) => {
      const before = await tx.merchant.findUniqueOrThrow({ where: { id: merchantId } });
      const changes = changedFields(before, parsed.data);
      if (Object.keys(changes).length === 0) return false;
      await tx.merchant.update({ where: { id: merchantId }, data: parsed.data });
      // Internal notes can be long; record that they changed, not the full text twice.
      if (changes.internalNotes) changes.internalNotes = { from: "(changed)", to: "(changed)" };
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: "merchant.updated",
          entity: "Merchant",
          entityId: merchantId,
          merchantId,
          data: { changes } as Prisma.InputJsonValue,
        },
      });
      return "businessName" in changes;
    }, TX);
    // Product cards show the merchant's name.
    if (nameChanged) updateTag(CacheTags.catalog);
    refresh();
    return { status: "success", message: "Merchant details saved." };
  } catch (err) {
    return actionError(err, "merchant.update");
  }
}

export async function updateSettlementDetails(
  merchantId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    const principal = await authorizeAction("merchant-bank:read");
    const parsed = settlementDetailsSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return invalid(fd, fieldErrors(parsed.error));
    await db.$transaction(async (tx) => {
      await tx.merchant.update({ where: { id: merchantId }, data: parsed.data });
      // Never copy bank details into the audit log.
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: "merchant.settlement_details_updated",
          entity: "Merchant",
          entityId: merchantId,
          merchantId,
        },
      });
    }, TX);
    refresh();
    return { status: "success", message: "Settlement details saved." };
  } catch (err) {
    return actionError(err, "merchant.settlement");
  }
}

export async function changeMerchantStatus(
  merchantId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    const to = String(fd.get("status") ?? "") as MerchantStatus;
    if (!MERCHANT_STATUSES.includes(to)) return { status: "error", message: "Choose a status." };
    const principal = await authorizeAction(
      "merchants:write",
      ...(to === "TERMINATED" ? (["merchants:offboard"] as const) : []),
    );
    const reason =
      String(fd.get("reason") ?? "")
        .trim()
        .slice(0, 500) || null;

    const result = await db.$transaction(async (tx) => {
      const m = await tx.merchant.findUniqueOrThrow({
        where: { id: merchantId },
        select: { status: true, onboardedAt: true },
      });
      if (!canChangeStatus(m.status, to)) {
        return {
          ok: false as const,
          message:
            m.status === "TERMINATED"
              ? "Terminated merchants can't be reactivated."
              : "Pick a different status.",
        };
      }
      if (needsConfirmation(m.status, to) && fd.get("confirm") !== "yes") {
        return { ok: false as const, message: "Please confirm this change." };
      }
      await tx.merchant.update({
        where: { id: merchantId },
        data: {
          status: to,
          ...(to === "ACTIVE" && !m.onboardedAt ? { onboardedAt: new Date() } : {}),
          ...(to === "TERMINATED" ? { terminatedAt: new Date() } : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: "merchant.status_changed",
          entity: "Merchant",
          entityId: merchantId,
          merchantId,
          data: { from: m.status, to, reason },
        },
      });
      return { ok: true as const, from: m.status };
    }, TX);

    if (!result.ok) return { status: "error", message: result.message };
    // Listings appear/disappear with ACTIVE status.
    if (result.from === "ACTIVE" || to === "ACTIVE") updateTag(CacheTags.catalog);
    refresh();
    return { status: "success", message: `Status changed to ${to.toLowerCase().replace(/_/g, " ")}.` };
  } catch (err) {
    return actionError(err, "merchant.status");
  }
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function saveContact(
  merchantId: string,
  contactId: string | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    const principal = await authorizeAction("merchants:write");
    const parsed = contactSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return invalid(fd, fieldErrors(parsed.error));
    await db.$transaction(async (tx) => {
      if (contactId) {
        // Scope the update to this merchant so a contact id from another merchant can't be edited.
        const owned = await tx.merchantContact.count({ where: { id: contactId, merchantId } });
        if (!owned) throw new ForbiddenError("That contact doesn't belong to this merchant.");
      }
      if (parsed.data.isPrimary) {
        await tx.merchantContact.updateMany({
          where: { merchantId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      const saved = contactId
        ? await tx.merchantContact.update({ where: { id: contactId }, data: parsed.data })
        : await tx.merchantContact.create({ data: { ...parsed.data, merchantId } });
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: contactId ? "merchant.contact_updated" : "merchant.contact_added",
          entity: "MerchantContact",
          entityId: saved.id,
          merchantId,
          data: { name: saved.name },
        },
      });
    }, TX);
    refresh();
    return { status: "success", message: contactId ? "Contact updated." : "Contact added." };
  } catch (err) {
    return actionError(err, "merchant.contact");
  }
}

export async function removeContact(merchantId: string, contactId: string): Promise<ActionState> {
  try {
    const principal = await authorizeAction("merchants:write");
    await db.$transaction(async (tx) => {
      const c = await tx.merchantContact.findFirst({ where: { id: contactId, merchantId } });
      if (!c) throw new ForbiddenError("That contact doesn't belong to this merchant.");
      await tx.merchantContact.delete({ where: { id: contactId } });
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: "merchant.contact_removed",
          entity: "MerchantContact",
          entityId: contactId,
          merchantId,
          data: { name: c.name },
        },
      });
    }, TX);
    refresh();
    return { status: "success", message: "Contact removed." };
  } catch (err) {
    return actionError(err, "merchant.contact.remove");
  }
}

// ─── Agreements ──────────────────────────────────────────────────────────────

async function activateWithinTx(tx: Prisma.TransactionClient, merchantId: string, from: Date) {
  const active = await tx.merchantAgreement.findMany({
    where: { merchantId, status: "ACTIVE" },
    select: { id: true, status: true, effectiveFrom: true, effectiveTo: true },
  });
  const plan = planAgreementActivation(active, from);
  for (const p of plan) {
    await tx.merchantAgreement.update({ where: { id: p.id }, data: { effectiveTo: p.effectiveTo } });
  }
  return plan;
}

export async function createAgreement(
  merchantId: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    const principal = await authorizeAction("agreements:write");
    const { commerce } = await getSettings();
    const parsed = agreementSchema(commerce.minorUnits).safeParse(Object.fromEntries(fd));
    if (!parsed.success) return invalid(fd, fieldErrors(parsed.error));
    const a = parsed.data;

    await db.$transaction(async (tx) => {
      const ended = a.activate ? await activateWithinTx(tx, merchantId, a.effectiveFrom) : [];
      const created = await tx.merchantAgreement.create({
        data: {
          merchantId,
          status: a.activate ? "ACTIVE" : "DRAFT",
          commissionType: a.commissionType,
          rateBps: a.rateBps,
          fixedAmount: a.fixed,
          commissionBasis: a.commissionBasis,
          discountBearer: a.discountBearer,
          paymentFeeBearer: a.paymentFeeBearer,
          effectiveFrom: a.effectiveFrom,
          signedAt: a.signedAt,
          documentRef: a.documentRef,
          notes: a.notes,
        },
      });
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: a.activate ? "agreement.created_active" : "agreement.created_draft",
          entity: "MerchantAgreement",
          entityId: created.id,
          merchantId,
          data: {
            commissionType: a.commissionType,
            rateBps: a.rateBps,
            fixedAmount: a.fixed,
            effectiveFrom: a.effectiveFrom.toISOString(),
            endedAgreements: ended.map((e) => e.id),
          },
        },
      });
    }, TX);
    refresh();
    return { status: "success", message: a.activate ? "Agreement activated." : "Draft agreement saved." };
  } catch (err) {
    if (err instanceof AgreementConflictError)
      return { status: "error", message: err.message, values: formValues(fd) };
    return actionError(err, "agreement.create");
  }
}

export async function activateAgreement(merchantId: string, agreementId: string): Promise<ActionState> {
  try {
    const principal = await authorizeAction("agreements:write");
    await db.$transaction(async (tx) => {
      const a = await tx.merchantAgreement.findFirst({ where: { id: agreementId, merchantId } });
      if (!a) throw new ForbiddenError("That agreement doesn't belong to this merchant.");
      if (a.status !== "DRAFT") throw new AgreementConflictError("Only draft agreements can be activated.");
      const ended = await activateWithinTx(tx, merchantId, a.effectiveFrom);
      await tx.merchantAgreement.update({ where: { id: agreementId }, data: { status: "ACTIVE" } });
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: "agreement.activated",
          entity: "MerchantAgreement",
          entityId: agreementId,
          merchantId,
          data: { endedAgreements: ended.map((e) => e.id) },
        },
      });
    }, TX);
    refresh();
    return { status: "success", message: "Agreement activated." };
  } catch (err) {
    if (err instanceof AgreementConflictError) return { status: "error", message: err.message };
    return actionError(err, "agreement.activate");
  }
}

/** Terminate an active agreement now, or discard a draft. Past windows are never rewritten. */
export async function endAgreement(merchantId: string, agreementId: string): Promise<ActionState> {
  try {
    const principal = await authorizeAction("agreements:write");
    const outcome = await db.$transaction(async (tx) => {
      const a = await tx.merchantAgreement.findFirst({ where: { id: agreementId, merchantId } });
      if (!a) throw new ForbiddenError("That agreement doesn't belong to this merchant.");
      if (a.status === "DRAFT") {
        await tx.merchantAgreement.delete({ where: { id: agreementId } });
      } else if (a.status === "ACTIVE") {
        const now = new Date();
        await tx.merchantAgreement.update({
          where: { id: agreementId },
          data: {
            status: "TERMINATED",
            // Keep the real end of the window for history; cap it at now if it was still running.
            effectiveTo: a.effectiveTo && a.effectiveTo < now ? a.effectiveTo : now,
          },
        });
      } else {
        throw new AgreementConflictError("This agreement has already ended.");
      }
      await tx.auditLog.create({
        data: {
          actorProfileId: principal.profileId,
          action: a.status === "DRAFT" ? "agreement.draft_discarded" : "agreement.terminated",
          entity: "MerchantAgreement",
          entityId: agreementId,
          merchantId,
        },
      });
      return a.status === "DRAFT" ? "Draft discarded." : "Agreement terminated.";
    }, TX);
    refresh();
    return { status: "success", message: outcome };
  } catch (err) {
    if (err instanceof AgreementConflictError) return { status: "error", message: err.message };
    return actionError(err, "agreement.end");
  }
}
