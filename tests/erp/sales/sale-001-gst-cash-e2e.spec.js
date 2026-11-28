import { test, expect } from "../../../fixtures/db-fixtures.js";

const salesEmail = process.env.ERP_SALES_EMAIL || process.env.ERP_ADMIN_EMAIL;
const salesPassword = process.env.ERP_SALES_PASSWORD || process.env.ERP_ADMIN_PASSWORD;
const salesRoleCode = process.env.ERP_SALES_ROLE_CODE || process.env.ERP_ADMIN_ROLE_CODE || "ADMIN";

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function amount(value) {
  return Number(Number(value).toFixed(2));
}

function sumByAccount(lines, code, field) {
  return lines
    .filter((line) => line.accountCode === code)
    .reduce((sum, line) => sum + Number(line[field] || 0), 0);
}

test.describe("SALE-001 · GST cash sale end-to-end", () => {
  test("creates a GST invoice and reconciles payment, stock and accounting", async ({ page, erpBaseURL, db }) => {
    test.skip(!salesEmail || !salesPassword,
      "Set ERP_SALES_EMAIL and ERP_SALES_PASSWORD (or the ERP_ADMIN equivalents) in .env.local.");

    // Sign in using the real ERP login form. The same browser context is then used
    // for the UI and authenticated discovery API requests.
    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(salesRoleCode);
    await page.locator('input[name="email"]').fill(salesEmail);
    await page.locator('input[name="password"]').fill(salesPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });

    await page.goto(new URL("/sales", erpBaseURL).toString());
    await expect(page.getByRole("heading", { name: "Sales & billing" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create invoice" })).toBeVisible();

    // Discover an active location and a GST-taxable, non-variant product with
    // standard stock. Restricting the first scenario to a simple stock unit
    // avoids conflating this baseline with variant/material conversion cases.
    const locationsResponse = await page.request.get(new URL("/api/sales/locations", erpBaseURL).toString());
    expect(locationsResponse.status()).toBe(200);
    const locationsBody = await locationsResponse.json();
    expect(locationsBody.items.length).toBeGreaterThan(0);
    const location = locationsBody.items[0];

    const productsUrl = new URL("/api/sales/products", erpBaseURL);
    productsUrl.searchParams.set("locationId", location.id);
    productsUrl.searchParams.set("page", "1");
    productsUrl.searchParams.set("pageSize", "50");
    const productsResponse = await page.request.get(productsUrl.toString());
    expect(productsResponse.status()).toBe(200);
    const productsBody = await productsResponse.json();
    const product = productsBody.items.find((item) =>
      Number(item.gstPercentage) > 0 &&
      Number(item.sellingPrice) > 0 &&
      !item.materialUnit &&
      item.variants.length === 0 &&
      item.stockBalances.some((balance) => balance.variantId === null && Number(balance.quantity) >= 1 && Number(balance.averageCost) > 0)
    );

    test.skip(!product,
      "No GST-taxable, non-variant product with at least one standard stock unit exists at the first active location.");

    const stock = product.stockBalances.find((balance) =>
      balance.variantId === null && Number(balance.quantity) >= 1 && Number(balance.averageCost) > 0
    );
    const initialQuantity = Number(stock.quantity);
    const unitPrice = amount(product.sellingPrice);
    const expectedSubtotal = roundMoney(unitPrice);
    const expectedTax = roundMoney(expectedSubtotal * Number(product.gstPercentage) / 100);
    test.skip(expectedTax <= 0, "Selected product price and GST rate produce no rounded tax amount for one unit.");
    const expectedTotal = roundMoney(expectedSubtotal + expectedTax);

    // Select the location and GST invoice type in the UI.
    await page.getByLabel("Stock location").selectOption(location.id);
    await page.getByLabel("Invoice Type").selectOption("GST");

    // A user with customer-management permission must explicitly choose a
    // customer mode. Use a unique search phrase and a walk-in customer for a
    // fully-paid cash sale; no Customer Master record is created.
    const customerSearch = page.getByLabel("Mobile number or customer name");
    if (await customerSearch.isVisible().catch(() => false)) {
      await customerSearch.fill(`PW Walk-in ${Date.now()}`);
      await expect(page.getByText("No registered customer found.", { exact: false })).toBeVisible({ timeout: 10_000 });
      await page.getByRole("button", { name: "Walk-in Customer" }).click();
    }

    const productSearch = page.getByPlaceholder("Search product name, SKU or barcode…").first();
    await productSearch.fill(product.name);
    const suggestion = page.getByRole("option").filter({ hasText: product.sku }).first();
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    await suggestion.click();

    // Product selection preallocates one standard stock unit. Set it explicitly
    // so the intended quantity is obvious and deterministic.
    await page.locator('summary.flex').click();
    await page.locator('input[placeholder="Quantity to take"]').first().fill("1");
    await expect(page.getByText(expectedTotal.toFixed(2), { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Complete sale" }).click();
    await expect(page.getByRole("heading", { name: "Complete this sale?" })).toBeVisible();
    await page.getByRole("button", { name: "Complete", exact: true }).click();

    await expect(page).toHaveURL(/\/sales\/[0-9a-f-]{36}$/i, { timeout: 20_000 });
    const invoiceUrl = new URL(page.url());
    const saleId = invoiceUrl.pathname.split("/").pop();
    await expect(page.getByText(product.name, { exact: false }).first()).toBeVisible();
    await expect(page.getByText("GST %", { exact: true }).first()).toBeVisible();

    // Verify persisted records with SELECT-only queries against the dedicated
    // test database. All expected values are calculated independently above.
    const saleResult = await db.query(
      'SELECT s."id", s."businessUnitId", s."stockMovementId", s."invoiceNumber", s."taxMode", s."subtotal", s."taxAmount", s."total", s."costOfGoods" FROM "Sale" s WHERE s."id" = $1',
      [saleId]
    );
    expect(saleResult.rows).toHaveLength(1);
    const sale = saleResult.rows[0];
    expect(sale.taxMode).toBe("GST");
    expect(amount(sale.subtotal)).toBe(expectedSubtotal);
    expect(amount(sale.taxAmount)).toBe(expectedTax);
    expect(amount(sale.total)).toBe(expectedTotal);

    const paymentResult = await db.query(
      'SELECT p."id", p."amount", p."method", p."reversedAt" FROM "Payment" p WHERE p."saleId" = $1 ORDER BY p."createdAt" ASC',
      [saleId]
    );
    const activePayments = paymentResult.rows.filter((payment) => payment.reversedAt === null);
    expect(activePayments).toHaveLength(1);
    expect(amount(activePayments[0].amount)).toBe(expectedTotal);
    expect(activePayments[0].method).toBe("CASH");

    const linesResult = await db.query(
      'SELECT sl."id", sl."productId", sl."quantity", sl."lineSubtotal", sl."lineTax", sl."lineTotal", sl."lineCost" FROM "SaleLine" sl WHERE sl."saleId" = $1',
      [saleId]
    );
    expect(linesResult.rows).toHaveLength(1);
    expect(linesResult.rows[0].productId).toBe(product.id);
    expect(Number(linesResult.rows[0].quantity)).toBe(1);
    expect(amount(linesResult.rows[0].lineSubtotal)).toBe(expectedSubtotal);
    expect(amount(linesResult.rows[0].lineTax)).toBe(expectedTax);

    const stockResult = await db.query(
      'SELECT sb."quantity" FROM "StockBalance" sb WHERE sb."id" = $1',
      [stock.id]
    );
    expect(stockResult.rows).toHaveLength(1);
    expect(Number(stockResult.rows[0].quantity)).toBeCloseTo(initialQuantity - 1, 6);

    const movementResult = await db.query(
      'SELECT sm."id", sm."type" FROM "StockMovement" sm WHERE sm."id" = $1',
      [sale.stockMovementId]
    );
    expect(movementResult.rows).toHaveLength(1);
    expect(movementResult.rows[0].type).toBe("SALE");

    const ledgerResult = await db.query(
      'SELECT sle."quantityDelta" FROM "StockLedgerEntry" sle WHERE sle."movementId" = $1 AND sle."productId" = $2',
      [sale.stockMovementId, product.id]
    );
    expect(ledgerResult.rows.length).toBeGreaterThan(0);
    const stockDelta = ledgerResult.rows.reduce((sum, row) => sum + Number(row.quantityDelta), 0);
    expect(stockDelta).toBeCloseTo(-1, 6);

    const saleJournalResult = await db.query(
      'SELECT je."id", je."status", jl."debit", jl."credit", a."code" AS "accountCode" FROM "JournalEntry" je JOIN "JournalLine" jl ON jl."journalEntryId" = je."id" JOIN "Account" a ON a."id" = jl."accountId" WHERE je."sourceType" = $1 AND je."sourceId" = $2',
      ["SALE", saleId]
    );
    expect(saleJournalResult.rows.length).toBeGreaterThanOrEqual(4);
    expect(saleJournalResult.rows.every((line) => line.status === "POSTED")).toBe(true);
    const saleJournalLines = saleJournalResult.rows;
    const saleDebits = saleJournalLines.reduce((sum, line) => sum + Number(line.debit), 0);
    const saleCredits = saleJournalLines.reduce((sum, line) => sum + Number(line.credit), 0);
    expect(amount(saleDebits)).toBe(amount(saleCredits));
    expect(amount(sumByAccount(saleJournalLines, "1100", "debit"))).toBe(expectedTotal);
    expect(amount(sumByAccount(saleJournalLines, "4000", "credit"))).toBe(expectedSubtotal);
    expect(amount(sumByAccount(saleJournalLines, "2100", "credit"))).toBe(expectedTax);
    expect(amount(sumByAccount(saleJournalLines, "5000", "debit"))).toBe(amount(sale.costOfGoods));
    expect(amount(sumByAccount(saleJournalLines, "1200", "credit"))).toBe(amount(sale.costOfGoods));

    const paymentJournalResult = await db.query(
      'SELECT je."id", je."status", jl."debit", jl."credit", a."code" AS "accountCode" FROM "JournalEntry" je JOIN "JournalLine" jl ON jl."journalEntryId" = je."id" JOIN "Account" a ON a."id" = jl."accountId" WHERE je."sourceType" = $1 AND je."sourceId" = $2',
      ["PAYMENT", activePayments[0].id]
    );
    expect(paymentJournalResult.rows).toHaveLength(2);
    expect(paymentJournalResult.rows.every((line) => line.status === "POSTED")).toBe(true);
    expect(amount(paymentJournalResult.rows.reduce((sum, line) => sum + Number(line.debit), 0))).toBe(expectedTotal);
    expect(amount(paymentJournalResult.rows.reduce((sum, line) => sum + Number(line.credit), 0))).toBe(expectedTotal);
    expect(amount(sumByAccount(paymentJournalResult.rows, "1000", "debit"))).toBe(expectedTotal);
    expect(amount(sumByAccount(paymentJournalResult.rows, "1100", "credit"))).toBe(expectedTotal);

    await test.info().attach("sale-001-result.json", {
      body: JSON.stringify({
        scenario: "SALE-001",
        invoiceNumber: sale.invoiceNumber,
        product: product.name,
        quantity: 1,
        subtotal: expectedSubtotal,
        gst: expectedTax,
        total: expectedTotal,
        stockBefore: initialQuantity,
        stockAfter: Number(stockResult.rows[0].quantity),
        paymentMethod: activePayments[0].method,
        accounting: "posted and balanced"
      }, null, 2),
      contentType: "application/json"
    });
  });
});
