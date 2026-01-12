import { test, expect } from '@playwright/test';

test.describe('Simple mode interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.click('#dc-circuits .node-button');
  });

  test('double-click marks concept as complete', async ({ page }) => {
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
  });

  test('double-click again removes complete state', async ({ page }) => {
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
    await pill.dblclick();
    await expect(pill).not.toHaveClass(/concept-pill--completed/);
  });

  test('shift+click marks concept as important', async ({ page }) => {
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await pill.click({ modifiers: ['Shift'] });
    await expect(pill).toHaveClass(/concept-pill--important/);
  });
});

test.describe('Progress persistence', () => {
  test('completed state persists after reload', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.click('#dc-circuits .node-button');
    
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
    
    await page.reload();
    
    const isExpanded = await page.locator('#dc-circuits .node-button').getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await page.click('#dc-circuits .node-button');
    }
    
    const samePill = page.locator('#dc-circuits .concept-pill').first();
    await expect(samePill).toHaveClass(/concept-pill--completed/);
  });

  test('important state persists after reload', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.click('#dc-circuits .node-button');
    
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await pill.click({ modifiers: ['Shift'] });
    await expect(pill).toHaveClass(/concept-pill--important/);
    
    await page.reload();
    
    const isExpanded = await page.locator('#dc-circuits .node-button').getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await page.click('#dc-circuits .node-button');
    }
    
    const samePill = page.locator('#dc-circuits .concept-pill').first();
    await expect(samePill).toHaveClass(/concept-pill--important/);
  });
});

test.describe('Demo component', () => {
  test('demo mode toggle switches between simple and tools', async ({ page }) => {
    await page.goto('/');
    
    const modeSelect = page.locator('#demo-interaction-mode');
    const toolbar = page.locator('#demo-toolbar');
    const hints = page.locator('#demo-simple-hints');
    
    await expect(hints).toBeVisible();
    await expect(toolbar).toBeHidden();
    
    await modeSelect.selectOption('tools');
    
    await expect(toolbar).toBeVisible();
    await expect(hints).toBeHidden();
  });

  test('demo reset button clears all progress', async ({ page }) => {
    await page.goto('/');
    
    const pill = page.locator('#demo-roadmap .concept-pill').first();
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
    
    await page.click('#demo-reset-btn');
    await expect(pill).not.toHaveClass(/concept-pill--completed/);
  });
});

test.describe('Cross-track prerequisite navigation', () => {
  test('clicking cross-track prereq opens in new tab (smart mode)', async ({ page, context }) => {
    await page.goto('/roadmaps/core/');
    await page.click('#transistors .node-button');
    
    const prereqLink = page.locator('#transistors .prereq-tag--link[href*="fundamentals"]').first();
    
    if (await prereqLink.count() > 0) {
      await expect(prereqLink).toHaveAttribute('target', '_blank', { timeout: 10000 });
      
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        prereqLink.click()
      ]);
      
      await expect(newPage).toHaveURL(/fundamentals/);
      await newPage.close();
    }
  });
});