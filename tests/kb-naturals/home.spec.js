import { test } from '@playwright/test'
import { HomePage } from '../../pageobjects/kb-namturals/HomePage'

test.describe("home page test cases", () => {

    test.beforeEach("", async({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("https://kbnaturals.vercel.app/")
    });



    test('HOME_001 Verify Home page loads', async({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.home).toBeVisible();

    });

    test('HOME_002 Verify Hero section', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.heroSection).toBeVisible();

    });

    test('HOME_003 Verify Hero heading', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.heroHeading)
            .toContainText('Honest Nutrition');

    });

    test('HOME_004 Verify Hero description', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.heroDescription)
            .toBeVisible();

    });

    test('HOME_005 Verify Hero image', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.heroImage)
            .toBeVisible();

    });

    test('HOME_006 Verify View Products button', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.viewProductsBtn)
            .toBeVisible();

    });

    test('HOME_007 Verify Read Reviews button', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.readReviewsBtn)
            .toBeVisible();

    });

    test('HOME_008 Navigate to Products', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickViewProducts();

        await expect({page}).toHaveURL(/products/);

    });

    test('HOME_009 Navigate to Reviews', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickReadReviews();

        await expect({page}).toHaveURL(/reviews/);

    });

    test('HOME_010 Verify Category cards', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.categoryCards)
            .toHaveCount(5);

    });

    test('HOME_011 Open Juice category', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickJuices();

        await expect({page})
            .toHaveURL(/NaturoAmritJuice/);

    });

    test('HOME_012 Open Green Salad category', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickGreenSalads();

        await expect({page})
            .toHaveURL(/NaturoGreenSalads/);

    });

    test('HOME_013 Open Herbal Powder category', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickPowders();

        await expect({page})
            .toHaveURL(/NaturoHerbalPowders/);

    });

    test('HOME_014 Open Super Seeds category', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickSeeds();

        await expect({page})
            .toHaveURL(/NaturoSuperSeeds/);

    });

    test('HOME_015 Open Healthy Grains category', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickGrains();

        await expect({page})
            .toHaveURL(/NaturoHealthyGrains/);

    });

    test('HOME_016 Open Products inventory', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickInventory();

        await expect({page}).toHaveURL(/products/);

    });

    test('HOME_017 Open subscription', async ({ page }) => {
        const homePage = await new HomePage(page);
        await homePage.clickSubscription();

        await expect({page}).toHaveURL(/products/);

    });

    test('HOME_018 Verify Footer', async ({page}) => {
        const homePage = await new HomePage(page);
        await expect(homePage.footer)
            .toBeVisible();

    });

})