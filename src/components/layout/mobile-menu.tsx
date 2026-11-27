"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { NavigationSettings } from "@/lib/settings-schema";
import type { NavCategory } from "./main-nav";

export function MobileMenu({
  items,
  categories,
  storeName,
  showAccount,
}: {
  items: NavigationSettings["main"];
  categories: NavCategory[];
  storeName: string;
  showAccount: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="rounded-brand hover:bg-surface flex h-10 w-10 items-center justify-center lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={`${storeName} menu`}
            className="bg-background absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto shadow-xl"
          >
            <div className="border-border flex h-14 items-center justify-between border-b px-4">
              <span className="font-bold">{storeName}</span>
              <button
                ref={closeRef}
                type="button"
                className="rounded-brand hover:bg-surface flex h-10 w-10 items-center justify-center"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden className="h-6 w-6" />
              </button>
            </div>
            {/* Close the menu when any link inside is followed. */}
            <nav
              aria-label="Mobile"
              className="flex-1 p-2"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <ul>
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-brand hover:bg-surface flex items-center justify-between px-3 py-3 font-semibold"
                    >
                      {item.label}
                      {item.badge && (
                        <span className="rounded-brand bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                    {item.dropdown === "categories" && categories.length > 0 && (
                      <ul className="border-border mb-2 ml-3 border-l pl-2">
                        {categories.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/categories/${c.slug}`}
                              className="rounded-brand text-muted hover:bg-surface hover:text-text block px-3 py-2 text-sm"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {showAccount && (
                  <li className="border-border mt-2 border-t pt-2">
                    <Link
                      href="/account"
                      className="rounded-brand hover:bg-surface block px-3 py-3 font-semibold"
                    >
                      My account
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
