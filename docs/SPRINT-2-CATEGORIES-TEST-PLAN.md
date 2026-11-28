# Sprint 2 — Categories UI Functional Test Catalogue

**Application route:** `/inventory/categories`  
**Source baseline:** KB ERP `feature/complete-accounting-system`  
**Automation:** `tests/erp/master-data/categories/category-functional.spec.js`  
**Page object:** `pageobjects/CategoryPage.js`

## Execution safety

- Run read-only cases first against the development environment.
- Use dedicated non-production accounts. Do not place credentials in source control.
- CAT-015–CAT-032 change category data. They are skipped unless `ENABLE_CATEGORY_MUTATION_TESTS=true` is set.
- Enable mutation cases only after confirming a dedicated QA business unit and accepting that the test-created categories remain in the database. No cleanup job is implemented.
- CAT-035 requires a confirmed second business unit and an agreed UI switcher flow; it is currently a documented manual scenario and intentionally skipped in automation.
- A test skipped due to missing credentials/data is not a pass.

## Test cases

| ID | Scenario / precondition | Steps | Expected result | Priority |
|---|---|---|---|---|
| CAT-001 | Signed-in user with `inventory.read` | Open Inventory → Categories | Categories page and heading load | P1 |
| CAT-002 | Inventory reader | Inspect controls and table | Search, Status, Name, Description, Status columns; Add form for manager | P2 |
| CAT-003 | Signed out | Open `/inventory/categories` | Redirect to login | P1 |
| CAT-004 | Signed in without `inventory.read` | Open Categories route | Access denied / redirected to dashboard | P1 |
| CAT-005 | Reader with a selected business unit | Open Categories | Only categories in selected unit are listed; total is displayed | P1 |
| CAT-006 | At least two categories | Read displayed names | Names sorted alphabetically | P2 |
| CAT-007 | At least one category exists | Search its full name | Matching category is shown | P1 |
| CAT-008 | At least one category exists | Search a substring | Matching category is shown | P1 |
| CAT-009 | At least one category exists | Search with changed letter case | Search still finds the category | P2 |
| CAT-010 | Reader | Search for a unique non-existent value | “No categories found.” appears | P2 |
| CAT-011 | Reader | Search for no match, then clear search | Original list and count return | P2 |
| CAT-012 | Active categories exist | Select Active status | Every returned row has Active status | P1 |
| CAT-013 | Inactive categories exist | Select Inactive status | Every returned row has Inactive status | P1 |
| CAT-014 | Reader | Select All status | Both statuses may be included; All remains selected | P1 |
| CAT-015 | Manager; mutation opt-in | Create unique QA category | Category is created and defaults to Active | P0 |
| CAT-016 | Manager; mutation opt-in | Create category with description | Description is saved and displayed | P1 |
| CAT-017 | Manager; mutation opt-in | Create category without description | Category is created with empty description | P1 |
| CAT-018 | Manager; mutation opt-in | Submit form with empty name | Browser required validation blocks submission | P1 |
| CAT-019 | Manager; mutation opt-in | Submit whitespace-only name | Server rejects trimmed empty name; no category created | P1 |
| CAT-020 | Manager; mutation opt-in | Create category, then create same name again | Duplicate rejected with conflict message; one record remains | P0 |
| CAT-021 | Manager; mutation opt-in | Enter more than 100 characters in name | UI limits input to 100 characters | P2 |
| CAT-022 | Manager; mutation opt-in | Enter more than 500 characters in description | UI limits input to 500 characters | P2 |
| CAT-023 | Manager; mutation opt-in | Create name with leading/trailing spaces | Saved name is trimmed | P2 |
| CAT-024 | Manager; mutation opt-in | Create QA category, edit name, save | New name is saved and listed | P1 |
| CAT-025 | Manager; mutation opt-in | Create QA category, edit description | Updated description is saved | P2 |
| CAT-026 | Manager; mutation opt-in | Start editing QA category, change value, Cancel | Unsaved changes are discarded | P1 |
| CAT-027 | Manager; mutation opt-in | Rename QA category to an existing name | Duplicate rejected; original record unchanged | P1 |
| CAT-028 | Manager; mutation opt-in | Open edit form and save unchanged values | Update succeeds without corrupting the record | P3 |
| CAT-029 | Manager; mutation opt-in | Deactivate QA-created category and confirm | Category becomes Inactive and is absent from Active filter | P1 |
| CAT-030 | Manager; mutation opt-in | Open deactivate confirmation and Cancel | Category remains Active | P1 |
| CAT-031 | Manager; mutation opt-in | Activate QA-created inactive category | Category becomes Active | P1 |
| CAT-032 | Manager; mutation opt-in | Deactivate QA category, reload page | Inactive state persists | P1 |
| CAT-033 | User with `inventory.read` but not `inventory.manage` | Open Categories | List visible; Add/Edit/Activate/Deactivate controls hidden | P0 |
| CAT-034 | User with `inventory.manage` | Open Categories | Add form and row management actions visible | P1 |
| CAT-035 | User with access to two business units; second unit confirmed | Create/view category in Unit A, switch to Unit B | Unit A category is not exposed in Unit B unless separately created | P0 |
| CAT-036 | More than 10 categories in selected unit | Click Next, then Previous | Page advances and returns; boundary buttons are disabled appropriately | P2 |
| CAT-037 | More than 10 categories | Move to page 2, then search | Search resets pagination to page 1 | P2 |
| CAT-038 | More than 10 categories | Move to page 2, change status filter | Filter change resets pagination to page 1 | P2 |
| CAT-039 | Manager; at least one active category | Open Deactivate confirmation, press Escape | Dialog closes; category remains Active | P2 |
| CAT-040 | Manager; at least one active category | Open confirmation, click backdrop | Dialog closes; category remains Active | P2 |

## Automation configuration

Private `.env.local` variables:

```dotenv
BASE_URL=http://localhost:3000
ERP_CATEGORY_ADMIN_ROLE_CODE=GROUP_ADMIN
ERP_CATEGORY_ADMIN_EMAIL=
ERP_CATEGORY_ADMIN_PASSWORD=

ERP_CATEGORY_READONLY_ROLE_CODE=UNIT_VIEWER
ERP_CATEGORY_READONLY_EMAIL=
ERP_CATEGORY_READONLY_PASSWORD=

ERP_CATEGORY_NO_INVENTORY_ROLE_CODE=UNIT_VIEWER
ERP_CATEGORY_NO_INVENTORY_EMAIL=
ERP_CATEGORY_NO_INVENTORY_PASSWORD=

ENABLE_CATEGORY_MUTATION_TESTS=false
```

The role codes above are defaults/placeholders. Use role assignments that actually exist in the target database; a role name alone does not guarantee the required permission set.

## Commands (PowerShell)

```powershell
npm run test:categories
npm run test:categories -- --grep "CAT-001"
npm run test:categories:headed
```

To opt into data-changing tests after the QA business unit is approved:

```powershell
$env:ENABLE_CATEGORY_MUTATION_TESTS="true"
npm run test:categories
```

The suite has not been executed by this commit. Run it locally and review skips/failures before treating the catalogue as verified.
