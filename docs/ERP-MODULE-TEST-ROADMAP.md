# KB ERP Suite — End-to-End QA Roadmap and Test Case Catalogue

**ERP repository:** `qa-with-ajay/kb-erp-suite`  
**Automation repository:** `qa-with-ajay/playwright-javascript-framework`  
**ERP branch:** `feature/complete-accounting-system`  
**Automation branch:** `feature/kb-erp-smoke-tests`  
**Application:** local development / dedicated test environment only

> This plan is based on the ERP source inventory and documented routes/features. It is a test-design baseline, not evidence that every scenario has already been automated or passed. Confirm selectors, permissions, API payloads, and seed data against the current application before implementing each UI test.

## 1. Testing objectives

Establish confidence that KB ERP:
- Protects organization and business-unit data boundaries.
- Enforces authentication and server-side permissions.
- Maintains correct inventory quantities, stock valuation, and immutable movement history.
- Produces correct sales, purchase, payment, return, and accounting outcomes.
- Handles retries, concurrent requests, rounding, and failure rollback safely.
- Presents reliable dashboards, reports, invoices, and administration workflows.
- Can be regression-tested repeatably using Playwright and read-only PostgreSQL assertions.

## 2. Execution roadmap

| Phase | Scope | Main deliverables | Exit criteria |
|---|---|---|---|
| 0. Test foundation | Environment, data, auth, fixtures | Dedicated test DB, seeded users/roles, API + DB fixtures, trace/report config | Tests never point at production; setup and cleanup verified |
| 1. P0 security and platform | Login, sessions, permissions, business-unit isolation | Auth and authorization suites | Unauthenticated/unauthorized access blocked; no cross-unit leakage |
| 2. P1 master data | Products, categories, brands, variants, customers, suppliers, locations | CRUD and validation suites | Valid CRUD works; invalid/duplicate records rejected |
| 3. P1 inventory | Opening stock, inward/outward, adjustment, transfer, barcode, import | Stock ledger and balance suites | Ledger and balances reconcile; negative stock prevented |
| 4. P1 sales | GST/non-GST, walk-in/customer, full/partial payments, remnants, idempotency | SALE suite + accounting/stock assertions | Invoice, stock, payment, journal, and balance reconcile |
| 5. P1 purchasing | PO, partial/full receipt, conversions, duplicate invoice | PUR suite | Received quantities/costs and stock are correct |
| 6. P1 returns and settlement | Sales/purchase returns, restock/damaged, reversals, credits | RET/PAY suites | Return limits and compensating postings are correct |
| 7. P1 finance | Accounts, journals, periods, cash/bank, expenses, reconciliation, reports | FIN suite | Journals balance; ledgers and statements reconcile |
| 8. P2 operational workflows | Material processing/remnants, dashboards, print, import | MAT/DASH/PRINT suites | Operational totals and output formats correct |
| 9. P1 admin and resilience | Users, roles, settings, password reset, audit, concurrency | ADMIN/SEC/RES suites | Least privilege and recovery paths verified |
| 10. Release regression | Full critical path, backup/restore, production build | Release report and traceable evidence | All P0/P1 pass; no unresolved critical defects |

### Priority definitions
- **P0 — Critical:** security, tenant isolation, financial integrity, stock integrity, data loss.
- **P1 — High:** core business workflow, calculations, posting, permissions, reversals.
- **P2 — Medium:** usability, printing, filters, notifications, less common configurations.
- **P3 — Low:** cosmetic and non-blocking presentation.

## 3. Automation architecture and conventions

### Suggested test layout

```text
tests/
  auth/
  security/
  admin/
  masters/
    products/
    customers/
    suppliers/
    locations/
  inventory/
  barcode/
  material/
  sales/
  purchases/
  payments/
  returns/
  accounting/
  cash-bank/
  expenses/
  reports/
  dashboards/
  settings/
  resilience/
```

Use stable IDs and descriptive file names, for example:
- `tests/erp/sales/sale-001-gst-cash-e2e.spec.js`
- `tests/erp/sales/sale-002-gst-partial-payment.spec.js`
- `tests/erp/inventory/inv-001-opening-stock.spec.js`

