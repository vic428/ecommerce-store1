import type { BrandingSettings } from "./settings-schema";

const radius = { none: "0px", sm: "4px", md: "8px", lg: "12px" } as const;

/** Allow only characters that can appear in a Google Fonts family name. */
function safeFontName(name: string) {
  return name.replace(/[^a-zA-Z0-9 \-]/g, "").trim();
}

/**
 * Turns branding settings into CSS custom properties on :root. Components only ever use these
 * variables (via Tailwind colour names like `bg-primary`), so re-theming needs no code changes.
 * Values are already validated (hex colours, enum radius, sanitised font names), so the output is
 * safe to inline in a <style> tag.
 */
export function brandingToCss(b: BrandingSettings) {
  const c = b.colors;
  const heading = safeFontName(b.fonts.heading);
  const body = safeFontName(b.fonts.body);
  return `:root{
--brand-primary:${c.primary};--brand-primary-fg:${c.primaryForeground};
--brand-secondary:${c.secondary};--brand-secondary-fg:${c.secondaryForeground};
--brand-background:${c.background};--brand-surface:${c.surface};
--brand-text:${c.text};--brand-muted:${c.mutedText};--brand-border:${c.border};
--brand-success:${c.success};--brand-danger:${c.danger};
--brand-radius:${radius[b.radius]};
--brand-font-heading:"${heading}",ui-sans-serif,system-ui,sans-serif;
--brand-font-body:"${body}",ui-sans-serif,system-ui,sans-serif;
}`;
}

/** Google Fonts stylesheet URL for the configured heading/body fonts. */
export function googleFontsHref(b: BrandingSettings) {
  const families = [...new Set([b.fonts.heading, b.fonts.body].map(safeFontName).filter(Boolean))];
  if (!families.length) return null;
  const params = families.map(
    (f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700;800`,
  );
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}
