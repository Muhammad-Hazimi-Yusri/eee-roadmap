import { test, expect, clearStorage } from './fixtures';

test.use({ colorScheme: 'light', viewport: { width: 1280, height: 800 } });

const FUNDAMENTALS = '/roadmaps/fundamentals/';

const SCREENSHOT_OPTS = {
  maxDiffPixelRatio: 0.01,
  animations: 'disabled' as const,
  caret: 'hide' as const,
};

async function stableState(page: import('@playwright/test').Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `*, *::before, *::after { transition: none !important; animation: none !important; }`;
    document.head.appendChild(style);
  });
}

test.describe('Visual regression — roadmap & windows', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('settings panel shows Opacity label', async ({ page }) => {
    await page.goto(FUNDAMENTALS);
    await page.waitForSelector('body[data-js-ready="true"]');
    await stableState(page);
    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) await page.click('#settings-toggle');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveScreenshot('settings-panel.png', SCREENSHOT_OPTS);
  });

  test('concept window — default state', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();
    await stableState(page);
    await expect(win).toHaveScreenshot('window-default.png', SCREENSHOT_OPTS);
  });

  test('concept window — pinned state', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();
    await win.locator('.concept-window-pin').click();
    await stableState(page);
    await expect(win).toHaveScreenshot('window-pinned.png', SCREENSHOT_OPTS);
  });

  test('concept window — global opacity at 50', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();
    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) await page.click('#settings-toggle');
    const slider = page.locator('#global-window-opacity');
    await slider.fill('50');
    await slider.dispatchEvent('input');
    await stableState(page);
    await expect(win).toHaveScreenshot('window-opacity-50.png', SCREENSHOT_OPTS);
  });
});
