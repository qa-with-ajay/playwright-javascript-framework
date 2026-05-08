import{test, expect} from '@playwright/test'

test("Handle multiple window", async({browser})=>{
    const context = await browser.newContext();
    const page1 = await context.newPage();
    await page1.goto('https://rahulshettyacademy.com/loginpagePractise/');

    let new_page_promis = context.waitForEvent('page');
    await page1.locator("[href*='documents-request']").click()
    const page2 = await new_page_promis;

    let msg = await page2.locator('p.red').textContent();
    console.log(msg)

})
