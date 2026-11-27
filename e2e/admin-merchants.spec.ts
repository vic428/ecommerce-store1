import { test, expect, type Page } from "@playwright/test";
import { formMessage, haveTestAccounts, signInAsAdmin } from "./helpers";

/**
 * Merchant management as a super admin, against the dev/test Supabase project.
 * Creates uniquely named "E2E Merchant …" records (merchants are never deleted by design; the
 * test terminates the one it creates). Needs `npm run e2e:accounts`.
 */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "admin flows run once, in the desktop project");
test.skip(!haveTestAccounts, "run `npm run e2e:accounts` to create the test accounts");
test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

async function setStatus(page: Page, status: string, confirm: boolean) {
  await page.getByLabel("Change status to").selectOption({ label: status });
  if (confirm)
    await page.getByRole("checkbox", { name: /Hide this merchant|Terminate this merchant/ }).check();
  await page.getByRole("button", { name: "Update status" }).click();
}

test("lists the demo merchants and filters by status", async ({ page }) => {
  await signInAsAdmin(page);
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Merchants" }).click();
  await expect(page.getByRole("heading", { name: "Merchants", level: 1 })).toBeVisible();
  const table = page.getByTestId("merchants-table");
  await expect(table.getByRole("link", { name: "Eka's Leather Collection" })).toBeVisible();
  await expect(table.getByRole("row").filter({ hasText: "Novatek Electronics" })).toContainText("12%");
  await expect(table.getByRole("row").filter({ hasText: "Stride Apparel" })).toContainText(
    "Marketplace default",
  );

  await page.getByLabel("Status", { exact: true }).selectOption("SUSPENDED");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/status=SUSPENDED/);
  await expect(table.getByRole("link", { name: "Little Stars Toys" })).toBeVisible();
  await expect(table.getByRole("link", { name: "Novatek Electronics" })).toHaveCount(0);

  await page.getByLabel("Search merchants").fill("leather");
  await page.getByLabel("Status", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(table.getByRole("row")).toHaveCount(2); // header + Eka's
});

test("creates and edits a merchant, adds a contact and an agreement, then terminates it", async ({
  page,
}) => {
  const name = `E2E Merchant ${Date.now()}`;
  await signInAsAdmin(page);
  await page.goto("/admin/merchants/new");

  // Server-side validation keeps typed values.
  await page.getByLabel("Business name").fill(name);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Create merchant" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel("Business name")).toHaveValue(name);

  await page.getByLabel("Email").fill("e2e-merchant@example.com");
  await page.getByLabel("City").fill("Lagos");
  await page.getByRole("button", { name: "Create merchant" }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Merchant created.")).toBeVisible();

  // Edit details
  await page.getByLabel("City").fill("Abuja");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(formMessage(page).first()).toHaveText("Merchant details saved.", { timeout: 20_000 });

  // Contact
  await page.getByRole("button", { name: "Add contact" }).click();
  const contactForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Add contact" }) });
  await contactForm.getByLabel("Name").fill("Ada E2E");
  await contactForm.getByLabel("Phone").fill("+234 800 000 0001");
  await contactForm.getByRole("button", { name: "Add contact" }).click();
  await expect(page.locator("#contacts")).toContainText("Ada E2E", { timeout: 20_000 });

  // Agreement: invalid rate rejected, then 12.5% activated
  await page.getByRole("button", { name: "New agreement" }).click();
  const agreementForm = page.getByTestId("new-agreement-form");
  await agreementForm.getByLabel("Rate (%)").fill("150");
  await agreementForm.getByRole("button", { name: "Save agreement" }).click();
  await expect(agreementForm.getByText("Enter a rate from 0 to 100, up to 2 decimals.")).toBeVisible({
    timeout: 20_000,
  });
  await agreementForm.getByLabel("Rate (%)").fill("12.5");
  await agreementForm.getByRole("checkbox", { name: /Activate now/ }).check();
  await agreementForm.getByRole("button", { name: "Save agreement" }).click();
  const agreements = page.getByTestId("agreements-table");
  await expect(agreements.getByRole("row").filter({ hasText: "12.5%" })).toContainText("In force", {
    timeout: 20_000,
  });

  // Status: LEAD → ACTIVE (no confirmation), ACTIVE → SUSPENDED needs confirmation
  await setStatus(page, "Active", false);
  await expect(formMessage(page).filter({ hasText: "Status changed to active." })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByLabel("Change status to").selectOption({ label: "Suspended" });
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(formMessage(page).filter({ hasText: "Please confirm this change." })).toBeVisible({
    timeout: 20_000,
  });

  // Terminate (final) and check the activity log recorded the changes.
  await setStatus(page, "Terminated", true);
  await expect(page.getByText(/This merchant is terminated/)).toBeVisible({ timeout: 20_000 });
  const activity = page.getByTestId("merchant-activity");
  await expect(activity).toContainText("status changed");
  await expect(activity).toContainText("created active");
  await expect(activity).toContainText("contact added");
});

test("suspending a merchant hides their products from the storefront immediately", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/admin/merchants?q=Eka");
  await page.getByRole("link", { name: "Eka's Leather Collection" }).click();
  await expect(page.getByRole("heading", { name: "Eka's Leather Collection", level: 1 })).toBeVisible();

  try {
    await setStatus(page, "Suspended", true);
    await expect(formMessage(page).filter({ hasText: "Status changed to suspended." })).toBeVisible({
      timeout: 20_000,
    });

    const shop = await page.context().newPage();
    await shop.goto("/");
    await expect(shop.getByTestId("product-card").first()).toBeVisible({ timeout: 30_000 });
    await expect(shop.getByTestId("product-card").filter({ hasText: "Modern Laptop Backpack" })).toHaveCount(
      0,
    );
    await shop.close();
  } finally {
    // Restore the demo data for other tests.
    await page.getByLabel("Change status to").selectOption({ label: "Active" });
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(formMessage(page).filter({ hasText: "Status changed to active." })).toBeVisible({
      timeout: 20_000,
    });
  }

  const shop = await page.context().newPage();
  await shop.goto("/");
  await expect(shop.getByTestId("product-card").filter({ hasText: "Modern Laptop Backpack" })).toHaveCount(
    1,
    {
      timeout: 30_000,
    },
  );
});
