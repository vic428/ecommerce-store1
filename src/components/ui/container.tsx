import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>
  );
}

/** Section heading with the short underline accent from the reference design. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-text relative pb-2 text-xl font-bold sm:text-2xl">
        {children}
        <span aria-hidden className="bg-primary absolute bottom-0 left-0 h-[3px] w-12" />
      </h2>
      {action}
    </div>
  );
}
