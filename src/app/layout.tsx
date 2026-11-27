import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { brandingToCss, googleFontsHref } from "@/lib/theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { business, branding } = await getSettings();
  const title = business.tagline ? `${business.name} — ${business.tagline}` : business.name;
  return {
    title: { default: title, template: `%s | ${business.name}` },
    description: business.description || undefined,
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    icons: branding.faviconUrl ? { icon: branding.faviconUrl } : undefined,
    openGraph: { siteName: business.name, type: "website" },
  };
}

/**
 * Root layout shared by the storefront and (later) the admin dashboard.
 * It only applies the store theme; each area adds its own chrome in a route-group layout.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { branding, commerce } = await getSettings();
  const fontsHref = googleFontsHref(branding);
  const lang = commerce.locale.split("-")[0] || "en";

  return (
    <html lang={lang} className="h-full antialiased">
      <head>
        {fontsHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={fontsHref} />
          </>
        )}
        <style id="brand-theme">{brandingToCss(branding)}</style>
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
