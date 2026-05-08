// login.spec.js
import { test, expect } from '@playwright/test';
import { readCSV, readJSON, readXLSX, getTestData, readXMLGeneric } from '../../utils/FileHelper'

// // Load data from JSON
// const usersJson = readJSON('./testdata/users.json');

// // Load data from CSV
// const records = readCSV('./testdata/users.csv');

// // Load data from XLSX
// const excelData = readXLSX('./testdata/users.xlsx');


// test.describe('Data Driven Login Tests', () => {
//   for (const user of usersJson) {
//     test(`Login with JSON user: ${user.username}`, async ({  }) => {
//       console.log(user);
//     });
//   }

// });

// test.describe('Data Driven Login Tests', () => {
//   for (const record of records) {
//     test(`Login with CSV user: ${record.username}`, async ({ page }) => {
//       console.log(record);
//     });
//   }
// });

// test.describe('Data Driven Login Tests', () => {
//   for (const row of excelData) {
//     test(`Login with XLSX user: ${row.username}`, async ({  }) => {
//       console.log(row);
//     });
//   }
// });

test.describe('Generic XML Data Driven Tests', () => {
  let users = [];

  test.beforeAll(async () => {
    users = await readXMLGeneric('./testdata/users.xml', 'users', 'user');
  });

  test('Run login for all XML users', async ({ page }) => {
    for (const user of users) {
      console.log(user);
      
    }
  });
});


// Top-level await requires "type": "module" in package.json
const users = await readXMLGeneric('./testdata/users.xml', 'users', 'user');

test.describe('Generic XML Data Driven Tests', () => {
  for (const user of users) {
    test(`Login with XML user: ${user.username}`, async ({ page }) => {
      console.log(user); // { username: "ajay1", password: "pass1" }
    });
  }
});