import { test, expect } from '@playwright/test';

test.describe('Page navigation', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/EEE Roadmap/);
  });

  test('can navigate to fundamentals track', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href*="fundamentals"]');
    await expect(page).toHaveURL(/roadmaps\/fundamentals/);
  });

  test('roadmap pages load directly', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForSelector('body[data-js-ready="true"]');
    await expect(page.locator('.roadmap-node').first()).toBeVisible();
  });
});

test.describe('Hash anchor navigation', () => {
  test('navigating to hash expands the topic node', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/#dc-circuits');
    await page.waitForSelector('body[data-js-ready="true"]');
    
    const nodeButton = page.locator('#dc-circuits .node-button');
    await expect(nodeButton).toHaveAttribute('aria-expanded', 'true', { timeout: 10000 });
  });
});

test.describe('Prerequisite links', () => {
  test('prereq link to same track stays in same tab by default', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForSelector('body[data-js-ready="true"]');
    await page.click('#ac-circuits .node-button');
    
    const prereqLink = page.locator('#ac-circuits .prereq-tag--link[href*="fundamentals"]').first();
    
    if (await prereqLink.count() > 0) {
      await expect(prereqLink).not.toHaveAttribute('target', '_blank');
    }
  });

  test('prereq link to different track opens new tab in smart mode', async ({ page }) => {
    await page.goto('/roadmaps/core/');
    await page.waitForSelector('body[data-js-ready="true"]');
    await page.click('#transistors .node-button');
    
    const prereqLink = page.locator('#transistors .prereq-tag--link[href*="fundamentals"]').first();
    
    if (await prereqLink.count() > 0) {
      await expect(prereqLink).toHaveAttribute('target', '_blank', { timeout: 10000 });
    }
  });
});

test.describe('Dark mode', () => {
  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('dark mode persists across navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    await page.click('a[href*="fundamentals"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});