import { test, expect } from "../../../fixtures/db-fixtures.js";

test.describe("ERP PostgreSQL read-only verification", () => {
  test("connects to the dedicated test database using a read-only query", async ({ db }) => {
    const result = await db.query("SELECT current_database() AS database_name, current_user AS database_user");
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].database_name).toMatch(/(^|[_-])test($|[_-])/i);
  });
});
