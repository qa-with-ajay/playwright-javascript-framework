# Sprint 1 — Authentication, Authorization & Multi-Business-Unit Security

**Automation branch:** `feature/kb-erp-smoke-tests`  
**ERP branch under test:** `feature/complete-accounting-system`  
**Target:** dedicated local or staging test environment only.

## Implemented test files

| Area | Test file | Coverage |
|---|---|---|
| Authentication | `tests/erp/auth/authentication.spec.js` | Login form, invalid credentials, no-session behavior, protected page/API responses, valid assigned Group Admin session |
| Authorization | `tests/erp/security/authorization.spec.js` | Unauthenticated admin API access, Group Admin user/role access, Unit Manager denied admin APIs/page, billing permission denied |
| Business-unit isolation | `tests/erp/security/business-unit-isolation.spec.js` | Assigned vs unassigned unit switch, cross-unit product ID read, malformed/forged unit switch payload, unauthenticated unit enumeration/switch |
| Shared helper | `tests/erp/helpers/auth.js` | Real UI login and credential preconditions |

These are initial automated cases, not the complete Sprint 1 catalogue. Password reset, inactive-account lifecycle, explicit sign-out/session invalidation, permission changes during an active session, and more resource-by-resource tenant checks remain follow-up coverage.

## Environment setup

Copy `.env.example` to `.env.local` and configure:

- `BASE_URL` for the ERP instance under test.
- `ERP_ADMIN_EMAIL`, `ERP_ADMIN_PASSWORD`, `ERP_ADMIN_ROLE_CODE` for an assigned Group Admin test account.
- `ERP_MANAGER_EMAIL`, `ERP_MANAGER_PASSWORD`, `ERP_MANAGER_ROLE_CODE` for a Unit Manager test account.
- `ERP_MANAGER_BUSINESS_UNIT_ID` for the manager's assigned test unit.
- `ERP_FORBIDDEN_BUSINESS_UNIT_ID` for a different test unit.
- `ERP_CROSS_UNIT_PRODUCT_ID` for a product owned by that different test unit.

Use synthetic test users and test records only. Never commit credentials or use production IDs.

## Run

```powershell
npm run test:sprint1
npm run test:auth
npm run test:security
```

Run headed while debugging:

```powershell
npx playwright test tests/erp/auth tests/erp/security --headed
```

## Safety and execution notes

- The current suite performs no intentional data mutations. The sale API check sends an invalid empty payload and expects the permission check to reject it before validation.
- PostgreSQL verification is optional and disabled by default. The read-only helper now accepts only a database whose name has a standalone `test` segment, for example `kb_erp_test`; it rejects development/production database names and does not log connection strings.
- No test result is claimed until the suite is run against the configured ERP environment.
- If a scenario is skipped, check the Playwright report for the missing environment variable reason.
- A 404 for a cross-unit product is the expected non-disclosure behavior for the current product detail endpoint. If the API contract changes to 403, update the assertion to the documented security contract.
