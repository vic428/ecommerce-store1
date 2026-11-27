"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Current year, read in the browser only, so prerendered/cached HTML never bakes in a stale value.
 * Renders nothing on the server.
 */
export function CurrentYear() {
  const year = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <>{year}</>;
}
