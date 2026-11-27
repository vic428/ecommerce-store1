/**
 * ⚠ DEMO CONTENT — fictional merchants for development and tests. They are not real
 * businesses and their commission rates are not agreed terms. Replace with real merchant
 * records (entered by VARCH staff in /admin) before launch.
 */
import type { SeedMerchant } from "./types";

export const merchants: SeedMerchant[] = [
  {
    slug: "novatek-electronics",
    businessName: "Novatek Electronics",
    description: "Phones, audio, wearables and computer accessories.",
    email: "hello@novatek.example",
    city: "Lagos",
    state: "Lagos",
    country: "NG",
    preferredChannel: "WHATSAPP",
    status: "ACTIVE",
    agreementStatus: "SIGNED",
    contact: { name: "Demo Contact (Novatek)", role: "Owner", email: "owner@novatek.example" },
    agreements: [
      // An older agreement, kept to show snapshots don't change when terms change.
      { status: "SUPERSEDED", rateBps: 1500, effectiveFrom: "2025-01-01", effectiveTo: "2026-01-01" },
      { status: "ACTIVE", rateBps: 1200, effectiveFrom: "2026-01-01", paymentFeeBearer: "MERCHANT" },
    ],
  },
  {
    slug: "ekas-leather-collection",
    businessName: "Eka's Leather Collection",
    description: "Handmade leather bags and accessories.",
    email: "hello@ekasleather.example",
    city: "Aba",
    state: "Abia",
    country: "NG",
    preferredChannel: "WHATSAPP",
    status: "ACTIVE",
    agreementStatus: "SIGNED",
    contact: { name: "Demo Contact (Eka's)", role: "Founder" },
    agreements: [
      { status: "ACTIVE", rateBps: 1500, effectiveFrom: "2026-01-01", discountBearer: "MERCHANT" },
    ],
  },
  {
    slug: "stride-apparel",
    businessName: "Stride Apparel",
    description: "Everyday footwear and clothing.",
    email: "orders@stride.example",
    city: "Ibadan",
    state: "Oyo",
    country: "NG",
    status: "ACTIVE",
    // No agreement yet: the marketplace default applies.
    agreementStatus: "SENT",
  },
  {
    slug: "urban-nest-home",
    businessName: "Urban Nest Home",
    description: "Furniture, lighting and kitchenware.",
    city: "Abuja",
    state: "FCT",
    country: "NG",
    status: "ACTIVE",
    agreementStatus: "SIGNED",
    agreements: [{ status: "ACTIVE", rateBps: 1000, effectiveFrom: "2026-01-01" }],
  },
  {
    slug: "glowlab-naturals",
    businessName: "Glowlab Naturals",
    description: "Skincare made in small batches.",
    city: "Lagos",
    state: "Lagos",
    country: "NG",
    status: "ACTIVE",
    agreementStatus: "SIGNED",
    agreements: [{ status: "ACTIVE", rateBps: 1800, effectiveFrom: "2026-01-01" }],
  },
  {
    slug: "fitlagos-sports",
    businessName: "FitLagos Sports",
    description: "Fitness and outdoor gear.",
    city: "Lagos",
    state: "Lagos",
    country: "NG",
    status: "ACTIVE",
    agreementStatus: "SIGNED",
    agreements: [{ status: "ACTIVE", rateBps: 1000, effectiveFrom: "2026-01-01" }],
  },
  {
    // Suspended: its products must not appear or be purchasable.
    slug: "little-stars-toys",
    businessName: "Little Stars Toys",
    description: "Toys and games.",
    city: "Port Harcourt",
    state: "Rivers",
    country: "NG",
    status: "SUSPENDED",
    agreementStatus: "SIGNED",
    agreements: [{ status: "ACTIVE", rateBps: 1000, effectiveFrom: "2026-01-01" }],
  },
  {
    // Lead: in conversation, nothing listed yet.
    slug: "kemi-kitchen-foods",
    businessName: "Kemi's Kitchen Foods",
    description: "Packaged foods and spices.",
    city: "Lagos",
    state: "Lagos",
    country: "NG",
    status: "LEAD",
    agreementStatus: "NONE",
  },
];
