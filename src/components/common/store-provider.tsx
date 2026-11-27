"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { formatMoney } from "@/lib/currency";
import type { CommerceSettings, FeatureSettings } from "@/lib/settings-schema";

/** The subset of settings client components need. Never put secrets here: it is sent to the browser. */
export type ClientStoreConfig = {
  money: Pick<CommerceSettings, "currency" | "locale" | "minorUnits">;
  features: FeatureSettings;
};

const StoreContext = createContext<ClientStoreConfig | null>(null);

const noopSubscribe = () => () => {};

export function StoreProvider({ value, children }: { value: ClientStoreConfig; children: ReactNode }) {
  // True only after hydration. Exposed as a DOM marker so end-to-end tests can wait until the
  // storefront's interactive parts (cart, wishlist, menus) are ready.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return (
    <StoreContext.Provider value={value}>
      {children}
      {hydrated && <span data-store-hydrated hidden />}
    </StoreContext.Provider>
  );
}

export function useStoreConfig() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreConfig must be used inside <StoreProvider>");
  return ctx;
}

export function useMoney() {
  const { money } = useStoreConfig();
  return (amountMinor: number) => formatMoney(amountMinor, money);
}
