import {
  test,
  expect,
  docListenerCount,
  docListenerTypes,
  seedStorage,
  clearStorage,
} from './fixtures';

const FUNDAMENTALS = '/roadmaps/fundamentals/';

test.describe('Concept windows — pinning', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('pin button toggles class and persists after reload', async ({
    page,
    openConceptWindow,
    consoleErrors,
  }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();

    const winId = await win.getAttribute('data-window-id');
    expect(winId).toBeTruthy();

    await win.locator('.concept-window-pin').click();
    await expect(win).toHaveClass(/concept-window--pinned/);

    await page.reload();
    await page.waitForSelector('body[data-js-ready="true"]');
    const restored = page.locator(`.concept-window[data-window-id="${winId}"]`);
    await expect(restored).toBeVisible();
    await expect(restored).toHaveClass(/concept-window--pinned/);

    expect(consoleErrors).toEqual([]);
  });

  test('drag is blocked when a window is pinned', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();
    await win.locator('.concept-window-pin').click();

    const before = await win.boundingBox();
    expect(before).not.toBeNull();

    const titlebar = win.locator('.concept-window-titlebar');
    await titlebar.hover();
    await page.mouse.down();
    await page.mouse.move(before!.x + 200, before!.y + 150, { steps: 5 });
    await page.mouse.up();

    const after = await win.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);
  });

  test('pinning mid-drag stops the window following the cursor', async ({
    page,
    openConceptWindow,
  }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();
    const start = await win.boundingBox();
    expect(start).not.toBeNull();

    const titlebar = win.locator('.concept-window-titlebar');
    await titlebar.hover();
    await page.mouse.down();
    await page.mouse.move(start!.x + 80, start!.y + 40, { steps: 3 });

    await win.locator('.concept-window-pin').click({ force: true });

    await page.mouse.move(start!.x + 300, start!.y + 200, { steps: 5 });
    await page.mouse.up();

    const after = await win.boundingBox();
    expect(after!.x - start!.x).toBeLessThan(200);
    expect(after!.y - start!.y).toBeLessThan(200);
  });

  test('Pin All / Unpin All affects every open window', async ({
    page,
    openConceptWindow,
  }) => {
    await page.goto(FUNDAMENTALS);
    await openConceptWindow('dc-circuits');
    await openConceptWindow('ac-circuits').catch(() => openConceptWindow('dc-circuits'));

    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) await page.click('#settings-toggle');

    await page.click('#pin-all-windows');
    const allPinned = await page
      .locator('.concept-window')
      .evaluateAll((els) => els.every((el) => el.classList.contains('concept-window--pinned')));
    expect(allPinned).toBe(true);

    await page.click('#unpin-all-windows');
    const nonePinned = await page
      .locator('.concept-window')
      .evaluateAll((els) => els.every((el) => !el.classList.contains('concept-window--pinned')));
    expect(nonePinned).toBe(true);
  });
});

