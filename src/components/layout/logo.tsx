import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { BusinessSettings } from "@/lib/settings-schema";
import { cn } from "@/lib/cn";

/** Store logo: the uploaded image if set, otherwise a mark + the business name. */
export function Logo({
  business,
  inverted,
  className,
}: {
  business: BusinessSettings;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label={`${business.name} home`}
    >
      {business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo dimensions vary per client
        <img src={business.logoUrl} alt="" className="h-10 w-auto max-w-[180px] object-contain" />
      ) : (
        <>
          <span className="rounded-brand bg-primary text-primary-fg flex h-10 w-10 items-center justify-center">
            <ShoppingBag aria-hidden className="h-6 w-6" strokeWidth={2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span
              className={cn(
                "text-xl font-extrabold tracking-tight sm:text-2xl",
                inverted ? "text-white" : "text-text",
              )}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {business.logoText || business.name}
            </span>
            {business.tagline && (
              <span className={cn("hidden text-[11px] sm:block", inverted ? "text-white/70" : "text-muted")}>
                {business.tagline}
              </span>
            )}
          </span>
        </>
      )}
    </Link>
  );
}
