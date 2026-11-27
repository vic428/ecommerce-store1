/**
 * ⚠ DEMO CONTENT — shared marketplace categories, controlled by VARCH (merchants can't create
 * top-level categories). Order here is the display order. `parentSlug` nests a category.
 */
import type { SeedCategory } from "./types";

export const categories: SeedCategory[] = [
  {
    slug: "electronics",
    name: "Electronics",
    icon: "smartphone",
    description: "Phones, audio and wearables",
  },
  { slug: "computers", name: "Computers", icon: "laptop", description: "Laptops and accessories" },
  { slug: "fashion", name: "Fashion", icon: "shirt", description: "Clothing, shoes and bags" },
  {
    slug: "bags-leather-goods",
    name: "Bags & Leather Goods",
    parentSlug: "fashion",
    description: "Handbags, totes and backpacks",
  },
  { slug: "home-living", name: "Home & Living", icon: "home", description: "Furniture, decor and kitchen" },
  { slug: "beauty", name: "Beauty & Personal Care", icon: "sparkles", description: "Skincare and grooming" },
  {
    slug: "sports-outdoors",
    name: "Sports & Outdoors",
    icon: "dumbbell",
    description: "Fitness and outdoor gear",
  },
  { slug: "toys-games", name: "Toys & Games", icon: "toy", description: "Play for all ages" },
];
