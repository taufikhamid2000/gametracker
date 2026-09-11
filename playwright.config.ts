import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Playwright's own process doesn't read .env.local the way `next dev`/
// `next build` do — load it explicitly so E2E_TEST_EMAIL/PASSWORD (if
// set) reach e2e/login.ts locally. CI sets these as real environment
// variables instead (no .env.local there), hence the existsSync guard.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Smoke tests only — every page loads without a thrown error or the
// generic error boundary. Not a feature-coverage suite: it's meant to
// catch the class of bug `next build`'s type check can't (e.g. a Server
// Component passing a function prop to a Client Component), which only
// surfaces once React actually tries to render the page.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Only spin up a local server when testing against localhost — pointing
  // E2E_BASE_URL at a real deployment skips this entirely. In CI, the
  // workflow already runs `npm run build` as its own step (so a build
  // failure is reported clearly on its own, separate from test failures)
  // — rebuilding again here would be redundant and, worse, gave a second
  // fresh build a chance to somehow come up without the env it needed
  // (500s from a broken Supabase client, not a caught build error).
  // Reusing that same .next output removes that whole class of flake.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "npm run start" : "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