### Test layers
1. **UI E2E:** critical user journeys, role-based navigation, validation, confirmation dialogs.
2. **API integration:** schemas, status codes, authorization, idempotency, transaction boundaries.
3. **Database assertions:** read-only queries for persisted records, stock ledger, journal balance, payment/return balances.
4. **Unit/component:** pure calculations, conversions, GST rounding, validation, permission helpers.
5. **Resilience:** duplicate submits, concurrent stock updates, interrupted operations, retry behavior.

### Data management rules
- Use a dedicated database such as `kb_erp_test`; never run destructive tests against development data containing valuable records or production.
- Use synthetic, uniquely named records with a run identifier.
- Prefer API/DB seeding for setup and UI for the behavior under test.
- Use read-only DB access for assertions. A test setup/cleanup account, if needed, must be separate and tightly scoped.
- Do not hard-code production IDs, invoice numbers, or personal information.
- Avoid tests depending on a particular first product or first location; seed or select a product by explicit attributes.
- Tests that change stock, balances, accounting periods, or status must be serial or use isolated fixtures.
- Record the generated entity IDs in test attachments for diagnosis.
- Never store credentials in Git. Use local environment variables or CI secrets.

### Common assertions
- API response status and response schema.
- UI confirmation and final detail page.
- Correct business-unit ownership of every created record.
- Stock balance equals opening + signed movement deltas.
- Journal total debits equal total credits.
- Invoice total equals subtotal + tax; active payments and returns produce the displayed balance.
- Retry with same idempotency key does not create duplicate records.
- Failed transaction leaves no partial sale/receipt/journal/stock effects.

## 4. Test scenario and test case catalogue

The cases below define the baseline coverage. Expand each case with boundary-value and negative variants during implementation.

## A. Authentication, sessions, and account settings

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| AUTH-001 | P0 | Sign in with valid active user credentials | User is authenticated and redirected to dashboard |
| AUTH-002 | P1 | Sign in with incorrect password | Clear error; no session created |
| AUTH-003 | P1 | Sign in with inactive user | Access denied |
| AUTH-004 | P0 | Open protected route without session | Redirect to login / API returns 401 |
| AUTH-005 | P1 | Sign out then revisit protected route | Session invalidated; login required |
| AUTH-006 | P1 | Expired/invalid session token | Access rejected |
| AUTH-007 | P1 | Request password reset for registered and unknown email | Non-enumerating response; email sent only where applicable |
| AUTH-008 | P1 | Use expired or already-used reset token | Reset rejected |
| AUTH-009 | P1 | Reset password successfully | New password works; old password fails; old sessions invalidated |
| SET-001 | P2 | Update profile fields | Updated profile persists |
| SET-002 | P1 | Change password with wrong current password | Rejected without changing password |

## B. Organization, business units, users, roles, permissions

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| SEC-001 | P0 | Unit user requests another unit's product/customer/sale by ID | No data leakage; 403/404 |
| SEC-002 | P0 | Unit user changes businessUnitId in API payload | Server ignores/rejects forged scope |
| SEC-003 | P0 | User without billing.manage posts a sale | 403; no sale, stock, payment, or journal created |
| SEC-004 | P0 | User without inventory.manage posts stock adjustment | 403; no stock movement |
| SEC-005 | P1 | Navigation for role with restricted permissions | Only permitted navigation is visible |
| SEC-006 | P0 | Call restricted API directly despite hidden navigation | Server-side permission blocks operation |
| ADMIN-001 | P1 | Group admin views group dashboard | Sees authorized active business units |
| ADMIN-002 | P1 | Unit manager attempts to access unassigned unit | Access denied |
| ADMIN-003 | P1 | Create user and assign active role + unit | User can access only assigned scope |
| ADMIN-004 | P1 | Deactivate user | User cannot start/continue a valid session |
| ADMIN-005 | P1 | Attempt to deactivate/remove last active administrator | Operation blocked |
| ADMIN-006 | P1 | Create custom role with selected permissions | Effective permissions match selection |
| ADMIN-007 | P1 | Modify role permissions | Subsequent API requests reflect updated access |
| ADMIN-008 | P1 | Attempt to edit protected built-in system role | Rejected |
| ADMIN-009 | P1 | Change user/role assignment | Audit log records actor, action, entity, and scope |

