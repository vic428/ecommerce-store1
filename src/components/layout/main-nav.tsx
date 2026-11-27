"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavigationSettings } from "@/lib/settings-schema";

export type NavCategory = { slug: string; name: string };

function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  const path = href.split("?")[0];
  if (href.includes("?")) return false; // filtered links (e.g. Deals) aren't a "place"
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
}

type NavProps = { items: NavigationSettings["main"]; categories: NavCategory[] };

/** Desktop navigation, highlighting the current section. */
export function MainNav(props: NavProps) {
  return <NavList {...props} pathname={usePathname()} />;
}

/**
 * The navigation markup. Rendered with `pathname={null}` as the Suspense fallback while the
 * current path is unknown (e.g. prerendering dynamic routes). The categories dropdown opens on
 * hover and on keyboard focus.
 */
export function NavList({ items, categories, pathname }: NavProps & { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1 xl:gap-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-text hover:text-text/70 relative flex h-16 items-center gap-1 px-2 text-sm font-semibold",
                active && "after:bg-primary after:absolute after:inset-x-2 after:bottom-4 after:h-[3px]",
              )}
            >
              {item.label}
              {item.dropdown === "categories" && categories.length > 0 && (
                <ChevronDown aria-hidden className="h-4 w-4" />
              )}
              {item.badge && (
                <span className="rounded-brand bg-danger absolute top-3 -right-1 px-1 py-px text-[9px] leading-none font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );

          if (item.dropdown !== "categories" || categories.length === 0)
            return <li key={item.href}>{link}</li>;

          return (
            <li key={item.href} className="group relative">
              {link}
              <div className="border-border bg-background invisible absolute top-full left-0 z-40 w-60 border py-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul>
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/categories/${c.slug}`}
                        className="hover:bg-surface block px-4 py-2 text-sm"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
