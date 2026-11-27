import { test, expect } from "../../../fixtures/erp-fixtures.js";

const salesEmail = process.env.ERP_SALES_EMAIL || process.env.ERP_ADMIN_EMAIL;
const salesPassword = process.env.ERP_SALES_PASSWORD || process.env.ERP_ADMIN_PASSWORD;
const salesRoleCode = process.env.ERP_SALES_ROLE_CODE || process.env.ERP_ADMIN_ROLE_CODE || "ADMIN";

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function amount(value) {
  return Number(Number(value).toFixed(2));
}

test.describe("SALE-002 · GST partial-payment sale", () => {
  test("creates an identified-customer GST invoice with a partial cash payment", async ({ page, erpBaseURL }) => {
    test.skip(!salesEmail || !salesPassword,
      "Set ERP_SALES_EMAIL and ERP_SALES_PASSWORD (or the ERP_ADMIN equivalents) in .env.local.");

    await page.goto(new URL("/login", erpBaseURL).toString());
    await page.locator('select[name="roleCode"]').selectOption(salesRoleCode);
    await page.locator('input[name="email"]').fill(salesEmail);
    await page.locator('input[name="password"]').fill(salesPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });

    await page.goto(new URL("/sales", erpBaseURL).toString());
    await expect(page.getByRole("heading", { name: "Sales & billing" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create invoice" })).toBeVisible();

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
      item.stockBalances.some((balance) =>
        balance.variantId === null &&
        Number(balance.quantity) >= 1
      )
    );

    test.skip(!product,
      "No GST-taxable, non-variant product with at least one standard stock unit exists at the first active location.");

    const unitPrice = amount(product.sellingPrice);
    const expectedSubtotal = roundMoney(unitPrice);
    const expectedTax = roundMoney(expectedSubtotal * Number(product.gstPercentage) / 100);
    const expectedTotal = roundMoney(expectedSubtotal + expectedTax);
    test.skip(expectedTotal < 2,
      "Selected product total is too small to create a meaningful partial-payment scenario.");

    const amountReceived = roundMoney(expectedTotal / 2);
    test.skip(amountReceived <= 0 || amountReceived >= expectedTotal,
      "Unable to derive a valid partial payment from the selected product price.");

    await page.getByLabel("Stock location").selectOption(location.id);
    await page.getByLabel("Invoice Type").selectOption("GST");

    const uniqueSuffix = Date.now();
    const customerName = `PW Partial Customer ${uniqueSuffix}`;
    const customerPhone = `9${String(uniqueSuffix).slice(-9)}`;

    await page.getByLabel("Mobile number or customer name").fill(customerName);
    await expect(page.getByText("No registered customer found.", { exact: false })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "New Customer" }).click();
    await page.getByLabel("Customer name").fill(customerName);
    await page.getByLabel("Mobile number").fill(customerPhone);

    const productSearch = page.getByPlaceholder("Search product name, SKU or barcode…").first();
    await productSearch.fill(product.name);
    const suggestion = page.getByRole("option").filter({ hasText: product.sku }).first();
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    await suggestion.click();

    await page.locator("summary.flex").click();
    await page.locator('input[placeholder="Quantity to take"]').first().fill("1");
    await expect(page.getByText(expectedTotal.toFixed(2), { exact: false }).first()).toBeVisible();

    await page.getByLabel("Amount received").fill(amountReceived.toFixed(2));
    await page.getByLabel("Payment method").selectOption("CASH");
    await expect(page.getByText("Balance due").locator("..")).toContainText(
      (expectedTotal - amountReceived).toFixed(2)
    );

    await page.getByRole("button", { name: "Complete sale" }).click();
    await expect(page.getByRole("heading", { name: "Complete this sale?" })).toBeVisible();
    await page.getByRole("button", { name: "Complete", exact: true }).click();

    await expect(page).toHaveURL(/\/sales\/[0-9a-f-]{36}$/i, { timeout: 20_000 });
    const saleId = new URL(page.url()).pathname.split("/").pop();

    // The sales list API derives PAID/PARTIAL status from active payments.
    const salesUrl = new URL("/api/sales", erpBaseURL);
    salesUrl.searchParams.set("search", customerName);
    salesUrl.searchParams.set("page", "1");
    salesUrl.searchParams.set("pageSize", "20");
    await expect.poll(async () => {
      const response = await page.request.get(salesUrl.toString());
      if (response.status() !== 200) return null;
      const body = await response.json();
      return body.items.find((item) => item.id === saleId) ?? null;
    }, { timeout: 10_000 }).toMatchObject({
      id: saleId,
      taxMode: "GST",
      paymentStatus: "PARTIAL"
    });

    const salesResponse = await page.request.get(salesUrl.toString());
    expect(salesResponse.status()).toBe(200);
    const salesBody = await salesResponse.json();
    const sale = salesBody.items.find((item) => item.id === saleId);
    expect(sale).toBeTruthy();
    expect(sale.customerName).toBe(customerName);
    expect(amount(sale.total)).toBe(expectedTotal);
    expect(amount(sale.paidAmount)).toBe(amountReceived);
    expect(amount(sale.balanceDue)).toBe(roundMoney(expectedTotal - amountReceived));
    expect(amount(sale.returnedAmount)).toBe(0);
    expect(sale.paymentStatus).toBe("PARTIAL");

    await test.info().attach("sale-002-result.json", {
      body: JSON.stringify({
        scenario: "SALE-002",
        saleId,
        invoiceNumber: sale.invoiceNumber,
        customerName,
        product: product.name,
        quantity: 1,
        subtotal: expectedSubtotal,
        gst: expectedTax,
        total: expectedTotal,
        paymentMethod: "CASH",
        amountReceived,
        balanceDue: roundMoney(expectedTotal - amountReceived),
        paymentStatus: sale.paymentStatus
      }, null, 2),
      contentType: "application/json"
    });
  });
});
