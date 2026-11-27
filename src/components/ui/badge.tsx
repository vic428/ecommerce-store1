import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "primary" | "secondary" | "danger" | "success" | "muted";

const tones: Record<Tone, string> = {
  primary: "bg-primary text-primary-fg",
  secondary: "bg-secondary text-secondary-fg",
  danger: "bg-danger text-white",
  success: "bg-success text-white",
  muted: "bg-surface text-muted",
};

export function Badge({
  tone = "primary",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-brand inline-flex items-center px-1.5 py-0.5 text-[11px] leading-none font-bold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
