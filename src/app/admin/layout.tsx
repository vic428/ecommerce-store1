import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

/** The admin area sits outside the storefront route group, so it gets no store header/footer. */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
