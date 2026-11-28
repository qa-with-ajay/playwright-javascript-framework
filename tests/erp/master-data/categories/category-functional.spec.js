import { test, expect } from "../../../../fixtures/erp-fixtures.js";
import { signInThroughUI } from "../../../helpers/auth.js";
import { CategoryPage, categoryTestName } from "../../../../pageobjects/CategoryPage.js";

const admin = {
  roleCode: process.env.ERP_CATEGORY_ADMIN_ROLE_CODE || process.env.ERP_ADMIN_ROLE_CODE || "GROUP_ADMIN",
  email: process.env.ERP_CATEGORY_ADMIN_EMAIL || process.env.ERP_ADMIN_EMAIL,
  password: process.env.ERP_CATEGORY_ADMIN_PASSWORD || process.env.ERP_ADMIN_PASSWORD
};
const readOnly = {
  roleCode: process.env.ERP_CATEGORY_READONLY_ROLE_CODE || "UNIT_VIEWER",
  email: process.env.ERP_CATEGORY_READONLY_EMAIL,
  password: process.env.ERP_CATEGORY_READONLY_PASSWORD
};
const noInventory = {
  roleCode: process.env.ERP_CATEGORY_NO_INVENTORY_ROLE_CODE || "UNIT_VIEWER",
  email: process.env.ERP_CATEGORY_NO_INVENTORY_EMAIL,
  password: process.env.ERP_CATEGORY_NO_INVENTORY_PASSWORD
};
const mutationsEnabled = process.env.ENABLE_CATEGORY_MUTATION_TESTS === "true";

function requireAccount(account, label) {
  test.skip(!account.email || !account.password, `Configure the dedicated ${label} account in the private .env.local file.`);
}

async function login(page, account) {
  await signInThroughUI(page, account);
}

async function firstCategoryName(categoryPage) {
  const firstRow = categoryPage.rows.first();
  await expect(firstRow).toBeVisible();
  return (await firstRow.locator("td").first().innerText()).trim();
}

