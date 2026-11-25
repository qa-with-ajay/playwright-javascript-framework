import { Given, When, Then } from "@cucumber/cucumber";

Given("the user is on the Google homepage", async function () {
  await this.page.goto("https://www.google.com");
});

When("the user enters {string} in the search field", async function (keyword) {
  await this.page.locator('input[name="q"]').fill(keyword);
  await this.page.locator('input[name="q"]').press("Enter");
});

Then("results related to {string} should be displayed", async function (keyword) {
  await this.page.getByRole("main").getByText(keyword, { exact: false }).first().waitFor();
});