## C. Product catalogue, categories, brands, variants

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| PROD-001 | P1 | Create valid standard product with SKU, price, GST, unit | Product saved and listed |
| PROD-002 | P1 | Create material product with measurement unit | Product saved with material configuration |
| PROD-003 | P1 | Create product with variants and attributes | Variants persist and are selectable |
| PROD-004 | P1 | Create duplicate SKU/barcode in same unit | Duplicate rejected |
| PROD-005 | P1 | Submit invalid price, GST rate, unit, or required fields | Validation errors; no record created |
| PROD-006 | P1 | Edit product details and price | Changes persist; historical transaction snapshots remain unchanged |
| PROD-007 | P1 | Deactivate product with historical transactions | Product unavailable for new transactions but history remains |
| PROD-008 | P2 | Search, filter, sort, paginate catalogue | Correct records and page counts |
| PROD-009 | P1 | Create/edit category and brand | Valid classification saved; duplicate rules enforced |
| PROD-010 | P1 | Cross-unit product/category reference | Rejected |

## D. Barcode and product scanning

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| BAR-001 | P1 | Generate internal barcode | Unique internal code created and labelled as internal |
| BAR-002 | P1 | Search product using SKU | Correct product returned |
| BAR-003 | P1 | Scan internal barcode using keyboard-wedge scanner | Correct product/variant found |
| BAR-004 | P2 | Scan manufacturer barcode | Existing mapped product found |
| BAR-005 | P1 | Scan same product twice in sales entry | Quantity increments; no duplicate line |
| BAR-006 | P1 | Scan unknown barcode | Clear not-found feedback; no unintended line |
| BAR-007 | P2 | Camera scan with permission granted/denied | Works when allowed; graceful fallback when denied |
| BAR-008 | P2 | Print barcode labels | Label includes correct code and product identity |

## E. Stock locations and inventory movements

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| INV-001 | P1 | Create stock location | Location available in unit |
| INV-002 | P1 | Record opening stock | Balance and OPENING ledger movement match |
| INV-003 | P1 | Record inward stock | Balance increases by exact quantity |
| INV-004 | P1 | Record outward stock | Balance decreases by exact quantity |
| INV-005 | P0 | Outward movement exceeds available stock | Rejected; no negative balance |
| INV-006 | P1 | Adjust stock upward/downward with reason | Correct signed movement and audit record |
| INV-007 | P1 | Transfer stock between locations | Source decreases and destination increases equally |
| INV-008 | P0 | Transfer to invalid/cross-unit location | Rejected; no partial movement |
| INV-009 | P1 | Concurrent outward requests compete for final units | At most available quantity succeeds; no negative stock |
| INV-010 | P1 | Retry movement with same idempotency key | One movement only |
| INV-011 | P1 | View stock ledger and current balances | Ledger sum reconciles to balance |
| INV-012 | P2 | Low-stock threshold reached | Correct low-stock indicator/notification |
| INV-013 | P1 | Import valid CSV products and optional inward stock | Valid rows imported with expected counts |
| INV-014 | P1 | Import malformed/duplicate CSV | Row errors reported; no silent partial corruption |
| INV-015 | P2 | Filter stock by location/product/variant | Correct balances and pagination |

## F. Material processing and remnants

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| MAT-001 | P1 | Cut material using standard stock and create one remnant | Source stock decreases; remnant created with dimensions and quantity |
| MAT-002 | P1 | Cut material and create multiple remnants | All outputs recorded; quantities reconcile |
| MAT-003 | P1 | Process using an existing remnant | Source remnant reduced/consumed correctly |
| MAT-004 | P0 | Process more material than available | Rejected; no partial processing |
| MAT-005 | P1 | Transfer remnant to another location | Location and movement history update |
| MAT-006 | P1 | Sell eligible remnant | Remnant quantity/status updates and sale allocation references it |
| MAT-007 | P1 | Consume or mark remnant as waste | Status and history reflect operation |
| MAT-008 | P1 | Attempt to sell unavailable/consumed remnant | Rejected |
| MAT-009 | P1 | Use remnant with incompatible unit/variant | Rejected |
| MAT-010 | P1 | Reverse operation where supported | Compensating stock/remnant movement restores correct state |

