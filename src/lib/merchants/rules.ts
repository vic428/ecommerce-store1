/**
 * Merchant management rules. Pure functions (no I/O) so they are unit tested and shared by
 * server actions and the admin UI.
 */

export const MERCHANT_STATUSES = [
  "LEAD",
  "ONBOARDING",
  "PENDING_APPROVAL",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "TERMINATED",
] as const;
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];

export const AGREEMENT_STATUSES = ["NONE", "DRAFT", "SENT", "SIGNED", "EXPIRED", "TERMINATED"] as const;
export const CONTACT_CHANNELS = ["EMAIL", "PHONE", "WHATSAPP", "SMS"] as const;

export const merchantStatusLabel: Record<MerchantStatus, string> = {
  LEAD: "Lead",
  ONBOARDING: "Onboarding",
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  INACTIVE: "Inactive",
  TERMINATED: "Terminated",
};

/** Statuses that hide the merchant's listings and block purchases (anything but ACTIVE). */
export function hidesListings(status: MerchantStatus) {
  return status !== "ACTIVE";
}

/**
 * Allowed status changes. TERMINATED is final: a returning business is onboarded as a new
 * merchant record so the terminated record's history stays untouched.
 */
export function canChangeStatus(from: MerchantStatus, to: MerchantStatus): boolean {
  if (from === to) return false;
  if (from === "TERMINATED") return false;
  return true;
}

/** Status changes that need an explicit confirmation in the UI (they hide live listings). */
export function needsConfirmation(from: MerchantStatus, to: MerchantStatus) {
  return to === "TERMINATED" || (from === "ACTIVE" && hidesListings(to));
}

/** "Eka's Leather Collection" → "ekas-leather-collection" */
export function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * "12.5" → 1250 basis points. Accepts 0–100 with up to two decimals. Integer maths only.
 * Returns null for invalid input.
 */
export function percentToBps(input: string): number | null {
  const s = input.trim().replace(/%$/, "").trim();
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const bps = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
  return bps <= 10_000 ? bps : null;
}

/** 1250 → "12.5%" */
export function formatBps(bps: number) {
  const whole = Math.floor(bps / 100);
  const frac = bps % 100;
  return frac === 0 ? `${whole}%` : `${whole}.${String(frac).padStart(2, "0").replace(/0$/, "")}%`;
}

type AgreementLike = {
  id: string;
  status: "DRAFT" | "ACTIVE" | "SUPERSEDED" | "TERMINATED";
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type AgreementPhase = "Draft" | "Scheduled" | "In force" | "Ended" | "Superseded" | "Terminated";

export function agreementPhase(a: AgreementLike, now: Date): AgreementPhase {
  if (a.status === "DRAFT") return "Draft";
  if (a.status === "TERMINATED") return "Terminated";
  if (a.status === "SUPERSEDED") return "Superseded";
  if (a.effectiveFrom > now) return "Scheduled";
  if (a.effectiveTo && a.effectiveTo <= now) return "Ended";
  return "In force";
}

export class AgreementConflictError extends Error {}

/**
 * Activating an agreement from `newFrom`: every ACTIVE agreement still running at that date is
 * given an end date of `newFrom`, so exactly one agreement is in force at any moment and the old
 * one keeps applying until the switch-over. Agreements already ended before `newFrom` are left
 * alone. An ACTIVE agreement that starts on/after `newFrom` is a conflict: terminate it first.
 *
 * Returns the end dates to set. Never changes rates or past windows, so commission snapshots on
 * existing orders are unaffected either way.
 */
export function planAgreementActivation(
  active: AgreementLike[],
  newFrom: Date,
): { id: string; effectiveTo: Date }[] {
  const running = active.filter((a) => a.status === "ACTIVE");
  const conflict = running.find((a) => a.effectiveFrom >= newFrom);
  if (conflict) {
    throw new AgreementConflictError(
      "Another active agreement starts on or after this date. Terminate it first, or pick a later start date.",
    );
  }
  return running
    .filter((a) => a.effectiveTo === null || a.effectiveTo > newFrom)
    .map((a) => ({ id: a.id, effectiveTo: newFrom }));
}
