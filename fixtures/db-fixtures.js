import { test as base, expect } from "./erp-fixtures.js";
import { PostgresReadOnlyClient } from "../services/database/postgresClient.js";

export const test = base.extend({
  db: async ({}, use) => {
    const connectionString = process.env.DATABASE_URL;
    const explicitlyEnabled = process.env.ENABLE_DB_VERIFICATION === "true";

    if (!connectionString || !explicitlyEnabled) {
      test.skip(true, "Set DATABASE_URL to a dedicated *_test database and ENABLE_DB_VERIFICATION=true.");
    }

    const db = new PostgresReadOnlyClient(connectionString);
    try {
      await db.query("SELECT 1 AS connection_check");
      await use(db);
    } finally {
      await db.close();
    }
  }
});

export { expect };
