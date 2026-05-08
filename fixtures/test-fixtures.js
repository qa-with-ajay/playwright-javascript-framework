import { test as base, expect } from '@playwright/test';
import config from '../config/globalConfig';
import logger from '../utils/logger'

// Import your page objects
import { LoginPage } from '../pageobjects/rahulshettyacademy/LoginPage';
import { DashboardPage } from '../pageobjects/rahulshettyacademy/DashboardPage';
import { CartPage } from '../pageobjects/rahulshettyacademy/CartPage';
import { CheckoutPage } from '../pageobjects/rahulshettyacademy/CheckoutPage';
import { ConfirmationPage } from '../pageobjects/rahulshettyacademy/ConfirmationPage';
import { OrderHistoryPage } from '../pageobjects/rahulshettyacademy/OrderHistoryPage';


// Extend the base test with fixtures for page objects
const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  CartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  CheckoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  ConfirmationPage: async ({ page }, use) => {
    await use(new ConfirmationPage(page));
  },

  OrderHistoryPage: async ({ page }, use) => {
    await use(new OrderHistoryPage(page));
  },
});

export { test, expect, config, logger};
