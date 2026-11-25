import { test as base, expect } from "@playwright/test";
import config from "../config/globalConfig.js";

/**
 * ERP-specific fixtures.
 *
 * Keep this separate from the existing demo-application fixtures so the
 * current learning examples continue to run without ERP-specific coupling.
 */
export const test = base.extend({
  erpBaseURL: async ({}, use) => {
    if (!config.baseURL) {
      throw new Error(
        "ERP_BASE_URL (or BASE_URL) is not configured. Copy .env.example to .env.local and set the ERP URL."
      );
    }
    await use(config.baseURL);
  }
});

export { expect, config };