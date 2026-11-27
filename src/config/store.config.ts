/**
 * Store identity and commerce settings.
 *
 * ⚠ DEMO CONTENT — "ShopEase" is the demonstration store. Replace every value in this file
 * when onboarding a client (see docs/ONBOARDING.md).
 *
 * These values seed the database (`npm run db:seed`). Once a store is live, its staff edit
 * them in /admin/settings and the database copy wins.
 */
import type { SettingsInput } from "@/lib/settings-schema";

export const businessConfig: SettingsInput["business"] = {
  name: "ShopEase",
  tagline: "Shop Smarter. Live Better.",
  description:
    "ShopEase brings you quality products across electronics, fashion, home and more — at prices that make sense.",
  logoText: "ShopEase",
  email: "support@shopease.example",
  phone: "+234 800 000 0000",
  address: "12 Demo Street, Lagos, Nigeria",
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
  orderNumberPrefix: "SE",
  lowStockThreshold: 5,
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

/** Delivery options offered at checkout. Prices are in minor units (kobo). */
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
