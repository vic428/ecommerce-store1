import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import { CacheTags } from "./cache-tags";
import {
  homepageBlockSchemas,
  settingsSchemas,
  type HomepageBlockKind,
  type SettingKey,
} from "./settings-schema";
import type { z } from "zod";

export type StoreSettings = { [K in SettingKey]: z.infer<(typeof settingsSchemas)[K]> };

/**
 * All store settings, read from the database and validated.
 *
 * Cached (tag: settings). Invalid or missing values fall back to schema defaults instead of
 * breaking the storefront; problems are logged server-side.
 */
export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(CacheTags.settings);
  cacheLife("minutes");

  const rows = await db.setting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const out = {} as Record<SettingKey, unknown>;
  for (const key of Object.keys(settingsSchemas) as SettingKey[]) {
    const schema = settingsSchemas[key];
    const parsed = schema.safeParse(byKey.get(key) ?? {});
    if (parsed.success) {
      out[key] = parsed.data;
    } else {
      console.error(`[settings] "${key}" is invalid; using defaults`, parsed.error.issues);
      out[key] = schema.parse({});
    }
  }
  return out as StoreSettings;
}

export type HomepageBlock = {
  [K in HomepageBlockKind]: { id: string; type: K; content: z.infer<(typeof homepageBlockSchemas)[K]> };
}[HomepageBlockKind];

/** Enabled homepage blocks in display order. Invalid blocks are skipped (and logged). Cached (tag: homepage). */
export async function getHomepageBlocks(): Promise<HomepageBlock[]> {
  "use cache";
  cacheTag(CacheTags.homepage);
  cacheLife("minutes");

  const rows = await db.homepageBlock.findMany({ where: { enabled: true }, orderBy: { position: "asc" } });
  const blocks: HomepageBlock[] = [];
  for (const row of rows) {
    const parsed = homepageBlockSchemas[row.type].safeParse(row.content);
    if (parsed.success) {
      blocks.push({ id: row.id, type: row.type, content: parsed.data } as HomepageBlock);
    } else {
      console.error(`[homepage] block ${row.id} (${row.type}) is invalid; skipped`, parsed.error.issues);
    }
  }
  return blocks;
}
