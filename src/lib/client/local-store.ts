"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny persisted store on top of localStorage, synced across components and browser tabs.
 * Storage failures (private mode, quota, blocked storage) degrade to in-memory state.
 */
export function createLocalStore<T>(key: string, initial: T, validate: (raw: unknown) => T | null) {
  let state: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = validate(JSON.parse(raw)) ?? initial;
    } catch {
      state = initial;
    }
  }

  function emit() {
    for (const l of listeners) l();
  }

  function set(updater: (prev: T) => T) {
    load();
    state = updater(state);
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore: state still updates in memory
    }
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      loaded = false;
      load();
      emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function getSnapshot() {
    load();
    return state;
  }

  function useStore() {
    // Server render and first client render both use `initial`, avoiding hydration mismatches.
    return useSyncExternalStore(subscribe, getSnapshot, () => initial);
  }

  return { set, get: getSnapshot, useStore };
}
