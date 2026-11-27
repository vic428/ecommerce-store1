/**
 * Brand theme. ⚠ DEMO CONTENT — the yellow/black palette is the demonstration theme carried over from the reference design (final branding pending).
 *
 * Colours become CSS variables in the root layout, so changing them here (or in
 * /admin/settings) re-themes the whole storefront without touching components.
 */
import type { SettingsInput } from "@/lib/settings-schema";

export const themeConfig: SettingsInput["branding"] = {
  colors: {
    primary: "#FFC400",
    primaryForeground: "#17191C",
    secondary: "#17191C",
    secondaryForeground: "#FFFFFF",
    background: "#FFFFFF",
    surface: "#F3F4F6",
    text: "#202124",
    mutedText: "#6B7280",
    border: "#E5E7EB",
    success: "#15803D",
    danger: "#DC2626",
  },
  fonts: {
    heading: "Plus Jakarta Sans",
    body: "Inter",
  },
  radius: "sm",
  buttonStyle: "solid",
};