test.describe('Concept windows — opacity slider', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('global slider label reads "Opacity:" (not "Transparency:")', async ({
    page,
  }) => {
    await page.goto(FUNDAMENTALS);
    await page.waitForSelector('body[data-js-ready="true"]');
    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) await page.click('#settings-toggle');

    const label = page.locator('label[for="global-window-opacity"]');
    await expect(label).toHaveText(/^Opacity:/);
  });

  test('global slider at 50 applies 0.5 opacity to window content', async ({
    page,
    openConceptWindow,
  }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();

    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) await page.click('#settings-toggle');

    const slider = page.locator('#global-window-opacity');
    await slider.fill('50');
    await slider.dispatchEvent('input');

    const content = win.locator('.concept-window-content');
    const opacity = await content.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.5, 1);
  });

  test('per-window slider updates only that window', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    const winA = await openConceptWindow('dc-circuits');
    await openConceptWindow('ac-circuits').catch(() => {});

    const windows = page.locator('.concept-window');
    const count = await windows.count();
    test.skip(count < 2, 'This track only has one openable topic — cannot test multi-window isolation.');

    await winA.locator('.concept-window-opacity').click();
    const sliderA = winA.locator('.opacity-slider');
    await sliderA.fill('60');
    await sliderA.dispatchEvent('input');

    const opacityA = await winA
      .locator('.concept-window-content')
      .evaluate((el) => window.getComputedStyle(el).opacity);
    const opacityB = await windows
      .nth(1)
      .locator('.concept-window-content')
      .evaluate((el) => window.getComputedStyle(el).opacity);

    expect(parseFloat(opacityA)).toBeCloseTo(0.6, 1);
    expect(parseFloat(opacityB)).toBeCloseTo(1.0, 1);
  });

  test('opacity persists across reload', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();
    const winId = await win.getAttribute('data-window-id');

    const panel = page.locator('#settings-panel');
    if (await panel.isHidden()) await page.click('#settings-toggle');
    const slider = page.locator('#global-window-opacity');
    await slider.fill('40');
    await slider.dispatchEvent('input');

    await page.reload();
    await page.waitForSelector('body[data-js-ready="true"]');
    const restored = page.locator(`.concept-window[data-window-id="${winId}"]`);
    await expect(restored).toBeVisible();

    const opacity = await restored
      .locator('.concept-window-content')
      .evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.4, 1);
  });

  test('opacity popover closes when clicking outside the window', async ({
    page,
    openConceptWindow,
  }) => {
    await page.goto(FUNDAMENTALS);
    const win = await openConceptWindow();

    await win.locator('.concept-window-opacity').click();
    const popover = win.locator('.concept-window-opacity-popover');
    await expect(popover).toBeVisible();

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(popover).toBeHidden();
  });
});

test.describe('Concept windows — restore & cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('corrupted localStorage entry is purged on restore', async ({ page }) => {
    await seedStorage(page, {
      'eee-open-windows-fundamentals': JSON.stringify([
        {
          id: 'bogus-topic:nonexistent-concept',
          isMinimized: false,
          isMaximized: false,
          isCollapsed: false,
          isPinned: false,
          opacity: 1,
        },
      ]),
    });
    await page.goto(FUNDAMENTALS);
    await page.waitForSelector('body[data-js-ready="true"]');

    await expect(page.locator('.concept-window')).toHaveCount(0);

    const stored = await page.evaluate(() =>
      localStorage.getItem('eee-open-windows-fundamentals'),
    );
    const parsed = stored ? JSON.parse(stored) : [];
    expect(parsed.some((w: { id: string }) => w.id === 'bogus-topic:nonexistent-concept')).toBe(
      false,
    );
  });

  test('Close All removes every concept window', async ({ page, openConceptWindow }) => {
    await page.goto(FUNDAMENTALS);
    await openConceptWindow('dc-circuits');

    const taskbarClose = page.locator('#close-all-windows');
    if (await taskbarClose.isVisible()) {
      await taskbarClose.click();
    } else {
      await page.locator('.concept-window-close').first().click();
    }
    await expect(page.locator('.concept-window')).toHaveCount(0);
  });
});

test.describe('Concept windows — hygiene', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('open/close cycles do not leak document listeners unboundedly', async ({
    page,
    openConceptWindow,
  }) => {
    await page.goto(FUNDAMENTALS);
    await page.waitForSelector('body[data-js-ready="true"]');

    const baseline = await docListenerCount(page);
    const baselineTypes = await docListenerTypes(page);

    for (let i = 0; i < 5; i++) {
      const win = await openConceptWindow();
      await win.locator('.concept-window-close').click();
      await expect(page.locator('.concept-window')).toHaveCount(0);
    }

    const finalCount = await docListenerCount(page);
    const finalTypes = await docListenerTypes(page);
    const perCycle = (finalCount - baseline) / 5;
    const delta: Record<string, number> = {};
    for (const [type, count] of Object.entries(finalTypes)) {
      const grew = count - (baselineTypes[type] ?? 0);
      if (grew !== 0) delta[type] = grew;
    }
    expect(
      perCycle,
      `document listeners grew by ${finalCount - baseline} across 5 open/close cycles ` +
        `(${perCycle} per window) — these must be removed on close. ` +
        `Per-type delta: ${JSON.stringify(delta)}`,
    ).toBeLessThan(2);
  });
});
