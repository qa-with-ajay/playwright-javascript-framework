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

## Phase 3 — Sales API and PostgreSQL verification foundation

New ERP support files:

- `services/api/erpApiClient.js` — reusable API wrapper.
- `fixtures/api-fixtures.js` — API fixture for tests.
- `services/database/postgresClient.js` — parameterized, read-only PostgreSQL query helper.
- `fixtures/db-fixtures.js` — opt-in database fixture with a test-database name guard.
- `tests/erp/sales/sales-api.spec.js` — unauthenticated sales API access checks.
- `tests/erp/database/database-connectivity.spec.js` — optional read-only database connectivity check.

Install the new PostgreSQL driver and synchronize the npm lockfile:

```bash
npm install
```

Database verification is opt-in. Create a separate local database such as `kb_erp_test`; do not point automation at the working development or production database. Add the connection string to the private `.env.local` and set:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/kb_erp_test
ENABLE_DB_VERIFICATION=true
```

The database fixture refuses database names that do not contain `test`, and exposes SELECT-only queries inside read-only transactions. It is not a substitute for a dedicated least-privilege PostgreSQL user. Create one with read-only grants for the tables used by assertions.

Run the new foundation checks:

```bash
npx playwright test tests/erp/sales/sales-api.spec.js
npx playwright test tests/erp/database/database-connectivity.spec.js
```

## Phase 4 — SALE-001 GST cash sale end-to-end

Added `tests/erp/sales/sale-001-gst-cash-e2e.spec.js`. This scenario:

1. Signs in through the ERP login UI.
2. Discovers an active stock location and a GST-taxable, non-variant product with standard stock and a non-zero average cost.
3. Creates a one-unit GST cash invoice through the sales UI.
4. Verifies the persisted sale, payment, invoice line, stock balance, stock movement and stock ledger.
5. Verifies the posted SALE and PAYMENT journals independently by account code and amount.

Configure a user with both `billing.read` and `billing.manage` permissions. You can set `ERP_SALES_EMAIL`, `ERP_SALES_PASSWORD` and `ERP_SALES_ROLE_CODE`; otherwise the test falls back to the Group Admin credentials. The scenario chooses a walk-in customer and pays the invoice in full.

Before running database-backed tests, create and seed a dedicated test database with an open accounting period, required system accounts and payment account mapping. Do not use a development or production database. In the private `.env.local`, set `DATABASE_URL` to a database whose name contains `test`, and set `ENABLE_DB_VERIFICATION=true`.

Run the scenario:

```bash
npx playwright test tests/erp/sales/sale-001-gst-cash-e2e.spec.js
```

The test is data-driven: it discovers its location and eligible product at runtime and skips with a clear reason if the required fixture data is not present. It does not seed or mutate test data directly; the only business mutation is the sale created through the ERP UI.
