import { test as base, expect } from "@playwright/test";
import config from "../config/globalConfig.js";
import { ErpApiClient } from "../services/api/erpApiClient.js";

export const test = base.extend({
  erpApi: async ({ request, erpBaseURL }, use) => {
    await use(new ErpApiClient(request, config.apiURL || erpBaseURL));
  }
});

export { expect };
