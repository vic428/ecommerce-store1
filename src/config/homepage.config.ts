/**
 * Homepage sections, rendered top to bottom in this order.
 * ⚠ DEMO CONTENT — replace copy and images when onboarding a client.
 * After launch, staff manage these in /admin/settings → Homepage.
 */
import type { HomepageBlockInput } from "@/lib/settings-schema";

export const homepageConfig: HomepageBlockInput[] = [
  {
    type: "HERO",
    content: {
      eyebrow: "Welcome to VARCH Marketplace",
      headline: "Premium Quality",
      highlight: "Great Prices",
      description:
        "Discover top-quality products with unbeatable prices and enjoy a seamless shopping experience.",
      primaryCta: { label: "Shop Now", href: "/shop" },
      slides: [
        { imageUrl: "/demo/hero/hero-1.jpg", alt: "Headphones, smartwatch, leather bag and white sneakers" },
      ],
    },
  },
  {
    type: "CATEGORY_STRIP",
    content: { title: "Shop by Category", limit: 8 },
  },
  {
    type: "FEATURED_PRODUCTS",
    content: {
      title: "Featured Products",
      source: "featured",
      limit: 5,
      promo: {
        eyebrow: "Special Offer",
        title: "Up to",
        highlight: "50% OFF",
        description: "on selected items",
        cta: { label: "Shop the Deal", href: "/shop?onSale=1" },
      },
    },
  },
  {
    type: "BENEFITS",
    content: {
      items: [
        { icon: "truck", title: "Free Shipping", description: "On orders over ₦50,000" },
        { icon: "shield", title: "Secure Payment", description: "100% secure checkout" },
        { icon: "headset", title: "24/7 Support", description: "We're here to help" },
        { icon: "refresh", title: "Easy Returns", description: "7-day return policy" },
      ],
    },
  },
  {
    type: "NEWSLETTER",
    content: {
      title: "Subscribe to our Newsletter",
      description: "Get the latest deals and offers.",
    },
  },
];
