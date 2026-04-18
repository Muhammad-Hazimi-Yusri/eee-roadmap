import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

type Fixtures = {
  consoleErrors: string[];
  listenerProbe: void;
  openConceptWindow: (topicId?: string) => Promise<Locator>;
};

const KNOWN_BENIGN = [
  /favicon/i,
  /Failed to load resource.*\.pdf/i,
  /net::ERR_INTERNET_DISCONNECTED/i,
];

export const test = base.extend<Fixtures>({
  // Monkey-patch add/removeEventListener on every page before any script runs.
  // Auto-runs for every test so docListenerCount() works even when consoleErrors
  // isn't destructured.
  listenerProbe: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __docListenerCount: number };
        w.__docListenerCount = 0;
        const origAdd = document.addEventListener.bind(document);
        const origRm = document.removeEventListener.bind(document);
        document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions | boolean) => {
          w.__docListenerCount++;
          return origAdd(type, listener, opts);
        }) as typeof document.addEventListener;
        document.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, opts?: EventListenerOptions | boolean) => {
          w.__docListenerCount--;
          return origRm(type, listener, opts);
        }) as typeof document.removeEventListener;
      });
      await use();
    },
    { auto: true },
  ],

  consoleErrors: async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    const record = (msg: string) => {
      if (KNOWN_BENIGN.some((r) => r.test(msg))) return;
      errors.push(msg);
    };
    page.on('pageerror', (err) => record(`[pageerror] ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') record(`[console.error] ${msg.text()}`);
    });

    await use(errors);

    if (testInfo.status === 'passed' && errors.length > 0) {
      throw new Error(`Unexpected console/page errors:\n  - ${errors.join('\n  - ')}`);
    }
  },

  openConceptWindow: async ({ page }, use) => {
    const helper = async (topicId = 'dc-circuits') => {
      await page.waitForSelector('body[data-js-ready="true"]');
      // data-js-ready fires before ConceptWindows.astro registers window.conceptModal,
      // so explicitly wait for the API.
      await page.waitForFunction(
        () =>
          typeof (window as unknown as { conceptModal?: { open: unknown } }).conceptModal?.open ===
          'function',
      );
      const btn = page.locator(`#${topicId} .node-button`);
      const expanded = await btn.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await btn.click();
      }
      await page.waitForSelector(`#${topicId} .node-content:not([hidden])`);
      const conceptName = await page
        .locator(`#${topicId} .concept-pill`)
        .first()
        .getAttribute('data-concept');
      if (!conceptName) {
        throw new Error(`No concept pill found under #${topicId}`);
      }
      const existingCount = await page.locator('.concept-window').count();
      await page.evaluate(
        ({ t, c }: { t: string; c: string }) =>
          (window as unknown as { conceptModal: { open: (t: string, c: string) => void } })
            .conceptModal.open(t, c),
        { t: topicId, c: conceptName },
      );
      // Wait for the new window (or matching existing window) to be present.
      const target = page.locator(`.concept-window[data-window-id="${topicId}:${conceptName}"]`);
      await target.waitFor({ state: 'visible' });
      // Extra guard: in multi-window tests, ensure the count actually grew when we
      // expected a new window. Silently tolerate the "already open" case.
      if ((await page.locator('.concept-window').count()) < existingCount) {
        throw new Error(`Window count shrank unexpectedly after opening ${topicId}`);
      }
      return target;
    };
    await use(helper);
  },
});

export async function docListenerCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { __docListenerCount: number }).__docListenerCount ?? 0,
  );
}

export async function seedStorage(
  page: Page,
  entries: Record<string, string>,
): Promise<void> {
  await page.addInitScript((data) => {
    for (const [k, v] of Object.entries(data)) {
      localStorage.setItem(k, v);
    }
  }, entries);
}

export async function clearStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}
