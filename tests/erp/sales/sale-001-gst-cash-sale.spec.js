import { test as erpTest, expect } from "../../../fixtures/erp-fixtures.js";
import { PostgresReadOnlyClient } from "../../../services/database/postgresClient.js";

const salesEmail = process.env.ERP_SALES_EMAIL;
const salesPassword = process.env.ERP_SALES_PASSWORD;
const salesRoleCode = process.env.ERP_SALES_ROLE_CODE || "UNIT_MANAGER";
const databaseUrl = process.env.DATABASE_URL;
const dbEnabled = process.env.ENABLE_DB_VERIFICATION === "true";

const test = erpTest.extend({
  db: async ({}, use) => {
    if (!databaseUrl || !dbEnabled) {
      test.skip(true, "SALE-001 requires DATABASE_URL for a dedicated *_test database and ENABLE_DB_VERIFICATION=true.");
    }
    const client = new PostgresReadOnlyClient(databaseUrl);
    try {
      await client.query("SELECT 1 AS connection_check");
      await use(client);
    } finally {
      await client.close();
    }
  }
});

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const asNumber = (value) => Number(value);

test.describe("SALE-001 · GST cash sale end-to-end", () => {
  test("creates a GST invoice, collects full cash payment, deducts stock and posts accounting", async ({ page, erpBaseURL, db }) => {
    test.skip(!salesEmail || !salesPassword, "Set ERP_SALES_EMAIL and ERP_SALES_PASSWORD in .env.local. The role must have billing.read and billing.manage.");
    
    // Authenticate with the configured business-unit billing user.
    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(salesRoleCode);
    await page.locator('input[name="email"]').fill(salesEmail);
    await page.locator('input[name="password"]').fill(salesPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 20_000 });

    await page.goto(new URL("/sales", erpBaseURL).toString());
    await expect(page.getByRole("heading", { name: "Create invoice" })).toBeVisible();
    const customerSearch = page.getByLabel("Mobile number or customer name");
    if (await customerSearch.isVisible().catch(() => false)) {
      await customerSearch.fill(`PW Walk-in ${Date.now()}`);
      await expect(page.getByText("No registered customer found.", { exact: false })).toBeVisible({ timeout: 10_000 });
      await page.getByRole("button", { name: "Walk-in Customer" }).click();
    }
    // Discover an active location and a simple GST product with available standard stock.
    const locationsResponse = await page.request.get(new URL("/api/sales/locations", erpBaseURL).toString());
    expect(locationsResponse.status()).toBe(200);
    const { items: locations } = await locationsResponse.json();
    expect(locations.length, "At least one active stock location is required").toBeGreaterThan(0);
    const location = locations[0];
    await page.getByLabel("Stock location").selectOption(location.id);

    const productUrl = new URL("/api/sales/products", erpBaseURL);
    productUrl.searchParams.set("locationId", location.id);
    productUrl.searchParams.set("page", "1");
    productUrl.searchParams.set("pageSize", "50");
    const productsResponse = await page.request.get(productUrl.toString());
    expect(productsResponse.status()).toBe(200);
    const productBody = await productsResponse.json();

    const candidate = productBody.items.find((product) => {
      if (Number(product.sellingPrice) <= 0 || Number(product.gstPercentage) <= 0 || product.materialUnit) return false;
      if (product.variants.length > 1) return false;
      const variantId = product.variants.length === 1 ? product.variants[0].id : null;
      return product.stockBalances.some((balance) =>
        balance.variantId === variantId && Number(balance.quantity) >= 1
      );
    });
    test.skip(!candidate, "No positive-price GST product with at least one standard stock unit and zero/one variant is available at the first active location.");

    const variantId = candidate.variants.length === 1 ? candidate.variants[0].id : null;
    const stockBalance = candidate.stockBalances.find((balance) =>
      balance.variantId === variantId && Number(balance.quantity) >= 1
    );
    const stockBeforeResult = await db.query(
      'SELECT "quantity"::text AS quantity FROM "StockBalance" WHERE "id" = $1 AND "businessUnitId" = (SELECT "businessUnitId" FROM "StockLocation" WHERE "id" = $2)',
      [stockBalance.id, location.id]
    );
    expect(stockBeforeResult.rows).toHaveLength(1);
    const stockBefore = asNumber(stockBeforeResult.rows[0].quantity);

    // UI flow: select product, keep the default one-unit allocation, and complete a GST cash sale.
    await page.getByPlaceholder("Search product name, SKU or barcode…").fill(candidate.name);
    const productOption = page.getByRole("option").filter({ hasText: candidate.name }).first();
    await expect(productOption).toBeVisible();
    await productOption.click();

    await expect(page.getByText(candidate.name, { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel("Invoice Type")).toHaveValue("GST");
    await page.getByLabel("Payment method").selectOption("CASH");
    await page.getByRole("button", { name: "Complete sale" }).click();
    await page.getByRole("button", { name: "Complete", exact: true }).click();

    await expect(page).toHaveURL(/\/sales\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
    const saleId = page.url().split("/").pop();
    await expect(page.getByText(/INV|SALE|KB/i).first()).toBeVisible({ timeout: 10_000 });

    // Database assertions: invoice, one full payment, stock ledger/balance, and both posted journals.
    const saleResult = await db.query(
      `SELECT s."id", s."businessUnitId", s."invoiceNumber", s."subtotal"::text AS subtotal,
              s."taxAmount"::text AS tax, s."total"::text AS total, s."costOfGoods"::text AS cost,
              s."stockMovementId", sl."productId", sl."quantity"::text AS quantity,
              sl."lineSubtotal"::text AS line_subtotal, sl."lineTax"::text AS line_tax,
              sl."lineTotal"::text AS line_total, sl."lineCost"::text AS line_cost,
              p."id" AS payment_id, p."amount"::text AS paid_amount, p."method",
              sm."type" AS movement_type
         FROM "Sale" s
         JOIN "SaleLine" sl ON sl."saleId" = s."id" AND sl."businessUnitId" = s."businessUnitId"
         JOIN "Payment" p ON p."saleId" = s."id" AND p."businessUnitId" = s."businessUnitId" AND p."reversedAt" IS NULL
         JOIN "StockMovement" sm ON sm."id" = s."stockMovementId" AND sm."businessUnitId" = s."businessUnitId"
        WHERE s."id" = $1 AND sl."productId" = $2`,
      [saleId, candidate.id]
    );
    expect(saleResult.rows).toHaveLength(1);
    const sale = saleResult.rows[0];
    const subtotal = asNumber(sale.subtotal);
    const tax = asNumber(sale.tax);
    const total = asNumber(sale.total);
    const expectedSubtotal = round2(asNumber(candidate.sellingPrice));
    const expectedTax = round2(expectedSubtotal * asNumber(candidate.gstPercentage) / 100);

    expect(sale.invoiceNumber).toBeTruthy();
    expect(sale.productId).toBe(candidate.id);
    expect(asNumber(sale.quantity)).toBe(1);
    expect(subtotal).toBe(expectedSubtotal);
    expect(tax).toBe(expectedTax);
    expect(total).toBe(round2(subtotal + tax));
    expect(asNumber(sale.line_subtotal)).toBe(subtotal);
    expect(asNumber(sale.line_tax)).toBe(tax);
    expect(asNumber(sale.line_total)).toBe(total);
    expect(asNumber(sale.paid_amount)).toBe(total);
    expect(sale.method).toBe("CASH");
    expect(sale.movement_type).toBe("SALE");

    const stockAfterResult = await db.query(
      'SELECT "quantity"::text AS quantity FROM "StockBalance" WHERE "id" = $1',
      [stockBalance.id]
    );
    expect(stockAfterResult.rows).toHaveLength(1);
    const stockAfter = asNumber(stockAfterResult.rows[0].quantity);
    expect(round2(stockBefore - stockAfter)).toBe(1);

    const journalResult = await db.query(
      `SELECT je."sourceType" AS source_type, je."status", a."code",
              SUM(jl."debit")::text AS debit, SUM(jl."credit")::text AS credit
         FROM "JournalEntry" je
         JOIN "JournalLine" jl ON jl."journalEntryId" = je."id" AND jl."businessUnitId" = je."businessUnitId"
         JOIN "Account" a ON a."id" = jl."accountId" AND a."businessUnitId" = je."businessUnitId"
        WHERE je."businessUnitId" = $1
          AND ((je."sourceType" = 'SALE' AND je."sourceId" = $2)
            OR (je."sourceType" = 'PAYMENT' AND je."sourceId" = $3))
        GROUP BY je."sourceType", je."status", a."code"`,
      [sale.businessUnitId, sale.id, sale.payment_id]
    );
    const amounts = new Map(journalResult.rows.map((row) => [
      `${row.source_type}:${row.code}`,
      { status: row.status, debit: asNumber(row.debit), credit: asNumber(row.credit) }
    ]));

    const expectJournalLine = (source, code, debit, credit) => {
      const actual = amounts.get(`${source}:${code}`);
      expect(actual, `Missing ${source} journal account ${code}`).toBeTruthy();
      expect(actual.status).toBe("POSTED");
      expect(actual.debit).toBe(debit);
      expect(actual.credit).toBe(credit);
    };
    expectJournalLine("SALE", "1100", total, 0);
    expectJournalLine("SALE", "4000", 0, subtotal);
    expectJournalLine("SALE", "2100", 0, tax);
    if (asNumber(sale.cost) > 0) {
      expectJournalLine("SALE", "5000", asNumber(sale.cost), 0);
      expectJournalLine("SALE", "1200", 0, asNumber(sale.cost));
    }
    expectJournalLine("PAYMENT", "1000", total, 0);
    expectJournalLine("PAYMENT", "1100", 0, total);
  });
});
