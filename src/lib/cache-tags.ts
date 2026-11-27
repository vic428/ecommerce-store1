/**
 * Cache tags for storefront data. Reads are cached with `"use cache"` + these tags; any write
 * (admin actions, checkout stock changes) must call `updateTag()` / `revalidateTag()` with the
 * matching tag so the storefront updates immediately.
 *
 * Cached entries also expire on their own after a few minutes (cacheLife "minutes"), so changes
 * made outside the app (e.g. re-running the seed) show up without a redeploy.
 */
export const CacheTags = {
  settings: "settings",
  homepage: "homepage",
  catalog: "catalog",
} as const;
