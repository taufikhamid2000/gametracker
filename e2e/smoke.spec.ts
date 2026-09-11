import { test, expect, type Page } from "@playwright/test";
import { login, hasTestCredentials } from "./login";

// Fails on any thrown render error or the app's generic error boundary,
// not on specific content — this exists to catch a page crashing (e.g. a
// Server Component passing a function prop to a Client Component, which
// next build's type check doesn't catch), not to verify feature behavior.
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

const PUBLIC_PAGES = ["/", "/auth/signin", "/auth/signup"];

for (const path of PUBLIC_PAGES) {
  test(`${path} loads without a thrown error`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path);
    expect(errors).toEqual([]);
  });
}

test.describe("authenticated pages", () => {
  test.skip(!hasTestCredentials(), "E2E_TEST_EMAIL/PASSWORD not set — see README.md");

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard loads without a thrown error", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/dashboard");
    await expect(page.getByText(/welcome/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("settings loads without a thrown error", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/settings");
    expect(errors).toEqual([]);
  });

  test("games library loads without a thrown error", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/games");
    expect(errors).toEqual([]);
  });
});
