import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";

/**
 * Admin authentication and access control, against the dev/test Supabase project.
 * Signed-in tests need the test accounts: run `npm run e2e:accounts` once (creates them and
 * stores generated credentials in .env). They are skipped when the variables are missing.
 */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "auth flows run once, in the desktop project");

const admin = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const customer = { email: process.env.E2E_CUSTOMER_EMAIL, password: process.env.E2E_CUSTOMER_PASSWORD };
const haveAccounts = !!(admin.email && admin.password && customer.email && customer.password);

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("admin access without signing in", () => {
  test("the dashboard redirects to sign-in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to the admin" })).toBeVisible();
  });

  test("wrong credentials are rejected without revealing whether the account exists", async ({ page }) => {
    await signIn(page, "nobody@example.com", "not-the-password-123");
    // Scope to the form: Next.js renders its own hidden role="alert" route announcer.
    await expect(page.locator("form").getByRole("alert")).toHaveText("Incorrect email or password.", {
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("password emails get the same reply for unknown addresses", async ({ page }) => {
    await page.goto("/admin/forgot-password");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByRole("button", { name: "Email me a link" }).click();
    await expect(page.locator("form").getByRole("status")).toContainText(
      "If that email belongs to a staff account",
      {
        timeout: 20_000,
      },
    );
  });

  test("the set-password page needs a valid session", async ({ page }) => {
    await page.goto("/admin/set-password");
    await expect(page).toHaveURL(/\/admin\/login\?error=link$/);
  });

  test("auth callback rejects a bad code and never redirects off-site", async ({ page }) => {
    await page.goto("/admin/auth/callback?code=invalid&next=https://evil.example/");
    await expect(page).toHaveURL(/\/admin\/login\?error=link$/);
  });
});

test.describe("signed-in staff", () => {
  test.skip(!haveAccounts, "run `npm run e2e:accounts` to create the test accounts");

  test("a customer account cannot enter the admin", async ({ page }) => {
    await signIn(page, customer.email!, customer.password!);
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "This account doesn't have access to the admin area.",
      {
        timeout: 20_000,
      },
    );
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("a super admin sees the dashboard with real figures, then signs out", async ({ page }) => {
    await signIn(page, admin.email!, admin.password!);
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
    // The dashboard runs ~11 queries against the remote database; allow for latency.
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("admin-user-email")).toContainText(/E2E Admin|e2e-admin/);
    // Demo seed: 6 active merchants, 22 published products from active merchants. The total on
    // record grows because the merchant tests add (and terminate) a merchant each run.
    await expect(page.getByTestId("stat-merchants")).toContainText("6");
    await expect(page.getByTestId("stat-merchants")).toContainText(/\d+ on record/);
    await expect(page.getByTestId("stat-products")).toContainText("22");
    await expect(page.getByTestId("recent-activity")).toContainText("auth sign in");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 20_000 });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
