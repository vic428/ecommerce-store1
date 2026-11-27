import { StoreShell } from "@/components/layout/store-shell";

/** Storefront layout. The admin area (Phase 4) has its own layout outside this route group. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreShell>{children}</StoreShell>;
}
