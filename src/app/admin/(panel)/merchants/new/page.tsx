import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/session";
import { EmptyState, PageHeader, Section } from "@/components/admin/ui";
import { MerchantProfileForm } from "@/components/admin/merchants/merchant-forms";

export const metadata: Metadata = { title: "Add merchant" };

async function NewMerchant() {
  const principal = await requireStaffPage("merchants:write");
  if (!principal) return <EmptyState title="You don't have permission to add merchants." />;
  return (
    <>
      <PageHeader
        title="Add merchant"
        description="Create the business record. Contacts, agreements and products are added on the next screen."
        back={
          <Link href="/admin/merchants" className="text-muted text-sm hover:underline">
            ← Merchants
          </Link>
        }
      />
      <Section title="Business details">
        <MerchantProfileForm
          initial={{ country: "NG", preferredChannel: "EMAIL", agreementStatus: "NONE", status: "LEAD" }}
        />
      </Section>
    </>
  );
}

export default function NewMerchantPage() {
  return (
    <Suspense fallback={<p className="text-muted text-sm">Loading…</p>}>
      <NewMerchant />
    </Suspense>
  );
}
