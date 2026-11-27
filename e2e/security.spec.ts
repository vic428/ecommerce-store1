import "dotenv/config";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { merchants } from "../src/data/merchants";
import { products } from "../src/data/products";

/**
 * Storefront security checks. They run once (desktop project). The database-level RLS check is
 * a separate script (`npm run db:check-rls`) so tests never open extra DB connections next to
 * the app server.
 */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "runs once, in the desktop project");

test("products of non-active merchants and unpublished products are not listed", async ({ page }) => {
  const sellingMerchants = new Set(merchants.filter((m) => m.status === "ACTIVE").map((m) => m.slug));
  const hidden = products.filter(
    (p) =>
      !sellingMerchants.has(p.merchantSlug) ||
      !["PUBLISHED", "OUT_OF_STOCK"].includes(p.status ?? "PUBLISHED"),
  );
  // The demo seed deliberately includes a suspended merchant, an archived and a pending product.
  expect(hidden.length).toBeGreaterThanOrEqual(3);

  await page.goto("/");
  const cardText = (await page.getByTestId("product-card").allInnerTexts()).join("\n");
  expect(cardText.length).toBeGreaterThan(0);
  for (const p of hidden) expect(cardText).not.toContain(p.name);
});

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

test("client bundles contain no server secrets", async () => {
  const staticDir = path.join(process.cwd(), ".next", "static");
  const files = listFiles(staticDir).filter((f) => /\.(js|css|json|html|txt)$/.test(f));
  expect(files.length).toBeGreaterThan(0);

  const secrets = [
    process.env.DATABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.PAYMENT_SECRET_KEY,
    process.env.PAYMENT_WEBHOOK_SECRET,
    process.env.AUTH_SECRET,
  ].filter((v): v is string => !!v && v.length >= 8);
  const markers = ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PAYMENT_SECRET_KEY", "service_role"];

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const s of secrets) expect(content.includes(s), `${file} contains a secret value`).toBe(false);
    for (const m of markers) expect(content.includes(m), `${file} references ${m}`).toBe(false);
  }
});
