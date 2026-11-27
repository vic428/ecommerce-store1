/**
 * Marketplace identity and commerce settings.
 *
 * ⚠ PLACEHOLDERS — the final brand name, tagline, contact details, delivery fees and commission
 * default are business decisions (see BUSINESS_DECISIONS.md). Values marked PLACEHOLDER/DEMO
 * must be replaced before launch.
 *
 * These values seed the database (`npm run db:seed`). Once live, staff edit them in /admin and
 * the database copy wins.
 */
import type { SettingsInput } from "@/lib/settings-schema";

export const businessConfig: SettingsInput["business"] = {
  name: "VARCH Marketplace", // PLACEHOLDER brand name
  tagline: "Independent businesses. One marketplace.", // PLACEHOLDER
  description:
    "Products from independent businesses, curated and delivered by VARCH Enterprises. (Placeholder copy.)",
  logoText: "VARCH",
  email: "support@varch.example", // PLACEHOLDER
  phone: "+234 000 000 0000", // PLACEHOLDER
  address: "Lagos, Nigeria (placeholder address)",
  social: [
    { platform: "facebook", url: "https://facebook.com/" },
    { platform: "x", url: "https://x.com/" },
    { platform: "instagram", url: "https://instagram.com/" },
    { platform: "youtube", url: "https://youtube.com/" },
    { platform: "linkedin", url: "https://linkedin.com/" },
  ],
};

export const commerceConfig: SettingsInput["commerce"] = {
  currency: "NGN",
  locale: "en-NG",
  minorUnits: 100,
  pricesIncludeTax: true,
  taxRatePercent: 0,
  paymentMethods: ["mock"],
  orderNumberPrefix: "VM",
  lowStockThreshold: 5,
};

/**
 * ⚠ DEMO VALUE — 10% marketplace default so the demo can price orders. The real default (or
 * none) is a business decision. Set `default: null` to require an agreement for every merchant.
 */
export const commissionConfig: SettingsInput["commission"] = {
  default: {
    type: "PERCENTAGE",
    rateBps: 1000,
    fixedAmount: null,
    basis: "NET_OF_DISCOUNT",
    discountBearer: "VARCH",
    paymentFeeBearer: "VARCH",
  },
  checkoutMode: "SINGLE_MERCHANT",
};

export const featuresConfig: SettingsInput["features"] = {
  wishlist: true,
  newsletter: true,
  promoBanners: true,
  customerAccounts: true,
  reviews: true,
  compare: false,
  guestCheckout: true,
};

export const announcementConfig: SettingsInput["announcement"] = {
  enabled: true,
  items: [
    { icon: "truck", text: "Free shipping on orders over ₦50,000" },
    { icon: "shield", text: "Secure payments" },
    { icon: "headset", text: "24/7 customer support" },
  ],
  links: [
    { label: "Track Order", href: "/account/orders" },
    { label: "Help", href: "/help" },
  ],
};

export const footerConfig: SettingsInput["footer"] = {
  paymentMarks: ["visa", "mastercard", "verve"],
};

/**
 * Delivery options offered at checkout. Prices are in minor units (kobo).
 * ⚠ DEMO VALUES — real delivery fees, thresholds and arrangements are a business decision.
 */
export const shippingMethodsConfig = [
  {
    code: "standard",
    name: "Standard delivery",
    description: "Delivered to your address",
    price: 2_500_00,
    freeOver: 50_000_00,
    etaText: "3–5 business days",
  },
  {
    code: "express",
    name: "Express delivery",
    description: "Priority dispatch",
    price: 5_000_00,
    freeOver: null,
    etaText: "1–2 business days",
  },
  {
    code: "pickup",
    name: "Store pickup",
    description: "Collect from our Lagos store",
    price: 0,
    freeOver: null,
    etaText: "Ready next business day",
  },
];
