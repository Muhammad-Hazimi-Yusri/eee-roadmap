import { test, expect } from '@playwright/test';

test.describe('Simple mode interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    // Wait for JS to initialize
    await page.waitForLoadState('networkidle');
    // Expand the topic and wait for content to be visible
    await page.click('#dc-circuits .node-button');
    await page.waitForSelector('#dc-circuits .node-content:not([hidden])');
  });

  test('double-click marks concept as complete', async ({ page }) => {
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await expect(pill).toBeVisible();
    
    await pill.dblclick();
    
    await expect(pill).toHaveClass(/concept-pill--completed/);
  });

  test('double-click again removes complete state', async ({ page }) => {
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await expect(pill).toBeVisible();
    
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
    
    await pill.dblclick();
    await expect(pill).not.toHaveClass(/concept-pill--completed/);
  });

  test('shift+click marks concept as important', async ({ page }) => {
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await expect(pill).toBeVisible();
    
    await pill.click({ modifiers: ['Shift'] });
    
    await expect(pill).toHaveClass(/concept-pill--important/);
  });
});

test.describe('Progress persistence', () => {
  test('completed state persists after reload', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForLoadState('networkidle');
    await page.click('#dc-circuits .node-button');
    await page.waitForSelector('#dc-circuits .node-content:not([hidden])');
    
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await expect(pill).toBeVisible();
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Node state is persisted - check if already expanded, if not expand it
    const nodeButton = page.locator('#dc-circuits .node-button');
    const isExpanded = await nodeButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await page.click('#dc-circuits .node-button');
    }
    await page.waitForSelector('#dc-circuits .node-content:not([hidden])');
    
    const samePill = page.locator('#dc-circuits .concept-pill').first();
    await expect(samePill).toHaveClass(/concept-pill--completed/);
  });

  test('important state persists after reload', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    await page.waitForLoadState('networkidle');
    await page.click('#dc-circuits .node-button');
    await page.waitForSelector('#dc-circuits .node-content:not([hidden])');
    
    const pill = page.locator('#dc-circuits .concept-pill').first();
    await expect(pill).toBeVisible();
    await pill.click({ modifiers: ['Shift'] });
    await expect(pill).toHaveClass(/concept-pill--important/);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Node state is persisted - check if already expanded, if not expand it
    const nodeButton = page.locator('#dc-circuits .node-button');
    const isExpanded = await nodeButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await page.click('#dc-circuits .node-button');
    }
    await page.waitForSelector('#dc-circuits .node-content:not([hidden])');
    
    const samePill = page.locator('#dc-circuits .concept-pill').first();
    await expect(samePill).toHaveClass(/concept-pill--important/);
  });
});

test.describe('Demo component', () => {
  test('demo mode toggle switches between simple and tools', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const modeSelect = page.locator('#demo-interaction-mode');
    const toolbar = page.locator('#demo-toolbar');
    const hints = page.locator('#demo-simple-hints');
    
    // Default is simple mode
    await expect(hints).toBeVisible();
    await expect(toolbar).toBeHidden();
    
    // Switch to tools mode
    await modeSelect.selectOption('tools');
    
    await expect(toolbar).toBeVisible();
    await expect(hints).toBeHidden();
  });

  test('demo reset button clears all progress', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mark a concept as complete
    const pill = page.locator('#demo-roadmap .concept-pill').first();
    await expect(pill).toBeVisible();
    await pill.dblclick();
    await expect(pill).toHaveClass(/concept-pill--completed/);
    
    // Click reset
    await page.click('#demo-reset-btn');
    
    // Should be cleared
    await expect(pill).not.toHaveClass(/concept-pill--completed/);
  });
});

test.describe('Cross-track prerequisite navigation', () => {
  test('clicking cross-track prereq opens in new tab (smart mode)', async ({ page, context }) => {
    await page.goto('/roadmaps/core/');
    await page.waitForLoadState('networkidle');
    
    // Expand transistors node (has fundamentals prereqs)
    await page.click('#transistors .node-button');
    await page.waitForSelector('#transistors .node-content:not([hidden])');
    
    // Find a prereq linking to fundamentals
    const prereqLink = page.locator('#transistors .prereq-tag--link[href*="fundamentals"]').first();
    
    if (await prereqLink.count() > 0) {
      // Wait for JS to apply target attribute
      await expect(prereqLink).toHaveAttribute('target', '_blank', { timeout: 10000 });
      
      // Click and verify new tab opens
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        prereqLink.click()
      ]);
      
      await expect(newPage).toHaveURL(/fundamentals/);
      await newPage.close();
    }
  });
});