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
    await expect(page.locator('.roadmap-node').first()).toBeVisible();
  });
});

test.describe('Hash anchor navigation', () => {
  test('navigating to hash expands the topic node', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/#dc-circuits');
    
    const nodeButton = page.locator('#dc-circuits .node-button');
    await expect(nodeButton).toHaveAttribute('aria-expanded', 'true');
    
    const nodeContent = page.locator('#dc-circuits .node-content');
    await expect(nodeContent).toBeVisible();
  });
});

test.describe('Prerequisite links', () => {
  test('prereq link to same track stays in same tab by default', async ({ page }) => {
    await page.goto('/roadmaps/fundamentals/');
    
    // Expand a node with prereqs
    await page.click('#ac-circuits .node-button');
    
    // Find a same-track prereq link
    const prereqLink = page.locator('#ac-circuits .prereq-tag--link[href*="fundamentals"]').first();
    
    if (await prereqLink.count() > 0) {
      // Should not have target="_blank"
      await expect(prereqLink).not.toHaveAttribute('target', '_blank');
    }
  });

  test('prereq link to different track opens new tab in smart mode', async ({ page }) => {
    await page.goto('/roadmaps/core/');
    
    // Expand a node with cross-track prereqs
    await page.click('#transistors .node-button');
    
    // Find a prereq linking to fundamentals
    const prereqLink = page.locator('#transistors .prereq-tag--link[href*="fundamentals"]').first();
    
    if (await prereqLink.count() > 0) {
      await expect(prereqLink).toHaveAttribute('target', '_blank');
    }
  });
});

test.describe('Dark mode', () => {
  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    
    // Should start in light mode (or system preference)
    const html = page.locator('html');
    
    // Click theme toggle
    await page.click('#theme-toggle');
    
    // Should have dark class
    await expect(html).toHaveClass(/dark/);
  });

  test('dark mode persists across navigation', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Navigate to another page
    await page.click('a[href*="fundamentals"]');
    
    // Should still be dark
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});