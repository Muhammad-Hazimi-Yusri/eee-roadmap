import { test, expect } from '@playwright/test';

test.describe('Grid Code & Standards Viewer', () => {
  test('tool page loads and renders the catalogue', async ({ page }) => {
    await page.goto('/tools/grid-code-viewer/');
    await expect(page.getByRole('heading', { name: /Grid Code & Standards Viewer/i })).toBeVisible();
    // The React island loads asynchronously — wait for the catalogue head
    await expect(page.getByRole('heading', { name: /Standards catalogue/i })).toBeVisible({ timeout: 10000 });
    // Should have at least one document group rendered
    await expect(page.locator('.cat-group').first()).toBeVisible();
  });

  test('facet filter narrows the document list', async ({ page }) => {
    await page.goto('/tools/grid-code-viewer/');
    await page.waitForSelector('.cat-group');

    // Capture baseline count
    const baseline = await page.locator('.cat-item').count();
    expect(baseline).toBeGreaterThan(10);

    // Click the FRT study-type facet
    await page.getByRole('button', { name: /^FRT/, exact: false }).first().click();
    await page.waitForTimeout(200);
    const filtered = await page.locator('.cat-item').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(baseline);
  });

  test('opening a document switches to the split-pane viewer', async ({ page }) => {
    await page.goto('/tools/grid-code-viewer/');
    await page.waitForSelector('.cat-item-btn');
    await page.locator('.cat-item-btn').first().click();

    // Split-pane shows breadcrumb + iframe (or fallback)
    await expect(page.locator('.vsp-bar')).toBeVisible();
    await expect(page.locator('.vsp-split')).toBeVisible();
    // Back to catalogue button works
    await page.getByRole('button', { name: /Catalogue/ }).click();
    await expect(page.getByRole('heading', { name: /Standards catalogue/i })).toBeVisible();
  });

  test('URL state survives reload', async ({ page }) => {
    await page.goto('/tools/grid-code-viewer/?doc=erec-g99&view=viewer');
    await expect(page.locator('.vsp-bar')).toBeVisible();
    await expect(page.locator('.vsp-doc')).toContainText(/G99/i);
    // Reload — same URL, same view
    await page.reload();
    await expect(page.locator('.vsp-bar')).toBeVisible();
    await expect(page.locator('.vsp-doc')).toContainText(/G99/i);
  });

  test('Ctrl+K opens the search palette', async ({ page }) => {
    await page.goto('/tools/grid-code-viewer/');
    await page.waitForSelector('.cat-group');
    await page.keyboard.press('Control+k');
    await expect(page.locator('.sp-paper')).toBeVisible();
    await page.locator('.sp-input').fill('fault ride through');
    // At least one result should appear
    await expect(page.locator('.sp-item').first()).toBeVisible({ timeout: 5000 });
    // Esc closes the palette
    await page.keyboard.press('Escape');
    await expect(page.locator('.sp-paper')).toBeHidden();
  });
});
