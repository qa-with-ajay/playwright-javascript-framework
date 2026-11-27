import { Pool } from "pg";

const MUTATING_SQL = /\b(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke|vacuum|refresh|call|copy)\b/i;

/**
 * Read-only PostgreSQL helper for cross-layer assertions.
 * Every query runs in a READ ONLY transaction. Never point this at production.
 */
export class PostgresReadOnlyClient {
  constructor(connectionString) {
    if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL verification.");

    const databaseName = new URL(connectionString).pathname.replace(/^\/+/, "");
    if (!databaseName || !/(^|[_-])test($|[_-])/i.test(databaseName)) {
      throw new Error(
        "Refusing database access to " + databaseName +
        ". Use a dedicated database with 'test' in its name (for example kb_erp_test)."
      );
    }

    this.pool = new Pool({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      application_name: "kb-erp-playwright-readonly"
    });
  }

  async query(sql, params = []) {
    if (typeof sql !== "string" || !/^\s*(select|with)\b/i.test(sql)) {
      throw new Error("Database fixture permits SELECT queries only.");
    }
    if (MUTATING_SQL.test(sql)) {
      throw new Error("Potentially mutating SQL is not permitted in the read-only test fixture.");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      const result = await client.query(sql, params);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
