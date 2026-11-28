import { expect } from "@playwright/test";

/**
 * Sign in through the real login form so tests exercise the Credentials
 * provider, role assignment validation, session cookie and post-login flow.
 */
export async function signInThroughUI(page, { roleCode, email, password }) {
  if (!roleCode || !email || !password) {
    throw new Error("A role code, email and password are required to sign in.");
  }

  await page.goto("/login");
  await page.locator('select[name="roleCode"]').selectOption(roleCode);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/(?:post-login|dashboard|inventory)(?:\/|\?|$)/, { timeout: 20_000 });
}

export function requireCredentials(test, { email, password }, label) {
  test.skip(!email || !password, `Configure the dedicated ${label} test account in .env.local.`);
}