test.describe("Sprint 2 — Categories: read-only UI functional tests", () => {
  test("CAT-001: Categories page opens for an authenticated inventory reader", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await expect(categories.heading).toBeVisible();
  });

  test("CAT-002: Categories page displays its implemented controls and columns", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await expect(categories.search).toBeVisible();
    await expect(categories.status).toBeVisible();
    await expect(categories.table.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(categories.table.getByRole("columnheader", { name: "Description" })).toBeVisible();
    await expect(categories.table.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Category" })).toBeVisible();
  });

  test("CAT-003: unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/inventory/categories");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });

  test("CAT-004: authenticated user without inventory.read cannot open Categories", async ({ page }) => {
    requireAccount(noInventory, "user without inventory.read");
    await login(page, noInventory);
    await page.goto("/inventory/categories");
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  });

  test("CAT-005: existing categories are listed for the selected business unit", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await expect(categories.table.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(page.getByText(/\d+ total/)).toBeVisible();
  });

  test("CAT-006: category rows are ordered alphabetically by name", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const names = await categories.rows.locator("td").nth(0).allInnerTexts();
    const actual = names.map((name) => name.trim()).filter(Boolean);
    expect(actual).toEqual([...actual].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
  });

  test("CAT-007: search finds an existing category by its full name", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const name = await firstCategoryName(categories);
    await categories.search.fill(name);
    await expect(categories.rowFor(name)).toHaveCount(1);
  });

  test("CAT-008: search finds a category by a partial name", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const name = await firstCategoryName(categories);
    const fragment = name.slice(0, Math.max(2, Math.ceil(name.length / 2)));
    await categories.search.fill(fragment);
    await expect(categories.rowFor(fragment)).toHaveCount(1);
  });

  test("CAT-009: category search is case-insensitive", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const name = await firstCategoryName(categories);
    await categories.search.fill(name.toUpperCase());
    await expect(categories.rowFor(name)).toHaveCount(1);
  });

  test("CAT-010: search with no match displays the empty-state message", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.search.fill(categoryTestName("NO_MATCH"));
    await expect(page.getByText("No categories found.", { exact: true })).toBeVisible();
  });

  test("CAT-011: clearing search restores the unfiltered list", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const totalBefore = await page.getByText(/\d+ total/).innerText();
    await categories.search.fill(categoryTestName("NO_MATCH"));
    await expect(page.getByText("No categories found.", { exact: true })).toBeVisible();
    await categories.search.clear();
    await expect(page.getByText(totalBefore, { exact: true })).toBeVisible();
  });

  test("CAT-012: Active filter displays only active categories", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.status.selectOption("true");
    const statuses = await categories.rows.locator("td").nth(2).allInnerTexts();
    for (const status of statuses) expect(status.trim()).toBe("Active");
  });

  test("CAT-013: Inactive filter displays only inactive categories", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.status.selectOption("false");
    const statuses = await categories.rows.locator("td").nth(2).allInnerTexts();
    test.skip(statuses.length === 0, "No inactive categories exist in the selected business unit.");
    for (const status of statuses) expect(status.trim()).toBe("Inactive");
  });

  test("CAT-014: All filter displays active and inactive categories", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.status.selectOption("all");
    await expect(categories.status).toHaveValue("all");
    await expect(categories.table).toBeVisible();
  });

  test("CAT-033: read-only inventory user can view categories but has no management controls", async ({ page }) => {
    requireAccount(readOnly, "read-only inventory");
    await login(page, readOnly);
    const categories = new CategoryPage(page);
    await categories.open();
    await expect(categories.search).toBeVisible();
    await expect(categories.table).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Category" })).toHaveCount(0);
    await expect(categories.table.getByRole("columnheader", { name: "Actions" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add Category" })).toHaveCount(0);
  });

  test("CAT-034: inventory manager sees category management controls", async ({ page }) => {
    requireAccount(admin, "inventory manager");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    await expect(page.getByRole("heading", { name: "Add Category" })).toBeVisible();
    await expect(categories.table.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  });

  test("CAT-035: business-unit isolation is verified with a dedicated multi-unit account", async () => {
    test.skip(true, "Requires an agreed second business unit and confirmed business-unit switcher workflow; do not infer the selector.");
  });

  test("CAT-036: pagination advances and returns to the previous page when more than 10 categories exist", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const totalText = await page.getByText(/\d+ total/).innerText();
    const total = Number(totalText.match(/\d+/)?.[0] || 0);
    test.skip(total <= 10, "Pagination requires more than 10 categories in the selected business unit.");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Page 2 of", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  });

  test("CAT-037: searching resets pagination to page 1", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const totalText = await page.getByText(/\d+ total/).innerText();
    test.skip(Number(totalText.match(/\d+/)?.[0] || 0) <= 10, "Requires more than 10 categories.");
    await page.getByRole("button", { name: "Next" }).click();
    await categories.search.fill(categoryTestName("NO_MATCH"));
    await expect(page.getByText("Page 1 of 1", { exact: true })).toBeVisible();
  });

  test("CAT-038: changing status filter resets pagination to page 1", async ({ page }) => {
    requireAccount(admin, "inventory reader / admin");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const totalText = await page.getByText(/\d+ total/).innerText();
    test.skip(Number(totalText.match(/\d+/)?.[0] || 0) <= 10, "Requires more than 10 categories.");
    await page.getByRole("button", { name: "Next" }).click();
    await categories.status.selectOption("true");
    await expect(page.getByText("Page 1 of", { exact: false })).toBeVisible();
  });

  test("CAT-039: Escape closes the category status confirmation dialog without changing data", async ({ page }) => {
    requireAccount(admin, "inventory manager");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const row = categories.rows.filter({ has: page.getByRole("button", { name: "Deactivate" }) }).first();
    await expect(row).toBeVisible();
    const originalName = (await row.locator("td").first().innerText()).trim();
    await row.getByRole("button", { name: "Deactivate" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(categories.rowFor(originalName)).toContainText("Active");
  });

  test("CAT-040: clicking the confirmation backdrop closes it without changing data", async ({ page }) => {
    requireAccount(admin, "inventory manager");
    await login(page, admin);
    const categories = new CategoryPage(page);
    await categories.open();
    const row = categories.rows.filter({ has: page.getByRole("button", { name: "Deactivate" }) }).first();
    await expect(row).toBeVisible();
    const originalName = (await row.locator("td").first().innerText()).trim();
    await row.getByRole("button", { name: "Deactivate" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const backdrop = page.locator("div.fixed.inset-0").filter({ has: dialog });
    await backdrop.click({ position: { x: 2, y: 2 } });
    await expect(dialog).toHaveCount(0);
    await expect(categories.rowFor(originalName)).toContainText("Active");
  });
});

test.describe("Sprint 2 — Categories: create, edit and status lifecycle (opt-in)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!mutationsEnabled, "Set ENABLE_CATEGORY_MUTATION_TESTS=true only when an agreed QA business unit is selected.");
    requireAccount(admin, "dedicated category QA manager");
    await login(page, admin);
  });

  test("CAT-015: create category with a valid name", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("CREATE");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await expect(categories.rowFor(name)).toBeVisible();
  });

  test("CAT-016: create category with a description", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("DESCRIPTION");
    await categories.create(name, "QA automation category description");
    await categories.expectNotice("Categories created.");
    await expect(categories.rowFor(name)).toContainText("QA automation category description");
  });

  test("CAT-017: create category without a description", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("NO_DESCRIPTION");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await expect(categories.rowFor(name)).toBeVisible();
  });

  test("CAT-018: empty category name is blocked by required-field validation", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.addButton.click();
    await expect(categories.nameInput).toHaveJSProperty("validity.valid", false);
    await expect(categories.page.getByRole("status")).toHaveCount(0);
  });

  test("CAT-019: whitespace-only category name is rejected by server validation", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.nameInput.fill("   ");
    await categories.addButton.click();
    await categories.expectError("Invalid category data.");
  });

  test("CAT-020: duplicate category name is rejected", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("DUPLICATE");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.nameInput.fill(name);
    await categories.addButton.click();
    await categories.expectError("A category with this name already exists.");
  });

  test("CAT-021: category name input enforces the 100-character limit", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.nameInput.fill("N".repeat(120));
    await expect(categories.nameInput).toHaveAttribute("maxlength", "100");
    expect((await categories.nameInput.inputValue()).length).toBe(100);
  });

  test("CAT-022: category description input enforces the 500-character limit", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    await categories.descriptionInput.fill("D".repeat(520));
    await expect(categories.descriptionInput).toHaveAttribute("maxlength", "500");
    expect((await categories.descriptionInput.inputValue()).length).toBe(500);
  });

  test("CAT-023: category name is trimmed before it is saved", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("TRIM");
    await categories.create(`  ${name}  `);
    await categories.expectNotice("Categories created.");
    await expect(categories.rowFor(name)).toBeVisible();
  });

  test("CAT-024: edit a QA-created category name", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const original = categoryTestName("EDIT");
    const updated = categoryTestName("EDITED");
    await categories.create(original);
    await categories.expectNotice("Categories created.");
    const row = categories.rowFor(original);
    await row.getByRole("button", { name: "Edit" }).click();
    await categories.nameInput.fill(updated);
    await page.getByRole("button", { name: "Save changes" }).click();
    await categories.expectNotice("Categories updated.");
    await expect(categories.rowFor(updated)).toBeVisible();
  });

  test("CAT-025: edit a QA-created category description", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("EDIT_DESCRIPTION");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Edit" }).click();
    await categories.descriptionInput.fill("Updated QA description");
    await page.getByRole("button", { name: "Save changes" }).click();
    await categories.expectNotice("Categories updated.");
    await expect(categories.rowFor(name)).toContainText("Updated QA description");
  });

  test("CAT-026: cancel editing a QA-created category discards unsaved changes", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("CANCEL_EDIT");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Edit" }).click();
    await categories.nameInput.fill(categoryTestName("UNSAVED"));
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(categories.nameInput).toHaveValue("");
    await expect(categories.rowFor(name)).toBeVisible();
  });

  test("CAT-027: renaming a QA category to an existing name is rejected", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const original = categoryTestName("DUP_EDIT");
    await categories.create(original);
    await categories.expectNotice("Categories created.");
    const otherRow = categories.rows.filter({ hasNotText: original }).first();
    test.skip(await otherRow.count() === 0, "Duplicate-rename test requires another existing category in this business unit.");
    const existing = (await otherRow.locator("td").first().innerText()).trim();
    await categories.rowFor(original).getByRole("button", { name: "Edit" }).click();
    await categories.nameInput.fill(existing);
    await page.getByRole("button", { name: "Save changes" }).click();
    await categories.expectError("A category with this name already exists.");
    await expect(categories.nameInput).toHaveValue(existing);
  });

  test("CAT-028: saving unchanged category values succeeds", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("UNCHANGED");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await categories.expectNotice("Categories updated.");
  });

  test("CAT-029: deactivate a QA-created category", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("DEACTIVATE");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Deactivate" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("will be hidden from active selection lists");
    await dialog.getByRole("button", { name: "Deactivate" }).click();
    await categories.expectNotice("Category deactivated.");
    await categories.status.selectOption("false");
    await expect(categories.rowFor(name)).toContainText("Inactive");
  });

  test("CAT-030: cancelling deactivation leaves QA category active", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("CANCEL_DEACTIVATE");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Deactivate" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    await expect(categories.rowFor(name)).toContainText("Active");
  });

  test("CAT-031: reactivate a QA-created inactive category", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("REACTIVATE");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Deactivate" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Deactivate" }).click();
    await categories.expectNotice("Category deactivated.");
    await categories.status.selectOption("false");
    await categories.rowFor(name).getByRole("button", { name: "Activate" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Activate" }).click();
    await categories.expectNotice("Category activated.");
    await categories.status.selectOption("true");
    await expect(categories.rowFor(name)).toContainText("Active");
  });

  test("CAT-032: category status persists after refresh", async ({ page }) => {
    const categories = new CategoryPage(page);
    await categories.open();
    const name = categoryTestName("PERSIST_STATUS");
    await categories.create(name);
    await categories.expectNotice("Categories created.");
    await categories.rowFor(name).getByRole("button", { name: "Deactivate" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Deactivate" }).click();
    await categories.expectNotice("Category deactivated.");
    await page.reload();
    await categories.status.selectOption("false");
    await expect(categories.rowFor(name)).toContainText("Inactive");
  });
});
