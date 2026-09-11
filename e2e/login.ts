import type { Page } from "@playwright/test";

// Credentials for a dedicated test account, deliberately not committed —
// set E2E_TEST_EMAIL/E2E_TEST_PASSWORD in .env.local for local runs and
// as GitHub Actions secrets for CI. See README.md's testing section.
// Authenticated tests skip themselves (rather than failing) when these
// aren't set, so the suite still runs cleanly before you've created one.
export function hasTestCredentials(): boolean {
  return Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
}

export async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL / E2E_TEST_PASSWORD are not set — see README.md's testing section."
    );
  }

  await page.goto("/auth/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/dashboard");
}
