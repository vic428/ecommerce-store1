import "dotenv/config";
import { expect, type Page } from "@playwright/test";

export const testAccounts = {
  admin: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
  customer: { email: process.env.E2E_CUSTOMER_EMAIL, password: process.env.E2E_CUSTOMER_PASSWORD },
};

export const haveTestAccounts = !!(
  testAccounts.admin.email &&
  testAccounts.admin.password &&
  testAccounts.customer.email &&
  testAccounts.customer.password
);

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signInAsAdmin(page: Page) {
  await signIn(page, testAccounts.admin.email!, testAccounts.admin.password!);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
}

/** The form-level message (Next.js also renders a hidden role="alert" route announcer). */
export function formMessage(page: Page) {
  return page.getByTestId("form-message");
}
