"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** What the user typed, echoed back so the field isn't cleared on a validation error. */
  email?: string;
};

const input = z.object({ email: z.email("Please enter a valid email address.").max(254) });

/**
 * Newsletter sign-up. Always validated on the server. The response is the same whether or not
 * the address was already subscribed, so the form can't be used to check who is on the list.
 * TODO(Phase 5): add per-IP rate limiting before launch.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const { features } = await getSettings();
  if (!features.newsletter) return { status: "error", message: "Newsletter sign-up is not available." };

  const raw = String(formData.get("email") ?? "").slice(0, 254);
  const parsed = input.safeParse({ email: raw.trim().toLowerCase() });
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid email.", email: raw };

  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: {},
    });
  } catch (err) {
    console.error("[newsletter] subscribe failed", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  return { status: "success", message: "Thanks for subscribing! Watch your inbox for deals." };
}
