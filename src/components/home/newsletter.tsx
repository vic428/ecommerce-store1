"use client";

import { useActionState, useId } from "react";
import { Mail } from "lucide-react";
import { subscribeToNewsletter, type NewsletterState } from "@/actions/newsletter";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

export function Newsletter({ title, description }: { title: string; description: string }) {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, {
    status: "idle",
  });
  const inputId = useId();
  const msgId = useId();

  return (
    <section aria-labelledby={`${inputId}-title`} className="py-6 sm:py-8" data-testid="newsletter">
      <Container>
        <div className="rounded-brand border-border bg-surface flex flex-col gap-5 border p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Mail aria-hidden className="h-9 w-9 shrink-0" strokeWidth={1.25} />
            <div>
              <h2 id={`${inputId}-title`} className="text-base font-bold">
                {title}
              </h2>
              <p className="text-muted text-sm">{description}</p>
            </div>
          </div>

          {state.status === "success" ? (
            <p role="status" className="text-success text-sm font-semibold lg:w-[460px]">
              {state.message}
            </p>
          ) : (
            <form action={action} noValidate className="w-full lg:w-[460px]">
              <div className="flex h-11">
                <label htmlFor={inputId} className="sr-only">
                  Email address
                </label>
                <input
                  id={inputId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={state.email}
                  placeholder="Enter your email address"
                  aria-invalid={state.status === "error" || undefined}
                  aria-describedby={state.status === "error" ? msgId : undefined}
                  className={cn(
                    "border-border bg-background focus:border-secondary h-full min-w-0 flex-1 rounded-l-full border border-r-0 px-4 text-sm focus:outline-none",
                    state.status === "error" && "border-danger",
                  )}
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-primary text-primary-fg h-full shrink-0 rounded-r-full px-6 text-sm font-bold hover:brightness-95 disabled:opacity-60"
                >
                  {pending ? "Subscribing…" : "Subscribe"}
                </button>
              </div>
              {state.status === "error" && (
                <p id={msgId} role="alert" className="text-danger mt-2 text-sm">
                  {state.message}
                </p>
              )}
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
