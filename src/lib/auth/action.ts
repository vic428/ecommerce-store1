import "server-only";
import { getPrincipal, type StaffPrincipal } from "./session";
import { can, ForbiddenError, isStaff, type Permission } from "./permissions";

/**
 * Authorise a server action. Server actions are public HTTP endpoints, so every one that reads
 * or changes protected data calls this first, whatever the UI shows or hides.
 * Throws ForbiddenError (caught by `actionError`) when the caller isn't allowed.
 */
export async function authorizeAction(...permissions: Permission[]): Promise<StaffPrincipal> {
  const principal = await getPrincipal();
  if (!principal || !isStaff(principal)) throw new ForbiddenError("Please sign in again.");
  for (const p of permissions) {
    if (!can(principal, p)) throw new ForbiddenError("You don't have permission to do that.");
  }
  return principal;
}

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of submitted values so forms keep what was typed after an error. */
  values?: Record<string, string>;
};

/** Turn an unexpected error into a safe message (details only in the server log). */
export function actionError(err: unknown, context: string): ActionState {
  if (err instanceof ForbiddenError) return { status: "error", message: err.message };
  console.error(`[${context}]`, err);
  return { status: "error", message: "Something went wrong. Nothing was changed. Please try again." };
}

/** FormData → plain string map (files ignored), for echoing values back into forms. */
export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}