## G. Sales and billing

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| SALE-001 | P0 | GST invoice, walk-in customer, full cash payment | Invoice, stock deduction, payment and journals created once |
| SALE-002 | P0 | GST invoice, identified customer, partial cash payment | Customer saved, partial payment posted, correct balance due |
| SALE-003 | P1 | Non-GST walk-in invoice, full payment | Tax is zero; invoice and stock correct |
| SALE-004 | P1 | GST invoice paid by UPI/card/bank transfer/cheque/other | Correct payment method and ledger mapping |
| SALE-005 | P1 | Existing customer checkout | Customer relation and snapshot correct |
| SALE-006 | P1 | New customer saved during checkout | Customer created only when sale commits |
| SALE-007 | P1 | Walk-in attempts partial/credit payment | Rejected |
| SALE-008 | P1 | Customer lookup by exact and partial mobile/name | Correct match list; ambiguous matches selectable |
| SALE-009 | P1 | Multi-line invoice with different GST rates | Line taxes and invoice totals rounded correctly |
| SALE-010 | P1 | Product with variant and supported sales unit | Correct variant, conversion and stock allocation |
| SALE-011 | P1 | Sale allocated across standard stock and remnant | Both sources reduced correctly |
| SALE-012 | P0 | Sale quantity exceeds stock | Rejected; no sale/payment/journal persisted |
| SALE-013 | P0 | Double-click submit / retry same idempotency key | One invoice and one set of postings |
| SALE-014 | P0 | Stock changes between product selection and checkout | Conflict response; no stale/negative stock |
| SALE-015 | P1 | Initial payment exceeds invoice total | Rejected; entire sale transaction rolls back |
| SALE-016 | P1 | Invalid customer or inactive location/product | Rejected with no side effects |
| SALE-017 | P1 | Search invoice history and open invoice detail | Correct invoice/customer/line/payment/return information |
| SALE-018 | P1 | Verify sale journal | Dr receivable, Cr sales, Cr output GST, Dr COGS, Cr inventory; balanced |
| SALE-019 | P1 | Verify cash/UPI payment journal | Debit mapped cash/bank account, credit receivable; balanced |
| SALE-020 | P1 | Recalculate sale balances after active/reversed payments and returns | UI totals match source records |

## H. Purchases and goods receiving

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| PUR-001 | P1 | Create GST purchase order for supplier | PO and line totals saved |
| PUR-002 | P1 | Create non-GST purchase order | Tax is zero |
| PUR-003 | P1 | Receive full PO quantity | Receipt posted; PO status RECEIVED |
| PUR-004 | P1 | Receive partial PO quantity | PO status PARTIALLY_RECEIVED; outstanding quantity correct |
| PUR-005 | P1 | Receive remaining quantity in second receipt | Cumulative quantity correct; PO status RECEIVED |
| PUR-006 | P0 | Receive quantity greater than outstanding PO quantity | Rejected |
| PUR-007 | P1 | Purchase in BOX/ROLL and stock in base units | Conversion, precision, rounding, and cost correct |
| PUR-008 | P1 | Duplicate supplier invoice number | Duplicate receipt/invoice rejected |
| PUR-009 | P1 | Receive variant-specific items | Correct variant stock increased |
| PUR-010 | P0 | Supplier/product/location belongs to another unit | Rejected |
| PUR-011 | P0 | Failure during receipt posting | No partial receipt, stock movement, or journal |
| PUR-012 | P1 | Verify purchase receipt accounting and stock valuation | Inventory, input tax/payable mapping and stock cost reconcile |

