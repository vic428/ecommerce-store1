/**
 * Adds generated end-to-end test account credentials to .env if they're missing. The values are
 * random and never printed. Test accounts only: never run this against production.
 *
 *   npm run e2e:env
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ENV_FILE = ".env";
const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
const has = (k: string) => new RegExp(`^${k}=`, "m").test(existing);
const pw = () => `T${randomBytes(18).toString("base64url")}9`;

const wanted: Record<string, () => string> = {
  E2E_ADMIN_EMAIL: () => "e2e-admin@example.com",
  E2E_ADMIN_PASSWORD: pw,
  E2E_CUSTOMER_EMAIL: () => "e2e-customer@example.com",
  E2E_CUSTOMER_PASSWORD: pw,
};

const missing = Object.keys(wanted).filter((k) => !has(k));
if (missing.length === 0) {
  console.log("• test account variables already present in .env");
} else {
  const lines = missing.map((k) => `${k}="${wanted[k]()}"`).join("\n");
  appendFileSync(
    ENV_FILE,
    `\n# Generated test accounts for automated tests (dev/test project only). No action needed.\n${lines}\n`,
  );
  console.log(`✓ added ${missing.join(", ")} to .env (values not shown)`);
}
