"use client";

import Link from "next/link";
import { useActionState, useId, type ReactNode } from "react";
import { requestPasswordEmail, setOwnPassword, signInStaff, type FormState } from "@/actions/admin-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const idle: FormState = { status: "idle" };

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  );
}

function FormMessage({ state, id }: { state: FormState; id: string }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      id={id}
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error"
          ? "rounded-brand border-danger/30 bg-danger/5 text-danger border px-3 py-2 text-sm"
          : "rounded-brand border-success/30 bg-success/5 text-success border px-3 py-2 text-sm"
      }
    >
      {state.message}
    </p>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signInStaff, idle);
  const id = useId();
  return (
    <form action={action} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold">Sign in to the admin</h1>
      {notice && state.status === "idle" && (
        <p role="status" className="rounded-brand bg-surface text-text px-3 py-2 text-sm">
          {notice}
        </p>
      )}
      <FormMessage state={state} id={`${id}-msg`} />
      <Field label="Email" id={`${id}-email`}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
        />
      </Field>
      <Field label="Password" id={`${id}-password`}>
        <Input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/forgot-password" className="font-semibold underline-offset-2 hover:underline">
          Set or reset password
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordEmail, idle);
  const id = useId();
  return (
    <form action={action} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold">Set or reset your password</h1>
      <p className="text-muted text-sm">
        Enter your staff email address. We&apos;ll email you a link to choose a new password.
      </p>
      <FormMessage state={state} id={`${id}-msg`} />
      {state.status !== "success" && (
        <>
          <Field label="Email" id={`${id}-email`}>
            <Input id={`${id}-email`} name="email" type="email" autoComplete="username" required />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Email me a link"}
          </Button>
        </>
      )}
      <p className="text-center text-sm">
        <Link href="/admin/login" className="font-semibold underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function SetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(setOwnPassword, idle);
  const id = useId();
  return (
    <form action={action} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold">Choose a new password</h1>
      <p className="text-muted text-sm">
        For <span className="text-text font-semibold">{email}</span>
      </p>
      <FormMessage state={state} id={`${id}-msg`} />
      {/* Lets password managers associate the new password with the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field label="New password" id={`${id}-pw`} hint="At least 12 characters, with a letter and a number.">
        <Input
          id={`${id}-pw`}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
        />
      </Field>
      <Field label="Confirm new password" id={`${id}-confirm`}>
        <Input id={`${id}-confirm`} name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
