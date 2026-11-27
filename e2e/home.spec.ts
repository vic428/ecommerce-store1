import { test, expect, type Page } from "@playwright/test";

/**
 * Homepage and storefront shell. Runs at desktop, tablet and mobile sizes (see playwright.config.ts).
 * Expects the demo seed (npm run db:seed) in the database DATABASE_URL points at.
 */

/** Wait until React has hydrated the storefront (cart/wishlist counts, menus are interactive). */
async function waitForHydration(page: Page) {
  await page.locator("[data-store-hydrated]").waitFor({ state: "attached" });
}

async function gotoHome(page: Page) {
  await page.goto("/");
  await waitForHydration(page);
}

test.describe("homepage", () => {
  test("renders store branding from settings", async ({ page }) => {
    await gotoHome(page);
    await expect(page).toHaveTitle(/ShopEase/);
    await expect(page.getByRole("link", { name: "ShopEase home" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Premium Quality");
    await expect(page.locator("footer")).toContainText("ShopEase. All rights reserved.");
  });

  test("applies the theme colours as CSS variables", async ({ page }) => {
    await gotoHome(page);
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim().toLowerCase(),
    );
    expect(primary).toBe("#ffc400");
  });

  test("shows featured products with prices in the store currency", async ({ page }) => {
    await gotoHome(page);
    const cards = page.getByTestId("product-card");
    await expect(cards).toHaveCount(5);
    await expect(cards.first().getByTestId("product-price")).toContainText("₦");
  });

  test("category links come from the catalogue", async ({ page }) => {
    await gotoHome(page);
    const section = page.locator("section", { has: page.locator("#shop-by-category") });
    const links = section.getByRole("link");
    await expect(links).toHaveCount(7);
    await expect(section.getByRole("link", { name: "Electronics" })).toHaveAttribute(
      "href",
      "/categories/electronics",
    );
  });

  test("has no horizontal overflow", async ({ page }) => {
    await gotoHome(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("search submits to the shop page", async ({ page }) => {
    await gotoHome(page);
    const search = page.getByRole("searchbox", { name: "Search products" }).locator("visible=true");
    await search.fill("watch");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=watch$/);
  });

  test("unknown pages show the branded 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ShopEase home" }).first()).toBeVisible();
  });
});

test.describe("cart and wishlist", () => {
  test("add to cart updates the header count and survives a reload", async ({ page }) => {
    await gotoHome(page);
    const card = page.getByTestId("product-card").filter({ hasText: "Modern Laptop Backpack" });
    await card.getByRole("button", { name: "Add to Cart" }).click();
    await card.getByRole("button", { name: /Add to Cart|Added/ }).click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.reload();
    await waitForHydration(page);
    await expect(page.getByTestId("cart-count")).toHaveText("2");
  });

  test("multi-variant products ask for options instead of adding", async ({ page }) => {
    await gotoHome(page);
    const card = page.getByTestId("product-card").filter({ hasText: "Running Shoes" });
    await expect(card.getByRole("link", { name: "Choose Options" })).toHaveAttribute(
      "href",
      "/product/running-shoes",
    );
  });

  test("wishlist toggles on and off", async ({ page }) => {
    await gotoHome(page);
    const heart = page.getByRole("button", { name: /Add UltraBook Laptop 14" to wishlist/ });
    await heart.click();
    await expect(page.getByTestId("wishlist-count")).toHaveText("1");
    await page.getByRole("button", { name: /Remove UltraBook Laptop 14" from wishlist/ }).click();
    await expect(page.getByTestId("wishlist-count")).toHaveCount(0);
  });
});

test.describe("newsletter", () => {
  test("rejects an invalid email and keeps what was typed", async ({ page }) => {
    await gotoHome(page);
    const form = page.getByTestId("newsletter");
    const email = form.getByRole("textbox", { name: "Email address" });
    await email.fill("not-an-email");
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("alert")).toHaveText("Please enter a valid email address.");
    await expect(email).toHaveValue("not-an-email");
  });

  test("accepts a valid email", async ({ page }, testInfo) => {
    await gotoHome(page);
    const form = page.getByTestId("newsletter");
    await form
      .getByRole("textbox", { name: "Email address" })
      .fill(`e2e+${testInfo.project.name}-${Date.now()}@example.com`);
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("status")).toContainText("Thanks for subscribing");
  });
});

test.describe("mobile navigation", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, "desktop shows the full nav");

  test("menu opens, lists categories and closes with Escape", async ({ page }) => {
    await gotoHome(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Fashion" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("desktop navigation", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "mobile uses the menu");

  test("marks Home as the current page", async ({ page }) => {
    await gotoHome(page);
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
