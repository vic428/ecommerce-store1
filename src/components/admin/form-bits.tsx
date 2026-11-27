"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/auth/action";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      data-testid="form-message"
      className={cn(
        "rounded-brand border px-3 py-2 text-sm",
        state.status === "error"
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-success/30 bg-success/5 text-success",
      )}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses({ variant, className })}>
      {pending ? pendingText : children}
    </button>
  );
}

/**
 * A button that asks for confirmation in a modal dialog before running `action`.
 * Used for destructive or listing-hiding changes. The server re-checks permissions regardless.
 */
export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel,
  action,
  danger = true,
  className,
}: {
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  action: () => Promise<ActionState>;
  danger?: boolean;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setResult(null);
          dialogRef.current?.showModal();
        }}
        className={cn(
          buttonClasses({ variant: "outline", size: "sm" }),
          danger && "text-danger hover:border-danger",
          className,
        )}
      >
        {label}
      </button>
      {result?.status === "error" && (
        <span role="alert" className="text-danger text-xs">
          {result.message}
        </span>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        className="rounded-brand border-border bg-background m-auto w-[min(92vw,28rem)] border p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="space-y-3 p-5">
          <h2 id="confirm-title" className="text-lg font-bold">
            {title}
          </h2>
          <div className="text-muted text-sm">{body}</div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={buttonClasses({ variant: "outline" })}
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className={cn(
                buttonClasses({ variant: danger ? "secondary" : "primary" }),
                danger && "bg-danger text-white",
              )}
              onClick={() =>
                start(async () => {
                  const r = await action();
                  setResult(r);
                  dialogRef.current?.close();
                })
              }
            >
              {pending ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Shows a success message from a `?created=1` style redirect once. */
export function FlashMessage({ message }: { message: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 6000);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <p
      role="status"
      className="rounded-brand border-success/30 bg-success/5 text-success mb-4 border px-3 py-2 text-sm"
    >
      {message}
    </p>
  );
}
