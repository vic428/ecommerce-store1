"use client";

import { useActionState, useState } from "react";
import {
  activateAgreement,
  changeMerchantStatus,
  createAgreement,
  createMerchant,
  endAgreement,
  removeContact,
  saveContact,
  updateMerchantProfile,
  updateSettlementDetails,
} from "@/actions/admin-merchants";
import type { ActionState } from "@/lib/auth/action";
import {
  AGREEMENT_STATUSES,
  CONTACT_CHANNELS,
  MERCHANT_STATUSES,
  merchantStatusLabel,
  needsConfirmation,
  type MerchantStatus,
} from "@/lib/merchants/rules";
import { Field, Select, TextArea, TextInput } from "@/components/admin/ui";
import { ConfirmButton, FormMessage, SubmitButton } from "@/components/admin/form-bits";
import { buttonClasses } from "@/components/ui/button";

const idle: ActionState = { status: "idle" };
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

type Values = Record<string, string | null | undefined>;

function useValue(state: ActionState, initial: Values) {
  return (name: string) => state.values?.[name] ?? initial[name] ?? "";
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function MerchantProfileForm({ merchantId, initial }: { merchantId?: string; initial: Values }) {
  const action = merchantId ? updateMerchantProfile.bind(null, merchantId) : createMerchant;
  const [state, formAction] = useActionState(action, idle);
  const v = useValue(state, initial);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" name="businessName" error={e.businessName}>
          <TextInput name="businessName" error={e.businessName} defaultValue={v("businessName")} required />
        </Field>
        <Field
          label="Registered legal name"
          name="legalName"
          error={e.legalName}
          hint="If different from the trading name"
        >
          <TextInput name="legalName" error={e.legalName} defaultValue={v("legalName")} />
        </Field>
        {!merchantId && (
          <Field label="Starting status" name="status" error={e.status}>
            <Select
              name="status"
              error={e.status}
              defaultValue={v("status") || "LEAD"}
              options={MERCHANT_STATUSES.filter((s) => s !== "TERMINATED").map((s) => ({
                value: s,
                label: merchantStatusLabel[s],
              }))}
            />
          </Field>
        )}
        <Field
          label="Agreement status"
          name="agreementStatus"
          error={e.agreementStatus}
          hint="Where the paperwork stands"
        >
          <Select
            name="agreementStatus"
            defaultValue={v("agreementStatus") || "NONE"}
            options={AGREEMENT_STATUSES.map((s) => ({ value: s, label: label(s) }))}
          />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <TextInput name="email" type="email" error={e.email} defaultValue={v("email")} autoComplete="off" />
        </Field>
        <Field label="Phone" name="phone" error={e.phone}>
          <TextInput name="phone" type="tel" error={e.phone} defaultValue={v("phone")} autoComplete="off" />
        </Field>
        <Field label="Preferred contact channel" name="preferredChannel">
          <Select
            name="preferredChannel"
            defaultValue={v("preferredChannel") || "EMAIL"}
            options={CONTACT_CHANNELS.map((c) => ({
              value: c,
              label: c === "WHATSAPP" ? "WhatsApp" : label(c),
            }))}
          />
        </Field>
        <Field
          label="Logo URL"
          name="logoUrl"
          error={e.logoUrl}
          hint="https:// link for now; uploads come with the product module"
        >
          <TextInput name="logoUrl" error={e.logoUrl} defaultValue={v("logoUrl")} />
        </Field>
        <Field label="Address line 1" name="addressLine1" error={e.addressLine1}>
          <TextInput name="addressLine1" error={e.addressLine1} defaultValue={v("addressLine1")} />
        </Field>
        <Field label="Address line 2" name="addressLine2" error={e.addressLine2}>
          <TextInput name="addressLine2" error={e.addressLine2} defaultValue={v("addressLine2")} />
        </Field>
        <Field label="City" name="city" error={e.city}>
          <TextInput name="city" error={e.city} defaultValue={v("city")} />
        </Field>
        <Field label="State" name="state" error={e.state}>
          <TextInput name="state" error={e.state} defaultValue={v("state")} />
        </Field>
        <Field label="Country code" name="country" error={e.country} hint="2 letters, e.g. NG">
          <TextInput name="country" error={e.country} defaultValue={v("country") || "NG"} maxLength={2} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Registration type"
            name="registrationType"
            error={e.registrationType}
            hint="e.g. CAC RC / BN"
          >
            <TextInput
              name="registrationType"
              error={e.registrationType}
              defaultValue={v("registrationType")}
            />
          </Field>
          <Field label="Registration number" name="registrationNumber" error={e.registrationNumber}>
            <TextInput
              name="registrationNumber"
              error={e.registrationNumber}
              defaultValue={v("registrationNumber")}
            />
          </Field>
        </div>
      </div>
      <Field label="Business description" name="description" error={e.description}>
        <TextArea name="description" error={e.description} defaultValue={v("description")} />
      </Field>
      <Field
        label="Internal notes"
        name="internalNotes"
        error={e.internalNotes}
        hint="Staff only. Never shown to customers."
      >
        <TextArea name="internalNotes" error={e.internalNotes} defaultValue={v("internalNotes")} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton>{merchantId ? "Save details" : "Create merchant"}</SubmitButton>
      </div>
    </form>
  );
}

