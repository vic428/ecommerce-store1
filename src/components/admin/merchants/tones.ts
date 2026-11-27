import type { Tone } from "@/components/admin/ui";
import type { MerchantStatus } from "@/lib/merchants/rules";

export const merchantStatusTone: Record<MerchantStatus, Tone> = {
  LEAD: "grey",
  ONBOARDING: "blue",
  PENDING_APPROVAL: "amber",
  ACTIVE: "green",
  SUSPENDED: "red",
  INACTIVE: "grey",
  TERMINATED: "red",
};
