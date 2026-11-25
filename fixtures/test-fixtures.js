import { test as base, expect } from "@playwright/test";
import config from "../config/globalConfig.js";
import logger from "../utils/logger.js";

import { LoginPage } from "../pageobjects/rahulshettyacademy/LoginPage.js";
import { DashboardPage } from "../pageobjects/rahulshettyacademy/DashboardPage.js";
import { CartPage } from "../pageobjects/rahulshettyacademy/CartPage.js";
import { CheckoutPage } from "../pageobjects/rahulshettyacademy/CheckoutPage.js";
import { ConfirmationPage } from "../pageobjects/rahulshettyacademy/ConfirmationPage.js";
import { OrderHistoryPage } from "../pageobjects/rahulshettyacademy/OrderHistoryPage.js";

const test = base.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  CartPage: async ({ page }, use) => use(new CartPage(page)),
  CheckoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  ConfirmationPage: async ({ page }, use) => use(new ConfirmationPage(page)),
  OrderHistoryPage: async ({ page }, use) => use(new OrderHistoryPage(page))
});

export { test, expect, config, logger };