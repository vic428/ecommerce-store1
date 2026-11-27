import type { ReactNode } from "react";
import { getActiveCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { StoreProvider } from "@/components/common/store-provider";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Storefront chrome (announcement bar, header, footer) shared by store pages and the 404 page. */
export async function StoreShell({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getActiveCategories()]);
  const { commerce, features } = settings;

  return (
    <StoreProvider
      value={{
        money: { currency: commerce.currency, locale: commerce.locale, minorUnits: commerce.minorUnits },
        features,
      }}
    >
      <a
        href="#main"
        className="bg-primary sr-only z-50 px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader settings={settings} categories={categories} />
      <main id="main" className="flex-1 pb-8">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </StoreProvider>
  );
}