## I. Customer/supplier masters, payments, balances

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| PARTY-001 | P1 | Create/edit customer | Valid record saved in active unit |
| PARTY-002 | P1 | Search customer by name/mobile | Correct results |
| PARTY-003 | P1 | Deactivate customer with history | Historical records remain; new selection blocked as designed |
| PARTY-004 | P1 | Create/edit supplier | Valid record saved in active unit |
| PARTY-005 | P1 | Duplicate customer/supplier detection | Duplicate rules and conflict message correct |
| PAY-001 | P1 | Record customer collection against invoice | Paid amount increases and due decreases |
| PAY-002 | P1 | Record supplier payment against receipt | Paid amount increases and payable decreases |
| PAY-003 | P1 | Record multiple partial payments | Cumulative paid and remaining balance correct |
| PAY-004 | P0 | Payment exceeds outstanding balance | Rejected |
| PAY-005 | P0 | Retry payment with same idempotency key | One payment and one journal only |
| PAY-006 | P1 | Reverse a payment | Payment excluded from active paid total; reversal journal balances |
| PAY-007 | P1 | Payment reference and method persistence | Exact reference/method displayed |
| PAY-008 | P1 | Customer overpayment/credit balance | Credit displayed accurately; no negative due |
| PAY-009 | P1 | Supplier credit after return/overpayment | Credit balance calculated correctly |

## J. Sales returns and purchase returns

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| RET-001 | P1 | Return sold quantity as restock | Return credit note and stock inward created |
| RET-002 | P1 | Return sold quantity as damaged | Credit note created; damaged disposition does not inflate sellable stock |
| RET-003 | P0 | Return quantity exceeds original sold/remaining returnable quantity | Rejected |
| RET-004 | P1 | Partial return across multiple invoice lines | Line and invoice credit totals correct |
| RET-005 | P1 | Return sale with prior partial payment | Customer credit/due recomputed correctly |
| RET-006 | P1 | Reverse sales return | Compensating movement and journal; original history retained |
| RET-007 | P1 | Return purchased goods to supplier | Purchase debit note and stock outward correct |
| RET-008 | P0 | Purchase return exceeds available eligible stock | Rejected |
| RET-009 | P1 | Reverse purchase return | Compensating movement restores correct stock/account balance |
| RET-010 | P0 | Duplicate return submission | One return only |
| RET-011 | P1 | Confirm returns create account credit, not automatic cash refund | Credit shown; no unrequested cash refund transaction |

## K. Financial accounting and reports

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| FIN-001 | P1 | View chart of accounts | Correct unit accounts and hierarchy |
| FIN-002 | P1 | Create/edit permitted non-system account | Valid account saved |
| FIN-003 | P1 | Attempt to modify protected/system account | Restricted |
| FIN-004 | P0 | Create journal with unbalanced debit/credit | Rejected |
| FIN-005 | P1 | Create balanced manual journal | Journal posted with correct lines |
| FIN-006 | P1 | Duplicate journal source/idempotency key | Duplicate posting prevented |
| FIN-007 | P0 | Post journal outside an OPEN accounting period | Rejected |
| FIN-008 | P1 | Close accounting period | Period closed; new entries in period blocked |
| FIN-009 | P1 | Reverse posted journal | Reversal journal balances; original remains auditable |
| FIN-010 | P1 | General ledger for account/date range | Opening, movement, closing totals reconcile |
| FIN-011 | P0 | Trial balance for period | Total debits equal total credits |
| FIN-012 | P1 | Profit & Loss for date range | Income/expense totals match ledger |
| FIN-013 | P1 | Balance Sheet as of date | Assets = liabilities + equity |
| FIN-014 | P1 | Verify sales accounting posting | Sales, output GST, receivable, COGS and inventory correctly posted |
| FIN-015 | P1 | Verify purchase accounting posting | Inventory/input tax/payable postings match purchase design |
| FIN-016 | P1 | Verify returns and reversals accounting | Compensating entries and account balances reconcile |
| FIN-017 | P1 | Reports scoped to unit and date filters | No cross-unit data; inclusive/exclusive date behavior correct |

