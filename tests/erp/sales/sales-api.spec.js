import { test, expect } from "../../../fixtures/api-fixtures.js";

test.describe("Sales API contract and access control", () => {
  test("unauthenticated user cannot list sales", async ({ erpApi }) => {
    const response = await erpApi.get("/api/sales");
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot create a sale", async ({ erpApi }) => {
    const response = await erpApi.post("/api/sales", {});
    expect(response.status()).toBe(401);
  });
});
