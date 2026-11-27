import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
/** Set E2E_DEV=1 to test against `next dev` (faster to start, slower and less stable per request). */
const useDevServer = process.env.E2E_DEV === "1";

/**
 * End-to-end tests. Each suite runs at desktop, tablet and mobile sizes.
 *
 * By default the tests run against a production build (`next build && next start`), which is
 * what customers get. Tests expect a seeded database (npm run db:seed): point DATABASE_URL at a
 * test database, never at a live store.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Prisma's local dev database handles about one connection at a time, so keep local runs
  // serial-ish. CI should use a real Postgres service and can raise this.
  workers: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: useDevServer
      ? `npm run dev -- --port ${PORT}`
      : `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