## L. Cash, bank, expenses, reconciliation

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| CB-001 | P1 | Create cash/bank/UPI payment account linked to ledger | Valid account saved |
| CB-002 | P1 | Record receipt transaction | Cash/bank balance and journal increase correctly |
| CB-003 | P1 | Record payment transaction | Cash/bank balance and journal decrease correctly |
| CB-004 | P1 | Transfer between payment accounts | Source/destination updated equally; transfer journal balanced |
| CB-005 | P0 | Transfer to inactive or same invalid destination | Rejected |
| CB-006 | P1 | Create bank reconciliation with matching statement | Difference zero; reconciliation can be finalized |
| CB-007 | P1 | Reconcile with unmatched transactions/difference | Difference and unmatched items clearly reported |
| CB-008 | P0 | Add same cash-bank transaction to multiple reconciliations | Duplicate reconciliation prevented |
| EXP-001 | P1 | Create expense category mapped to expense account | Category saved |
| EXP-002 | P1 | Record expense paid from cash/bank account | Expense and balanced journal created |
| EXP-003 | P0 | Record expense with invalid/inactive category or payment account | Rejected |
| EXP-004 | P1 | Verify expense in P&L and cash/bank | Both reports reflect expense correctly |
| EXP-005 | P1 | Duplicate expense submission | No duplicate expense/journal |

## M. Dashboards, group reporting, invoice printing

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| DASH-001 | P1 | Unit dashboard after sale and purchase | KPIs match source transactions |
| DASH-002 | P1 | Low-stock dashboard indicator | Matches configured threshold and stock balance |
| DASH-003 | P1 | Gross profit calculation | Sales margin matches cost snapshots; expenses excluded as documented |
| DASH-004 | P1 | Group dashboard with multiple units | Unit totals and consolidated totals correct |
| DASH-005 | P0 | Group totals across different currencies | Currency totals remain separate; unlike currencies not added |
| DASH-006 | P1 | User without group permission opens group dashboard/API | Access denied |
| PRINT-001 | P2 | Print A4 invoice | All invoice/customer/tax/total details visible |
| PRINT-002 | P2 | Print 80 mm and 58 mm thermal invoices | Layout fits selected paper width |
| PRINT-003 | P1 | Print GST and non-GST invoices | Correct tax labels and amounts |
| PRINT-004 | P2 | Change print format and reload | Saved format preference restored |
| PRINT-005 | P1 | Print invoice after return/payment | Invoice detail reflects current supported balances and history |

## N. Resilience, audit, performance, and release

| ID | Priority | Scenario / test case | Expected result |
|---|---|---|---|
| RES-001 | P0 | Double-submit sale/receipt/payment | Idempotent; no duplicate business records |
| RES-002 | P0 | Concurrent sales for last available stock | No negative stock; consistent conflict response |
| RES-003 | P0 | Force accounting posting failure after sale creation begins | Entire business transaction rolls back |
| RES-004 | P1 | Database temporarily unavailable | Controlled error; no false success |
| RES-005 | P1 | Refresh browser during save | User can determine outcome; retry does not duplicate |
| RES-006 | P1 | Large list search and pagination | Correct stable results and acceptable response time |
| RES-007 | P2 | Large product catalogue search | Search remains responsive; no duplicate/missing pages |
| AUD-001 | P1 | Create/update/deactivate key master records | Audit captures actor, action, entity, timestamp |
| AUD-002 | P1 | Post/reverse sale, payment, return, journal | Audit trail links original and compensating transactions |
| REL-001 | P0 | Run all P0 security and integrity tests | All pass |
| REL-002 | P1 | Run complete P1 smoke/regression suite | All pass or approved exceptions documented |
| REL-003 | P1 | Production build and migration deploy in staging | Build and migrations succeed |
| REL-004 | P0 | Restore a recent backup to isolated database | Restore verified; critical records queryable |

## 5. End-to-end business process chains

Run these after module-level tests pass.

### Chain 1 — Purchase to sale to financial statements
1. Create supplier and product.
2. Create purchase order.
3. Receive goods and verify stock/cost.
4. Create customer and sell goods.
5. Record full/partial collection.
6. Verify sale, stock, receivable, cash/bank, GST, COGS, and inventory journals.
7. Run trial balance, P&L, balance sheet.

