import { expect } from '@playwright/test';

export class HomePage {

    constructor(page) {

        this.page = page;

        // Main
        this.home = page.locator('#home-page');

        // Hero
        this.heroSection = page.locator('#home-hero');
        this.heroHeading = page.locator('#home-hero h1');
        this.heroDescription = page.locator('#home-hero p');

        this.heroImage = page.locator('#home-hero img');

        this.viewProductsBtn = page.locator('#home-hero-products-link');

        this.readReviewsBtn = page.locator('#home-hero-review-link');

        // Categories

        this.categoryCards = page.locator('[id^="home-category-card-"]');

        this.juiceCategory =
            page.locator('#home-category-card-naturo-amrit-juices');

        this.greenSaladCategory =
            page.locator('#home-category-card-naturo-green-salads');

        this.powderCategory =
            page.locator('#home-category-card-naturo-herbal-powders');

        this.seedCategory =
            page.locator('#home-category-card-naturo-super-seeds');

        this.grainCategory =
            page.locator('#home-category-card-naturo-healthy-grains');

        // Featured

        this.featuredProductsLink =
            page.locator('#home-featured-products-link');

        // CTA

        this.startSubscriptionBtn =
            page.getByRole('link', { name: 'Start a Subscription' });

        // Footer

        this.footer = page.locator('footer');

    }

    async open() {
        await this.page.goto('/');
    }

    async clickViewProducts() {
        await this.viewProductsBtn.click();
    }

    async clickReadReviews() {
        await this.readReviewsBtn.click();
    }

    async clickJuices() {
        await this.juiceCategory.click();
    }

    async clickGreenSalads() {
        await this.greenSaladCategory.click();
    }

    async clickPowders() {
        await this.powderCategory.click();
    }

    async clickSeeds() {
        await this.seedCategory.click();
    }

    async clickGrains() {
        await this.grainCategory.click();
    }

    async clickInventory() {
        await this.featuredProductsLink.click();
    }

    async clickSubscription() {
        await this.startSubscriptionBtn.click();
    }

}