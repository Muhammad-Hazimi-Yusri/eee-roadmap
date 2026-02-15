import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run axe-core a11y scan against a Playwright page.
 * Targets WCAG 2.1 AA compliance.
 */
async function checkA11y(
  page: import('@playwright/test').Page,
  options?: {
    exclude?: string[];
    disableRules?: string[];
  }
) {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);

  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  if (options?.disableRules) {
    builder = builder.disableRules(options.disableRules);
  }

  const results = await builder.analyze();
  expect(results.violations).toEqual([]);
}

test.describe('Page-level accessibility', () => {
  test('homepage has no a11y violations', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page);
  });

  test('roadmaps index has no a11y violations', async ({ page }) => {
    await page.goto('/roadmaps/');
    await checkA11y(page);
  });

  test('fundamentals track has no a11y violations', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForSelector('body[data-js-ready="true"]');
    await checkA11y(page);
  });

  test('core track has no a11y violations', async ({ page }) => {
    await page.goto('/roadmaps/core/');
    await page.waitForSelector('body[data-js-ready="true"]');
    await checkA11y(page);
  });

  test('glossary page has no a11y violations', async ({ page }) => {
    await page.goto('/glossary/');
    await checkA11y(page);
  });

  test('about page has no a11y violations', async ({ page }) => {
    await page.goto('/about/');
    await checkA11y(page);
  });

  test('custom tracks page has no a11y violations', async ({ page }) => {
    await page.goto('/roadmaps/custom/');
    await checkA11y(page);
  });
});

test.describe('Interactive state accessibility', () => {
  test('expanded roadmap node has no a11y violations', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForSelector('body[data-js-ready="true"]');
    await page.click('#dc-circuits .node-button');
    await page.waitForSelector('#dc-circuits .node-content:not([hidden])');
    await checkA11y(page);
  });

  test('dark mode has no a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await checkA11y(page);
  });

  test('search modal has no a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.click('#search-trigger');
    await page.waitForSelector('#search-modal', { state: 'visible', timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .include('#search-modal')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('settings panel has no a11y violations when open', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForSelector('body[data-js-ready="true"]');
    // Panel auto-opens on desktop with fresh localStorage.
    // If closed, click toggle to open it.
    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) {
      await page.click('#settings-toggle');
    }
    await expect(panel).toBeVisible();
    await checkA11y(page);
  });
});
