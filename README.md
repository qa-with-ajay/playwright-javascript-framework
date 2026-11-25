# Playwright JavaScript Automation Framework

Reusable JavaScript automation framework using Playwright Test, with optional Cucumber support. Existing learning/demo tests remain separate from the KB ERP fixture entry point.

## Requirements and setup

- Node.js 20.9 or later and npm
- Chromium installed through Playwright
- KB ERP available locally or in a test/staging environment

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
```

On Windows PowerShell use `Copy-Item .env.example .env.local`. Set `BASE_URL` and `API_URL` in the private `.env.local` file. Never commit credentials or private environment files.

## Commands

```bash
npm test
npm run test:headed
npm run test:ui
npm run test:debug
npm run test:smoke
npm run report
npm run cucumber
```

Run one test file with `npx playwright test tests/path/to/test.spec.js`. Select another environment with `ENV=qa npm test` (PowerShell: `$env:ENV="qa"; npm test`). The loader reads `.env.local` by default or `.env.<ENV>`; process/CI variables take precedence.

## ERP test conventions

- Put ERP tests under `tests/erp/`.
- Import `test` and `expect` from `fixtures/erp-fixtures.js`.
- Use the `erpBaseURL` fixture for the application URL.
- Keep test accounts in private environment variables.
- Use unique test data and clean up records where supported.
- Assert business outcomes (stock, balances, invoice/payment state), not only success notifications.

Example:

```js
import { test, expect } from "../../fixtures/erp-fixtures.js";

test("@smoke ERP login page is reachable", async ({ page, erpBaseURL }) => {
  await page.goto(`${erpBaseURL}/login`);
  await expect(page).toHaveURL(/login/);
});
```

Adjust the route and assertion to match the actual ERP login UI.

## Cucumber and reports

Cucumber is optional and runs separately from Playwright Test. Hooks create a browser, context, and page on the Cucumber World (`this`); use regular `function` callbacks in steps to access `this.page`.

Playwright HTML output is opened with `npm run report`. Allure results are written to `allure-results/`; generate and open them with `npm run allure:generate` and `npm run allure:open`.

## Structure

`config/` environment and runtime config · `fixtures/` shared and ERP fixtures · `features/` Cucumber features · `pageobjects/` page objects · `services/` API/domain helpers · `step-definitions/` Cucumber steps · `testdata/` data files · `tests/erp/` ERP tests · `utils/` logging and data utilities.

Playwright Test is the primary runner. Keep demo-site tests isolated from ERP tests. Run `npm install` after package changes so the lockfile is synchronized.

## Phase 2 — KB ERP smoke tests

The initial ERP smoke suite lives in `tests/erp/smoke.spec.js` and covers login UI, unauthenticated route/API protection, invalid credentials, Group Admin dashboard access, product-list API access, and optional Unit Manager access checks.

Configure a private `.env.local` using `.env.example`. Set `BASE_URL` to the KB ERP test/staging URL. Provide a dedicated non-production Group Admin account in `ERP_ADMIN_EMAIL` and `ERP_ADMIN_PASSWORD`; optionally provide a Unit Manager account in the corresponding `ERP_MANAGER_*` variables. The default role codes are `ADMIN` and `UNIT_MANAGER`; override them if the database uses different role codes. Do not use production credentials or commit `.env.local`.

Run only the ERP smoke suite with:

```bash
npx playwright test tests/erp/smoke.spec.js
```

Credential-dependent cases are skipped until their test-account variables are configured. The tests are scaffolding until run against a seeded non-production ERP environment; the Unit Manager denial assertion should be aligned with the deployed route's actual authorization behavior if it differs.
