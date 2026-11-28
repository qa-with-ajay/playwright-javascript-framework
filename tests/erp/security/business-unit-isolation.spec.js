import { test, expect } from "@playwright/test";
import { signInThroughUI, requireCredentials } from "../helpers/auth.js";

const manager = {
  roleCode: process.env.ERP_MANAGER_ROLE_CODE || "UNIT_MANAGER",
  email: process.env.ERP_MANAGER_EMAIL,
  password: process.env.ERP_MANAGER_PASSWORD
};
const assignedUnitId = process.env.ERP_MANAGER_BUSINESS_UNIT_ID;
const forbiddenUnitId = process.env.ERP_FORBIDDEN_BUSINESS_UNIT_ID;
const crossUnitProductId = process.env.ERP_CROSS_UNIT_PRODUCT_ID;

test.describe("SEC — multi-business-unit isolation", () => {
  test("ADMIN-002: Unit Manager can only switch to a business unit assigned to that user", async ({ page }) => {
    requireCredentials(test, manager, "Unit Manager");
    test.skip(!assignedUnitId || !forbiddenUnitId,
      "Configure ERP_MANAGER_BUSINESS_UNIT_ID and ERP_FORBIDDEN_BUSINESS_UNIT_ID with valid test-unit UUIDs.");

    await signInThroughUI(page, manager);

    const assignedResponse = await page.request.post("/api/business-units/active", {
      data: { businessUnitId: assignedUnitId }
    });
    expect(assignedResponse.status()).toBe(200);
    expect((await assignedResponse.json()).activeBusinessUnitId).toBe(assignedUnitId);

    const forbiddenResponse = await page.request.post("/api/business-units/active", {
      data: { businessUnitId: forbiddenUnitId }
    });
    expect(forbiddenResponse.status()).toBe(403);
  });

  test("SEC-001: product ID belonging to another unit is not readable in the active unit context", async ({ page }) => {
    requireCredentials(test, manager, "Unit Manager");
    test.skip(!assignedUnitId || !crossUnitProductId,
      "Configure ERP_MANAGER_BUSINESS_UNIT_ID and ERP_CROSS_UNIT_PRODUCT_ID using two different test business units.");

    await signInThroughUI(page, manager);
    const switchResponse = await page.request.post("/api/business-units/active", {
      data: { businessUnitId: assignedUnitId }
    });
    expect(switchResponse.status()).toBe(200);

    const response = await page.request.get(`/api/inventory/products/${encodeURIComponent(crossUnitProductId)}`);
    expect(response.status()).toBe(404);
  });

  test("SEC-002: malformed or forged business-unit switch payload is rejected", async ({ page }) => {
    requireCredentials(test, manager, "Unit Manager");
    await signInThroughUI(page, manager);

    const [missing, malformed] = await Promise.all([
      page.request.post("/api/business-units/active", { data: {} }),
      page.request.post("/api/business-units/active", { data: { businessUnitId: "not-a-uuid" } })
    ]);
    expect(missing.status()).toBe(400);
    expect(malformed.status()).toBe(400);
  });

  test("SEC-001: unauthenticated user cannot select or enumerate business units", async ({ request }) => {
    const [list, switchResponse] = await Promise.all([
      request.get("/api/business-units"),
      request.post("/api/business-units/active", {
        data: { businessUnitId: "11111111-1111-4111-8111-111111111111" }
      })
    ]);
    expect(list.status()).toBe(401);
    expect(switchResponse.status()).toBe(401);
  });
});
