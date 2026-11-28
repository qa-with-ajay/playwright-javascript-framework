import { test, expect } from "@playwright/test";
import { signInThroughUI, requireCredentials } from "../helpers/auth.js";

const admin = {
  roleCode: process.env.ERP_ADMIN_ROLE_CODE || "GROUP_ADMIN",
  email: process.env.ERP_ADMIN_EMAIL,
  password: process.env.ERP_ADMIN_PASSWORD
};

test.describe("AUTH — authentication and session boundary", () => {
  test("AUTH-001: login page exposes the role, email and password controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator('select[name="roleCode"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("AUTH-002: invalid credentials are rejected without creating a session", async ({ page }) => {
    await page.goto("/login");
    const roleSelect = page.locator('select[name="roleCode"]');
    const firstAvailableRole = await roleSelect.locator("option").nth(1).getAttribute("value");
    test.skip(!firstAvailableRole, "No active login roles are configured in the test environment.");

    await roleSelect.selectOption(firstAvailableRole);
    await page.locator('input[name="email"]').fill("invalid-auth-user@example.invalid");
    await page.locator('input[name="password"]').fill("definitely-not-a-valid-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator('p[role="alert"]')).toHaveText("Invalid email or password.");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.ok()).toBeTruthy();
    const session = await sessionResponse.json();
    console.log('print',session)
    expect(session).toBeNull();
  });

  test("AUTH-004: protected page and APIs reject an unauthenticated browser", async ({ page, request }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);

    const [businessUnits, products] = await Promise.all([
      request.get("/api/business-units"),
      request.get("/api/inventory/products")
    ]);
    expect(businessUnits.status()).toBe(401);
    expect(products.status()).toBe(401);
  });

  test("AUTH-001: valid assigned Group Admin account receives an authenticated session", async ({ page }) => {
    requireCredentials(test, admin, "Group Admin");
    await signInThroughUI(page, admin);

    const response = await page.request.get("/api/auth/session");
    expect(response.status()).toBe(200);
    const session = await response.json();
    expect(session.user?.id).toBeTruthy();
    expect(session.user?.email?.toLowerCase()).toBe(admin.email.toLowerCase());
  });
});
