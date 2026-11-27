/**
 * Store settings schemas.
 *
 * These are the single definition of every configurable store setting. They are used to:
 *  - type the config files in src/config (the seed/default values),
 *  - validate values read from the `Setting` table at runtime,
 *  - validate admin edits in /admin/settings.
 *
 * Every field has a default, so a store with missing or partial settings still renders.
 */
import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #FFC400");
/** A same-site path ("/x", not "//host" or "/\host", which browsers treat as off-site) or an https URL. */
const urlOrPath = z.string().refine((v) => {
  if (/^\/(?![/\\])/.test(v)) return true;
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}, "Use a site path (/...) or an https:// URL");

export const businessSchema = z.object({
  name: z.string().min(1).default("My Store"),
  tagline: z.string().default(""),
  description: z.string().default(""),
  logoUrl: urlOrPath.optional(),
  /** Shown in place of an image logo when logoUrl is not set. */
  logoText: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  social: z
    .array(
      z.object({
        platform: z.enum(["facebook", "x", "instagram", "youtube", "linkedin", "tiktok", "whatsapp"]),
        url: z.url({ protocol: /^https$/ }),
      }),
    )
    .default([]),
});

export const brandingSchema = z.object({
  colors: z
    .object({
      primary: hexColor.default("#FFC400"),
      primaryForeground: hexColor.default("#17191C"),
      secondary: hexColor.default("#17191C"),
      secondaryForeground: hexColor.default("#FFFFFF"),
      background: hexColor.default("#FFFFFF"),
      surface: hexColor.default("#F3F4F6"),
      text: hexColor.default("#202124"),
      mutedText: hexColor.default("#6B7280"),
      border: hexColor.default("#E5E7EB"),
      success: hexColor.default("#15803D"),
      danger: hexColor.default("#DC2626"),
    })
    .prefault({}),
  fonts: z
    .object({
      /** Google Font family names, loaded in the root layout. */
      heading: z.string().default("Plus Jakarta Sans"),
      body: z.string().default("Inter"),
    })
    .prefault({}),
  /** Corner radius for cards, inputs and buttons. Keep small to match the reference design. */
  radius: z.enum(["none", "sm", "md", "lg"]).default("sm"),
  buttonStyle: z.enum(["solid", "outline"]).default("solid"),
  faviconUrl: urlOrPath.optional(),
});

export const commerceSchema = z.object({
  /** ISO 4217 code, e.g. NGN, USD, GBP. */
  currency: z.string().length(3).default("USD"),
  /** BCP 47 locale used for number/currency formatting, e.g. en-NG. */
  locale: z.string().default("en-US"),
  /** Number of minor units per major unit (100 for most currencies, 1 for JPY). */
  minorUnits: z.number().int().positive().default(100),
  /** Whether catalogue prices already include tax. */
  pricesIncludeTax: z.boolean().default(true),
  /** Tax rate applied at checkout when prices exclude tax, as a percentage. */
  taxRatePercent: z.number().min(0).max(100).default(0),
  /** Payment provider keys enabled for checkout. Keys must match a registered provider. */
  paymentMethods: z.array(z.string()).default(["mock"]),
  /** Prefix for human-facing order numbers. */
  orderNumberPrefix: z.string().max(6).default("ORD"),
  lowStockThreshold: z.number().int().min(0).default(5),
});

export const featuresSchema = z.object({
  wishlist: z.boolean().default(true),
  newsletter: z.boolean().default(true),
  promoBanners: z.boolean().default(true),
  customerAccounts: z.boolean().default(true),
  reviews: z.boolean().default(true),
  compare: z.boolean().default(false),
  guestCheckout: z.boolean().default(true),
});

/**
 * Link targets that admins can configure: a same-site path, or an https/mailto/tel URL.
 * Rejects javascript:, data:, protocol-relative ("//host") and other schemes.
 */
