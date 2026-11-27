import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{title}</h1>
          {description && <p className="text-muted text-sm">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  id,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="border-border bg-background rounded-brand border"
    >
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="text-sm font-bold">
            {title}
          </h2>
          {description && <p className="text-muted text-xs">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const tones = {
  green: "bg-success/10 text-success",
  amber: "bg-amber-500/15 text-amber-800",
  red: "bg-danger/10 text-danger",
  blue: "bg-sky-500/10 text-sky-800",
  grey: "bg-surface text-muted",
} as const;
export type Tone = keyof typeof tones;

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-brand inline-flex items-center px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={`f-${name}`} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`f-${name}-error`} className="text-danger text-xs">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted text-xs">{hint}</p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-brand border border-border bg-background px-3 text-sm text-text focus:border-secondary focus:outline-none aria-invalid:border-danger disabled:bg-surface disabled:text-muted";

export function TextInput({
  name,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { name: string; error?: string }) {
  return (
    <input
      id={`f-${name}`}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `f-${name}-error` : undefined}
      className={cn(control, "h-10", className)}
      {...props}
    />
  );
}

export function TextArea({
  name,
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & { name: string; error?: string }) {
  return (
    <textarea
      id={`f-${name}`}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `f-${name}-error` : undefined}
      className={cn(control, "min-h-24 py-2", className)}
      {...props}
    />
  );
}

export function Select({
  name,
  error,
  options,
  className,
  ...props
}: ComponentProps<"select"> & { name: string; error?: string; options: { value: string; label: string }[] }) {
  return (
    <select
      id={`f-${name}`}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `f-${name}-error` : undefined}
      className={cn(control, "h-10", className)}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="text-muted mt-1 text-sm">{children}</div>}
    </div>
  );
}
