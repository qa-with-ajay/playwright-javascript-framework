import { Given, When, Then } from '@cucumber/cucumber';
import { chromium} from '@playwright/test';

let browser, page;

Given('the user is on the Google homepage', async () => {
  browser = await chromium.launch({channel: 'msedge'});
  page = await browser.newPage();
  await page.goto('https://www.google.com');
});

When('the user enters {string} in the search field', async (keyword) => {
  await page.fill('input[name="q"]', keyword);
  await page.press('input[name="q"]', 'Enter');
});

Then('results related to {string} should be displayed', async (keyword) => {
  const content = await page.textContent('body');
  if (!content.includes(keyword)) {
    throw new Error(`Results do not contain ${keyword}`);
  }
  await browser.close();
});