### Chain 2 — Material cutting and remnant sale
1. Create material product and opening stock.
2. Process a cut from standard stock.
3. Verify output remnant dimensions and quantity.
4. Transfer remnant if required.
5. Sell part/all of remnant.
6. Verify standard/remnant balances, allocation records, cost, and invoice.

### Chain 3 — Return and reversal
1. Complete a purchase and sale.
2. Return part of sale as restock and part as damaged in separate cases.
3. Return purchased stock to supplier.
4. Reverse one return.
5. Verify stock ledger, account credits, journals, and invoice/receipt balances.

### Chain 4 — Multi-unit authorization
1. Create users with group, unit-manager, accountant, inventory-manager, and cashier roles.
2. Seed records in at least two units.
3. Attempt UI and direct API access across units.
4. Verify only assigned permissions and data are available.
5. Inspect audit logs for administrative changes.

## 6. Recommended implementation order (test files)

| Sprint | Suggested test files |
|---|---|
| Sprint 1 | `auth-001-login.spec.js`, `sec-001-business-unit-isolation.spec.js`, `admin-001-role-permissions.spec.js` |
| Sprint 2 | `prod-001-product-crud.spec.js`, `party-001-customer-supplier.spec.js`, `inv-001-opening-stock.spec.js` |
| Sprint 3 | `inv-002-stock-movements.spec.js`, `inv-003-transfer-concurrency.spec.js`, `bar-001-barcode-lookup.spec.js` |
| Sprint 4 | `sale-001-gst-cash-e2e.spec.js`, `sale-002-gst-partial-payment.spec.js`, `sale-003-non-gst-cash.spec.js`, `sale-004-idempotency.spec.js` |
| Sprint 5 | `pur-001-purchase-order-receipt.spec.js`, `pur-002-partial-receipt.spec.js`, `pur-003-unit-conversion.spec.js` |
| Sprint 6 | `pay-001-customer-collection.spec.js`, `ret-001-sales-return.spec.js`, `ret-002-purchase-return.spec.js` |
| Sprint 7 | `fin-001-journal-voucher.spec.js`, `fin-002-trial-balance.spec.js`, `cb-001-cash-bank.spec.js`, `exp-001-expense.spec.js` |
| Sprint 8 | `mat-001-processing-remnant.spec.js`, `dash-001-unit-dashboard.spec.js`, `print-001-invoice-formats.spec.js` |
| Sprint 9 | Full regression, performance baselines, restore drill, release checklist |

## 7. Definition of Done for each test case

A test is complete only when:
- It has a unique ID, clear preconditions, deterministic test data, and expected results.
- It asserts both the user-visible outcome and persisted backend outcome where applicable.
- It checks negative side effects (no unintended rows or balance changes) for rejected operations.
- It is isolated from production and safe to rerun.
- It captures useful Playwright trace, screenshot, and response details on failure.
- It passes locally against the documented test environment and is included in the correct CI job.
- Any skipped condition is explicit and reported; a skipped test is not counted as passed.

## 8. First execution checklist

- [ ] Confirm dedicated PostgreSQL test database and credentials.
- [ ] Confirm migrations and deterministic seed data.
- [ ] Seed users for Group Admin, Unit Manager, Accountant, Inventory Manager, Cashier, and restricted user.
- [ ] Seed at least two active business units.
- [ ] Seed standard and material products, variants, GST rates, prices, units/conversions, and stock.
- [ ] Seed customer, supplier, stock locations, open accounting period, accounts, and payment accounts.
- [ ] Verify test runner points to localhost/staging and DB name includes the test safety guard.
- [ ] Run existing SALE-001 and SALE-002, review any selector/data assumptions, and capture traces.
- [ ] Implement security and stock-integrity P0 tests before broadening UI coverage.
- [ ] Publish a pass/fail/skip report for each sprint.

## 9. Coverage and release reporting template

For each run, report:
- Total / passed / failed / skipped tests.
- Results by module and priority.
- Defects with severity, reproduction steps, API response, trace, and database evidence.
- Environment, commit SHA, database seed version, and browser version.
- Open risks and explicit release blockers.

**Release gate:** Do not sign off while any P0 test fails, financial/stock reconciliation is unexplained, tenant isolation is unproven, or a failed transaction leaves partial business records.
