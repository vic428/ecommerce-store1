import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/** Plain GET form to /shop?q=…, so search works without JavaScript. */
export function SearchForm({ className, id = "site-search" }: { className?: string; id?: string }) {
  return (
    <form action="/shop" method="get" role="search" className={cn("flex h-10 w-full", className)}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search for products..."
        maxLength={100}
        className="rounded-l-brand border-border bg-background placeholder:text-muted focus:border-secondary h-full min-w-0 flex-1 border border-r-0 px-3 text-sm focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="rounded-r-brand bg-primary text-primary-fg flex h-full w-12 shrink-0 items-center justify-center hover:brightness-95"
      >
        <Search aria-hidden className="h-5 w-5" strokeWidth={2} />
      </button>
    </form>
  );
}
