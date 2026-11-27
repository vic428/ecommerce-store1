import { z } from "zod";
import { AGREEMENT_STATUSES, CONTACT_CHANNELS, MERCHANT_STATUSES, percentToBps } from "./rules";

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

const optEmail = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v.toLowerCase()))
  .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address.");

const optPhone = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^\+?[0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number.");

/** Logo: a site path (/…) or an https URL. Uploads arrive with Supabase Storage in slice 3. */
const optImageUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => {
    if (v === null) return true;
    if (/^\/(?![/\\])/.test(v)) return true;
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an https:// link or a site path starting with /.");

/** Profile fields editable by staff with merchants:write. */
export const merchantProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Enter the business name.").max(120),
  legalName: opt(160),
  description: opt(2000),
  logoUrl: optImageUrl,
  email: optEmail,
  phone: optPhone,
  addressLine1: opt(160),
  addressLine2: opt(160),
  city: opt(80),
  state: opt(80),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use a 2-letter country code, e.g. NG.")
    .or(z.literal("").transform(() => null)),
  registrationType: opt(40),
  registrationNumber: opt(40),
  preferredChannel: z.enum(CONTACT_CHANNELS),
  agreementStatus: z.enum(AGREEMENT_STATUSES),
  internalNotes: opt(4000),
});

export const merchantCreateSchema = merchantProfileSchema.extend({
  // TERMINATED isn't a valid starting point.
  status: z.enum(MERCHANT_STATUSES).refine((s) => s !== "TERMINATED", "Choose a starting status."),
});

/** Bank details: stored minimally (never full account numbers). merchant-bank:read only. */
export const settlementDetailsSchema = z.object({
  settlementBankName: opt(80),
  settlementAccountName: opt(120),
  settlementAccountLast4: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^\d{4}$/.test(v), "Enter exactly the last 4 digits."),
  providerRecipientRef: opt(80),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter the contact's name.").max(120),
  role: opt(80),
  email: optEmail,
  phone: optPhone,
  isPrimary: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

const dateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
  .transform((v) => new Date(`${v}T00:00:00Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Pick a valid date.");

/** New commission agreement. Rate entered as a percentage, fixed amount in major units. */
export function agreementSchema(minorUnits: number) {
  return z
    .object({
      commissionType: z.enum(["PERCENTAGE", "FIXED_PER_UNIT"]),
      ratePercent: z.string().trim().optional().default(""),
      fixedAmount: z.string().trim().optional().default(""),
      commissionBasis: z.enum(["GROSS_BEFORE_DISCOUNT", "NET_OF_DISCOUNT"]),
      discountBearer: z.enum(["VARCH", "MERCHANT"]),
      paymentFeeBearer: z.enum(["VARCH", "MERCHANT"]),
      effectiveFrom: dateInput,
      signedAt: z
        .string()
        .trim()
        .transform((v) => (v === "" ? null : new Date(`${v}T00:00:00Z`))),
      documentRef: opt(200),
      notes: opt(2000),
      activate: z
        .string()
        .optional()
        .transform((v) => v === "on" || v === "true"),
    })
    .transform((v, ctx) => {
      let rateBps: number | null = null;
      let fixed: number | null = null;
      if (v.commissionType === "PERCENTAGE") {
        rateBps = percentToBps(v.ratePercent);
        if (rateBps === null) {
          ctx.addIssue({
            code: "custom",
            path: ["ratePercent"],
            message: "Enter a rate from 0 to 100, up to 2 decimals.",
          });
          return z.NEVER;
        }
      } else {
        const m = /^\d{1,9}(?:\.\d{1,2})?$/.exec(v.fixedAmount);
        if (!m) {
          ctx.addIssue({
            code: "custom",
            path: ["fixedAmount"],
            message: "Enter an amount, up to 2 decimals.",
          });
          return z.NEVER;
        }
        const [whole, frac = ""] = v.fixedAmount.split(".");
        fixed = Number(whole) * minorUnits + Math.round((Number(frac.padEnd(2, "0")) * minorUnits) / 100);
      }
      return { ...v, rateBps, fixed };
    });
}

/** zod issues → { field: first message } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
