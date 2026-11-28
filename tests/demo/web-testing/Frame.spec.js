import { test, expect } from '@playwright/test'


test("frame", async ({ page }) => {
    await page.goto('https://ui.vision/demo/webtest/frames/');//page mainPage

    const frames = page.frames();
    console.log(await frames[1].title())
    const frame1 = page.frameLocator('[src="frame_1.html"]');
    await frame1.locator('[name="mytext1"]').fill("frame1");

    const frame2 = page.frameLocator('[src="frame_2.html"]');
    await frame2.locator('[name="mytext2"]').fill("frame2");

    const frame3 = page.frameLocator('[src="frame_3.html"]');
    await frame3.locator('[name="mytext3"]').fill("frame3");

    const frame3_1 = frame3.frameLocator('[src^="https://docs.google.com/forms"]');
    await frame3_1.getByText('I am a human').click();

    const frame4 = page.frameLocator('[src="frame_4.html"]');
    await frame4.locator('[name="mytext4"]').fill("frame4");

    await frame3_1.getByLabel('Web Testing').check();
    
})