export const safeHref = z.string().refine((v) => {
  if (/^\/(?![/\\])/.test(v)) return true;
  try {
    return ["https:", "mailto:", "tel:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}, "Use a site path (/...) or an https://, mailto: or tel: link");

const navLink = z.object({ label: z.string(), href: safeHref, badge: z.string().optional() });

export const navigationSchema = z.object({
  main: z
    .array(
      navLink.extend({
        /** "categories" renders a dropdown from active catalogue categories. */
        dropdown: z.enum(["categories"]).optional(),
      }),
    )
    .default([
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "Categories", href: "/categories", dropdown: "categories" },
    ]),
  footer: z.array(z.object({ title: z.string(), links: z.array(navLink) })).default([]),
});

export const announcementSchema = z.object({
  enabled: z.boolean().default(false),
  items: z
    .array(
      z.object({ icon: z.enum(["truck", "shield", "headset", "tag", "info"]).optional(), text: z.string() }),
    )
    .default([]),
  links: z.array(navLink).default([]),
});

export const footerSchema = z.object({
  /** Payment marks shown in the footer, e.g. visa, mastercard, paypal, applepay, verve. */
  paymentMarks: z.array(z.string()).default([]),
  copyright: z.string().optional(),
});

export const settingsSchemas = {
  business: businessSchema,
  branding: brandingSchema,
  commerce: commerceSchema,
  features: featuresSchema,
  navigation: navigationSchema,
  announcement: announcementSchema,
  footer: footerSchema,
} as const;

export type SettingKey = keyof typeof settingsSchemas;
export type BusinessSettings = z.infer<typeof businessSchema>;
export type BrandingSettings = z.infer<typeof brandingSchema>;
export type CommerceSettings = z.infer<typeof commerceSchema>;
export type FeatureSettings = z.infer<typeof featuresSchema>;
export type NavigationSettings = z.infer<typeof navigationSchema>;
export type AnnouncementSettings = z.infer<typeof announcementSchema>;
export type FooterSettings = z.infer<typeof footerSchema>;

/** Input types: what a config file must provide (defaults fill the rest). */
export type SettingsInput = { [K in SettingKey]: z.input<(typeof settingsSchemas)[K]> };

// ─── Homepage blocks ────────────────────────────────────────────────────────

const cta = z.object({ label: z.string(), href: safeHref });

export const homepageBlockSchemas = {
  HERO: z.object({
    eyebrow: z.string().optional(),
    headline: z.string(),
    highlight: z.string().optional(),
    description: z.string().optional(),
    primaryCta: cta,
    secondaryCta: cta.optional(),
    slides: z.array(z.object({ imageUrl: urlOrPath, alt: z.string() })).min(1),
  }),
  CATEGORY_STRIP: z.object({
    title: z.string().default("Shop by Category"),
    /** Category slugs to show, in order. Empty = all active categories. */
    categorySlugs: z.array(z.string()).default([]),
    limit: z.number().int().positive().default(8),
  }),
  FEATURED_PRODUCTS: z.object({
    title: z.string().default("Featured Products"),
    /** "featured" = products flagged isFeatured; "slugs" = the listed products. */
    source: z.enum(["featured", "slugs", "newest", "bestsellers"]).default("featured"),
    productSlugs: z.array(z.string()).default([]),
    limit: z.number().int().positive().default(5),
    /** Optional promo card shown at the end of the row. */
    promo: z
      .object({
        eyebrow: z.string().optional(),
        title: z.string(),
        highlight: z.string().optional(),
        description: z.string().optional(),
        cta,
        imageUrl: urlOrPath.optional(),
      })
      .optional(),
  }),
  PROMO_BANNER: z.object({
    title: z.string(),
    description: z.string().optional(),
    cta: cta.optional(),
    imageUrl: urlOrPath.optional(),
    theme: z.enum(["primary", "secondary", "surface"]).default("secondary"),
  }),
  BENEFITS: z.object({
    items: z
      .array(
        z.object({
          icon: z.enum(["truck", "shield", "headset", "refresh", "tag", "gift"]),
          title: z.string(),
          description: z.string().optional(),
        }),
      )
      .min(1),
  }),
  NEWSLETTER: z.object({
    title: z.string().default("Subscribe to our Newsletter"),
    description: z.string().default("Get the latest deals and offers."),
  }),
} as const;

export type HomepageBlockKind = keyof typeof homepageBlockSchemas;
export type HomepageBlockInput = {
  [K in HomepageBlockKind]: {
    type: K;
    enabled?: boolean;
    content: z.input<(typeof homepageBlockSchemas)[K]>;
  };
}[HomepageBlockKind];
