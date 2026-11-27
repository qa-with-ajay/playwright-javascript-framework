import { expect, test } from '@playwright/test';


test('Handle simple alert dialog in playwright', async ({ page }) => {
  await page.goto('https://only-testing-blog.blogspot.com/2025/04/alert-dialogs.html');
  
  page.on("dialog", async (dialog) => {
    //Verify alert message text.
    expect(dialog.message()).toEqual("This is an Alert box!");
    //Accept alert.
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Alert' }).click();

});

test('Handle simple confirm dialog in playwright', async ({ page }) => {
  await page.goto('https://only-testing-blog.blogspot.com/2025/04/alert-dialogs.html');

  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Do you want to proceed?");
    //Accept alert.
    // await dialog.accept();
    await dialog.dismiss();
  });

  await page.getByRole('button', { name: 'Confirm' }).click();

});


test('Handle simple prompt dialog in playwright', async ({ page }) => {
  await page.goto('https://only-testing-blog.blogspot.com/2025/04/alert-dialogs.html');

  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Please enter your city:");
    // await dialog.accept("ajay");
    await dialog.dismiss();

  });

  await page.getByRole('button', { name: 'Prompt' }).click();

});