// ─── Status ──────────────────────────────────────────────────────────────────

export function StatusChanger({
  merchantId,
  current,
  productCount,
  canTerminate,
}: {
  merchantId: string;
  current: MerchantStatus;
  productCount: number;
  canTerminate: boolean;
}) {
  const [state, formAction] = useActionState(changeMerchantStatus.bind(null, merchantId), idle);
  const options = MERCHANT_STATUSES.filter((s) => s !== current && (s !== "TERMINATED" || canTerminate));
  const [to, setTo] = useState<MerchantStatus>(options[0] ?? current);

  if (current === "TERMINATED") {
    return (
      <p className="text-muted text-sm">
        This merchant is terminated. Their history is kept; the record can&apos;t be reactivated.
      </p>
    );
  }
  const confirm = needsConfirmation(current, to);

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <Field label="Change status to" name="status">
          <Select
            name="status"
            value={to}
            onChange={(ev) => setTo(ev.target.value as MerchantStatus)}
            options={options.map((s) => ({ value: s, label: merchantStatusLabel[s] }))}
          />
        </Field>
        <Field label="Reason (recorded in the activity log)" name="reason">
          <TextInput name="reason" maxLength={500} />
        </Field>
      </div>
      {confirm && (
        <label className="rounded-brand border-danger/30 bg-danger/5 flex items-start gap-2 border p-3 text-sm">
          <input type="checkbox" name="confirm" value="yes" required className="mt-0.5" />
          <span>
            {to === "TERMINATED"
              ? "Terminate this merchant. Their listings are hidden permanently; orders and financial records are kept. This can't be undone."
              : `Hide this merchant's ${productCount} product${productCount === 1 ? "" : "s"} from the storefront until they're made active again.`}
          </span>
        </label>
      )}
      <div className="flex justify-end">
        <SubmitButton variant={confirm ? "secondary" : "primary"} pendingText="Updating…">
          Update status
        </SubmitButton>
      </div>
    </form>
  );
}

// ─── Contacts ────────────────────────────────────────────────────────────────

type Contact = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

function ContactForm({
  merchantId,
  contact,
  onDone,
}: {
  merchantId: string;
  contact?: Contact;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await saveContact(merchantId, contact?.id ?? null, prev, fd);
    if (r.status === "success") onDone?.();
    return r;
  }, idle);
  const v = useValue(state, (contact ?? {}) as unknown as Values);
  const e = state.fieldErrors ?? {};
  const p = contact ? `c-${contact.id}-` : "c-new-";
  return (
    <form action={formAction} className="rounded-brand border-border space-y-3 border p-3" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" name={`${p}name`} error={e.name}>
          <TextInput id={`f-${p}name`} name="name" error={e.name} defaultValue={v("name")} />
        </Field>
        <Field label="Role" name={`${p}role`} error={e.role}>
          <TextInput id={`f-${p}role`} name="role" error={e.role} defaultValue={v("role")} />
        </Field>
        <Field label="Email" name={`${p}email`} error={e.email}>
          <TextInput id={`f-${p}email`} name="email" type="email" error={e.email} defaultValue={v("email")} />
        </Field>
        <Field label="Phone" name={`${p}phone`} error={e.phone}>
          <TextInput id={`f-${p}phone`} name="phone" type="tel" error={e.phone} defaultValue={v("phone")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPrimary" defaultChecked={contact?.isPrimary ?? false} /> Primary
        contact
      </label>
      <div className="flex justify-end gap-2">
        {onDone && contact && (
          <button
            type="button"
            className={buttonClasses({ variant: "outline", size: "sm" })}
            onClick={onDone}
          >
            Cancel
          </button>
        )}
        <SubmitButton>{contact ? "Save contact" : "Add contact"}</SubmitButton>
      </div>
    </form>
  );
}

