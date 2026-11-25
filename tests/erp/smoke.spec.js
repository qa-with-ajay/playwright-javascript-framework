import { test, expect } from "../../fixtures/erp-fixtures.js";

const adminEmail = process.env.ERP_ADMIN_EMAIL;
const adminPassword = process.env.ERP_ADMIN_PASSWORD;
const adminRoleCode = process.env.ERP_ADMIN_ROLE_CODE || "ADMIN";

const managerEmail = process.env.ERP_MANAGER_EMAIL;
const managerPassword = process.env.ERP_MANAGER_PASSWORD;
const managerRoleCode = process.env.ERP_MANAGER_ROLE_CODE || "UNIT_MANAGER";

test.describe("KB ERP smoke tests", () => {
  test("login page is reachable and exposes required sign-in fields", async ({ page, erpBaseURL }) => {
    await page.goto(new URL("/login", erpBaseURL).toString());
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator('select[name="roleCode"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("unauthenticated users are redirected away from dashboard", async ({ page, erpBaseURL }) => {
    await page.goto(new URL("/dashboard", erpBaseURL).toString());
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });

  test("invalid credentials are rejected", async ({ page, erpBaseURL }) => {
    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(adminRoleCode);
    await page.locator('input[name="email"]').fill("invalid-smoke-user@example.invalid");
    await page.locator('input[name="password"]').fill("invalid-smoke-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid email or password.");
  });

  test("Group Admin can sign in and open the dashboard", async ({ page, erpBaseURL }) => {
    test.skip(!adminEmail || !adminPassword, "Set ERP_ADMIN_EMAIL and ERP_ADMIN_PASSWORD in .env.local.");
    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(adminRoleCode);
    await page.locator('input[name="email"]').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Dashboard/ })).toBeVisible();
    await expect(page.getByText("Inventory", { exact: true }).first()).toBeVisible();
  });

  test("authenticated Group Admin can read inventory products API", async ({ page, erpBaseURL }) => {
    test.skip(!adminEmail || !adminPassword, "Set ERP_ADMIN_EMAIL and ERP_ADMIN_PASSWORD in .env.local.");
    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(adminRoleCode);
    await page.locator('input[name="email"]').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 20_000 });

    const response = await page.request.get(new URL("/api/inventory/products", erpBaseURL).toString());
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({
      items: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number)
    }));
  });

  test("inventory products API rejects unauthenticated requests", async ({ request, erpBaseURL }) => {
    const response = await request.get(new URL("/api/inventory/products", erpBaseURL).toString());
    expect(response.status()).toBe(401);
  });

  test("Unit Manager can access assigned inventory but not Group Admin user management", async ({ page, erpBaseURL }) => {
    test.skip(!managerEmail || !managerPassword, "Set ERP_MANAGER_EMAIL and ERP_MANAGER_PASSWORD in .env.local.");
    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(managerRoleCode);
    await page.locator('input[name="email"]').fill(managerEmail);
    await page.locator('input[name="password"]').fill(managerPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 20_000 });

    await page.goto(new URL("/inventory/products", erpBaseURL).toString());
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

    await page.goto(new URL("/admin/users", erpBaseURL).toString());
    await expect(page).toHaveURL(/access-denied|dashboard|login/);
  });
});
