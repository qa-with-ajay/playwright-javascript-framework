import { expect } from "@playwright/test";

export class CategoryPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Categories", exact: true });
    this.search = page.getByPlaceholder("Search categories");
    this.status = page.getByLabel("Status", { exact: true });
    this.table = page.getByRole("table");
    this.rows = this.table.locator("tbody tr");
    this.nameInput = page.getByLabel("Name", { exact: true });
    this.descriptionInput = page.getByLabel("Description", { exact: true });
    this.addButton = page.getByRole("button", { name: "Add Category", exact: true });
  }

  async open() {
    await this.page.goto("/inventory/categories");
    await expect(this.heading).toBeVisible();
  }

  rowFor(name) {
    return this.rows.filter({ hasText: name });
  }

  async create(name, description = "") {
    await this.nameInput.fill(name);
    if (description) await this.descriptionInput.fill(description);
    await this.addButton.click();
  }

  async expectNotice(message) {
    await expect(this.page.getByRole("status")).toHaveText(message);
  }

  async expectError(message) {
    await expect(this.page.getByRole("alert")).toContainText(message);
  }
}

export function categoryTestName(label = "CATEGORY") {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `QA_SPRINT2_${label}_${suffix}`;
}