export function ContactsManager({
  merchantId,
  contacts,
  canEdit,
}: {
  merchantId: string;
  contacts: Contact[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      {contacts.length === 0 && <p className="text-muted text-sm">No contacts yet.</p>}
      <ul className="space-y-2">
        {contacts.map((c) =>
          editing === c.id ? (
            <li key={c.id}>
              <ContactForm merchantId={merchantId} contact={c} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <span className="font-semibold">{c.name}</span>
                {c.isPrimary && <span className="text-muted"> · primary</span>}
                {c.role && <span className="text-muted"> · {c.role}</span>}
                <span className="text-muted block text-xs">
                  {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact details"}
                </span>
              </span>
              {canEdit && (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    className={buttonClasses({ variant: "outline", size: "sm" })}
                    onClick={() => setEditing(c.id)}
                  >
                    Edit
                  </button>
                  <ConfirmButton
                    label="Remove"
                    title={`Remove ${c.name}?`}
                    body="The contact is removed from this merchant. This is recorded in the activity log."
                    confirmLabel="Remove contact"
                    action={() => removeContact(merchantId, c.id)}
                  />
                </span>
              )}
            </li>
          ),
        )}
      </ul>
      {canEdit &&
        (adding ? (
          <ContactForm merchantId={merchantId} onDone={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            className={buttonClasses({ variant: "outline", size: "sm" })}
            onClick={() => setAdding(true)}
          >
            Add contact
          </button>
        ))}
    </div>
  );
}

// ─── Agreements ──────────────────────────────────────────────────────────────

export type AgreementRow = {
  id: string;
  phase: string;
  status: string;
  summary: string;
  basis: string;
  bearers: string;
  window: string;
  documentRef: string | null;
  notes: string | null;
};

export function AgreementsPanel({
  merchantId,
  agreements,
  canEdit,
  currency,
}: {
  merchantId: string;
  agreements: AgreementRow[];
  canEdit: boolean;
  currency: string;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-4">
      {agreements.length === 0 ? (
        <p className="text-muted text-sm">
          No agreements. The marketplace default commission applies to this merchant&apos;s sales until one is
          active.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm" data-testid="agreements-table">
            <thead className="text-muted text-xs uppercase">
              <tr>
                <th className="py-2 pr-3 font-semibold">Phase</th>
                <th className="py-2 pr-3 font-semibold">Commission</th>
                <th className="py-2 pr-3 font-semibold">Basis</th>
                <th className="py-2 pr-3 font-semibold">Discounts / fees borne by</th>
                <th className="py-2 pr-3 font-semibold">Effective</th>
                <th className="py-2 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {agreements.map((a) => (
                <tr key={a.id} data-phase={a.phase}>
                  <td className="py-2 pr-3 font-semibold">{a.phase}</td>
                  <td className="py-2 pr-3">{a.summary}</td>
                  <td className="py-2 pr-3">{a.basis}</td>
                  <td className="py-2 pr-3">{a.bearers}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{a.window}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {canEdit && a.status === "DRAFT" && (
                      <span className="flex justify-end gap-2">
                        <ConfirmButton
                          label="Activate"
                          danger={false}
                          title="Activate this agreement?"
                          body="It takes effect from its start date. Any agreement running then ends at that date. Orders already placed keep the commission they were sold under."
                          confirmLabel="Activate"
                          action={() => activateAgreement(merchantId, a.id)}
                        />
                        <ConfirmButton
                          label="Discard"
                          title="Discard this draft?"
                          body="The draft is deleted. Active and past agreements aren't affected."
                          confirmLabel="Discard draft"
                          action={() => endAgreement(merchantId, a.id)}
                        />
                      </span>
                    )}
                    {canEdit &&
                      a.status === "ACTIVE" &&
                      (a.phase === "In force" || a.phase === "Scheduled") && (
                        <ConfirmButton
                          label="Terminate"
                          title="Terminate this agreement?"
                          body="It stops applying now. New sales then use the marketplace default (or another active agreement). Past orders keep their commission."
                          confirmLabel="Terminate agreement"
                          action={() => endAgreement(merchantId, a.id)}
                        />
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canEdit &&
        (adding ? (
          <NewAgreementForm merchantId={merchantId} currency={currency} onDone={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            className={buttonClasses({ variant: "outline", size: "sm" })}
            onClick={() => setAdding(true)}
          >
            New agreement
          </button>
        ))}
    </div>
  );
}

function NewAgreementForm({
  merchantId,
  currency,
  onDone,
}: {
  merchantId: string;
  currency: string;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await createAgreement(merchantId, prev, fd);
    if (r.status === "success") onDone();
    return r;
  }, idle);
  const v = useValue(state, {});
  const e = state.fieldErrors ?? {};
  const [type, setType] = useState(v("commissionType") || "PERCENTAGE");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="rounded-brand border-border space-y-4 border p-4"
      noValidate
      data-testid="new-agreement-form"
    >
      <h3 className="font-bold">New commission agreement</h3>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Commission type" name="commissionType">
          <Select
            name="commissionType"
            value={type}
            onChange={(ev) => setType(ev.target.value)}
            options={[
              { value: "PERCENTAGE", label: "Percentage of sale" },
              { value: "FIXED_PER_UNIT", label: "Fixed amount per unit" },
            ]}
          />
        </Field>
        {type === "PERCENTAGE" ? (
          <Field label="Rate (%)" name="ratePercent" error={e.ratePercent} hint="0–100, up to 2 decimals">
            <TextInput
              name="ratePercent"
              inputMode="decimal"
              error={e.ratePercent}
              defaultValue={v("ratePercent")}
            />
          </Field>
        ) : (
          <Field label={`Amount per unit (${currency})`} name="fixedAmount" error={e.fixedAmount}>
            <TextInput
              name="fixedAmount"
              inputMode="decimal"
              error={e.fixedAmount}
              defaultValue={v("fixedAmount")}
            />
          </Field>
        )}
        <Field label="Effective from" name="effectiveFrom" error={e.effectiveFrom}>
          <TextInput
            name="effectiveFrom"
            type="date"
            error={e.effectiveFrom}
            defaultValue={v("effectiveFrom") || today}
          />
        </Field>
        <Field label="Commission is calculated on" name="commissionBasis">
          <Select
            name="commissionBasis"
            defaultValue={v("commissionBasis") || "NET_OF_DISCOUNT"}
            options={[
              { value: "NET_OF_DISCOUNT", label: "Price after discounts" },
              { value: "GROSS_BEFORE_DISCOUNT", label: "Price before discounts" },
            ]}
          />
        </Field>
        <Field label="Discounts are borne by" name="discountBearer">
          <Select
            name="discountBearer"
            defaultValue={v("discountBearer") || "VARCH"}
            options={[
              { value: "VARCH", label: "VARCH" },
              { value: "MERCHANT", label: "Merchant" },
            ]}
          />
        </Field>
        <Field label="Payment fees are borne by" name="paymentFeeBearer">
          <Select
            name="paymentFeeBearer"
            defaultValue={v("paymentFeeBearer") || "VARCH"}
            options={[
              { value: "VARCH", label: "VARCH" },
              { value: "MERCHANT", label: "Merchant" },
            ]}
          />
        </Field>
        <Field label="Signed on" name="signedAt">
          <TextInput name="signedAt" type="date" defaultValue={v("signedAt")} />
        </Field>
        <Field label="Document reference" name="documentRef" error={e.documentRef} className="sm:col-span-2">
          <TextInput
            name="documentRef"
            error={e.documentRef}
            defaultValue={v("documentRef")}
            placeholder="e.g. file name or contract number"
          />
        </Field>
      </div>
      <Field label="Notes" name="notes" error={e.notes}>
        <TextArea name="notes" error={e.notes} defaultValue={v("notes")} className="min-h-16" />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="activate" defaultChecked={false} className="mt-0.5" />
        <span>
          Activate now. It applies from the start date; any agreement running then ends at that date. Leave
          unticked to save as a draft.
        </span>
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClasses({ variant: "outline" })} onClick={onDone}>
          Cancel
        </button>
        <SubmitButton>Save agreement</SubmitButton>
      </div>
    </form>
  );
}

// ─── Settlement details ──────────────────────────────────────────────────────

export function SettlementDetailsForm({ merchantId, initial }: { merchantId: string; initial: Values }) {
  const [state, formAction] = useActionState(updateSettlementDetails.bind(null, merchantId), idle);
  const v = useValue(state, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <p className="text-muted text-xs">
        Only the bank name, account name and last 4 digits are stored here. Full account details belong with
        the payment provider.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank" name="settlementBankName" error={e.settlementBankName}>
          <TextInput
            name="settlementBankName"
            error={e.settlementBankName}
            defaultValue={v("settlementBankName")}
          />
        </Field>
        <Field label="Account name" name="settlementAccountName" error={e.settlementAccountName}>
          <TextInput
            name="settlementAccountName"
            error={e.settlementAccountName}
            defaultValue={v("settlementAccountName")}
          />
        </Field>
        <Field
          label="Account number: last 4 digits"
          name="settlementAccountLast4"
          error={e.settlementAccountLast4}
        >
          <TextInput
            name="settlementAccountLast4"
            inputMode="numeric"
            maxLength={4}
            error={e.settlementAccountLast4}
            defaultValue={v("settlementAccountLast4")}
          />
        </Field>
        <Field
          label="Provider recipient reference"
          name="providerRecipientRef"
          error={e.providerRecipientRef}
        >
          <TextInput
            name="providerRecipientRef"
            error={e.providerRecipientRef}
            defaultValue={v("providerRecipientRef")}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <SubmitButton>Save settlement details</SubmitButton>
      </div>
    </form>
  );
}
