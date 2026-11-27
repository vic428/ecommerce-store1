import type { StoreSettings } from "@/lib/settings";
import type { CategorySummary } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderActions } from "./header-actions";
import { Logo } from "./logo";
import { Suspense } from "react";
import { MainNav, NavList } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { SearchForm } from "./search-form";

/** Nav links that belong to a feature are hidden when that feature is off. */
function visibleNav(settings: StoreSettings) {
  const { features } = settings;
  return settings.navigation.main.filter((item) => {
    if (item.href.startsWith("/wishlist")) return features.wishlist;
    if (item.href.startsWith("/account")) return features.customerAccounts;
    return true;
  });
}

export function SiteHeader({
  settings,
  categories,
}: {
  settings: StoreSettings;
  categories: CategorySummary[];
}) {
  const nav = visibleNav(settings);
  const navCategories = categories.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <header className="bg-background sticky top-0 z-40">
      <AnnouncementBar
        announcement={settings.announcement}
        showAccountLinks={settings.features.customerAccounts}
      />
      <div className="border-border border-b">
        <Container className="flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
          <MobileMenu
            items={nav}
            categories={navCategories}
            storeName={settings.business.name}
            showAccount={settings.features.customerAccounts}
          />
          <Logo business={settings.business} />
          <div className="flex flex-1 justify-center">
            <Suspense fallback={<NavList items={nav} categories={navCategories} pathname={null} />}>
              <MainNav items={nav} categories={navCategories} />
            </Suspense>
          </div>
          <SearchForm className="hidden max-w-xs md:flex xl:max-w-sm" id="site-search-desktop" />
          <HeaderActions />
        </Container>
        <Container className="pb-3 md:hidden">
          <SearchForm id="site-search-mobile" />
        </Container>
      </div>
    </header>
  );
}
