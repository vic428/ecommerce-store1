import { test, expect } from "@playwright/test";

// Phase 0 smoke test: the app boots and serves the home page without horizontal overflow.
// Feature suites (storefront, cart, checkout, admin) are added in later phases.
test("home page loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
