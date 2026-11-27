import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "rounded-brand border-border bg-background text-text placeholder:text-muted h-10 w-full border px-3 text-sm",
        "focus:border-secondary aria-invalid:border-danger focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
