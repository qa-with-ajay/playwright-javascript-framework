import { test, expect } from "@playwright/test";
import { signInThroughUI, requireCredentials } from "../helpers/auth.js";

const admin = {
  roleCode: process.env.ERP_ADMIN_ROLE_CODE || "GROUP_ADMIN",
  email: process.env.ERP_ADMIN_EMAIL,
  password: process.env.ERP_ADMIN_PASSWORD
};
const unit_manager = {
  roleCode: process.env.ERP_MANAGER_ROLE_CODE || "UNIT_MANAGER",
  email: process.env.ERP_UNIT_MANAGER_EMAIL,
  password: process.env.ERP_UNIT_MANAGER_PASSWORD
};

const inventory_manager = {
  roleCode: process.env.ERP_INVENTORY_MANAGER_ROLE_CODE || "INVENTORY_MANAGER",
  email: process.env.ERP_INVENTORY_MANAGER_EMAIL,
  password: process.env.ERP_INVENTORY_MANAGER_PASSWORD
};

const cash_manager = {
  roleCode: process.env.ERP_CASH_MANAGER_ROLE_CODE || "CASH_MANAGER",
  email: process.env.ERP_CASH_MANAGER_EMAIL,
  password: process.env.ERP_CASH_MANAGER_PASSWORD
};

const account_manager = {
  roleCode: process.env.ERP_ACCOUNT_MANAGER_ROLE_CODE || "ACCOUNT_MANAGER",
  email: process.env.ERP_ACCOUNT_MANAGER_EMAIL,
  password: process.env.ERP_ACCOUNT_MANAGER_PASSWORD
};

test.describe("SEC — server-side authorization", () => {
  test("SEC-006: unauthenticated direct calls to privileged APIs are rejected", async ({ request }) => {
    const [users, roles] = await Promise.all([
      request.get("/api/admin/users"),
      request.get("/api/admin/roles")
    ]);
    expect(users.status()).toBe(401);
    expect(roles.status()).toBe(401);
  });

  test("ADMIN-001: authorized Group Admin can read user and role administration APIs", async ({ page }) => {
    requireCredentials(test, admin, "Group Admin");
    await signInThroughUI(page, admin);

    const [users, roles] = await Promise.all([
      page.request.get("/api/admin/users"),
      page.request.get("/api/admin/roles")
    ]);
    expect(users.status()).toBe(200);
    expect(roles.status()).toBe(200);

    const userPayload = await users.json();
    const rolePayload = await roles.json();
    expect(userPayload.users).toEqual(expect.any(Array));
    expect(rolePayload.roles).toEqual(expect.any(Array));
    expect(rolePayload.permissions).toEqual(expect.any(Array));
  });

  test("SEC-006: Unit Manager cannot call group user or role administration APIs directly", async ({ page }) => {
    requireCredentials(test, unit_manager, "Unit Manager");
    await signInThroughUI(page, unit_manager);

    const [users, roles] = await Promise.all([
      page.request.get("/api/admin/users"),
      page.request.get("/api/admin/roles")
    ]);
    expect(users.status()).toBe(403);
    expect(roles.status()).toBe(403);
  });

  test("SEC-006: Unit Manager cannot access the group user-management page by URL", async ({ page }) => {
    requireCredentials(test, unit_manager, "Unit Manager");
    await signInThroughUI(page, unit_manager);

    await page.goto("/admin/users");
    await expect(page).not.toHaveURL(/\/admin\/users(?:\/|\?|$)/);
    await expect(page).toHaveURL(/\/(?:dashboard|access-denied|login)(?:\/|\?|$)/);
  });

  test("SEC-003: user without billing.manage cannot create a sale through the API", async ({ page }) => {
    requireCredentials(test, inventory_manager, "Invetory Manager");
    await signInThroughUI(page, inventory_manager);

    const response = await page.request.post("/api/sales", { data: {} });
    expect(response.status()).toBe(403);
  });
});
