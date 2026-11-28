// tests/login.spec.js
import { test, expect } from '@playwright/test';
import { readJSON, readCSV, readXLSX } from '../../utils/FileHelper.js';

// Load data
const users = readJSON('./testdata/users.json');
const records = readCSV('./testdata/users.csv');
const excelData = readXLSX('./testdata/users.xlsx', 'sheet1');

test.describe('Data Driven Login Tests', () => {
    for (const user of users) {
        test(`Login with JSON user: ${user.testname}`, async ({ }) => {
            console.log(user)
            //   await page.goto('/login');
            //   await page.fill('#username', user.username);
            //   await page.fill('#password', user.password);
            //   await page.click('#submit');
            //   await expect(page).toHaveURL('/dashboard');
        });
    }

    for (const record of records) {
        test(`Login with CSV user: ${record.testname}`, async ({ }) => {
            console.log(record)

            //   await page.goto('/login');
            //   await page.fill('#username', record.username);
            //   await page.fill('#password', record.password);
            //   await page.click('#submit');
            //   await expect(page).toHaveURL('/dashboard');
        });
    }

    for (const row of excelData) {
        test(`Login with XLSX user: ${row.testname}`, async ({ page }) => {
            console.log(user)

            //   await page.goto('/login');
            //   await page.fill('#username', row.username);
            //   await page.fill('#password', row.password);
            //   await page.click('#submit');
            //   await expect(page).toHaveURL('/dashboard');
        });
    }
});