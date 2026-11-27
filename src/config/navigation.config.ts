/**
 * Header and footer navigation. Links that point at disabled features are hidden at render time.
 */
import type { SettingsInput } from "@/lib/settings-schema";

export const navigationConfig: SettingsInput["navigation"] = {
  main: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Categories", href: "/categories", dropdown: "categories" },
    { label: "Deals", href: "/shop?onSale=1", badge: "Hot" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footer: [
    {
      title: "Quick Links",
      links: [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { label: "FAQs", href: "/help" },
        { label: "Shipping Policy", href: "/policies/shipping" },
        { label: "Returns & Refunds", href: "/policies/returns" },
        { label: "Privacy Policy", href: "/policies/privacy" },
      ],
    },
  ],
};
