import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

type Fixtures = {
  consoleErrors: string[];
  openConceptWindow: (topicId?: string) => Promise<Locator>;
};

const KNOWN_BENIGN = [
  /favicon/i,
  /Failed to load resource.*\.pdf/i,
  /net::ERR_INTERNET_DISCONNECTED/i,
];

export const test = base.extend<Fixtures>({
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

    await use(errors);

    if (testInfo.status === 'passed' && errors.length > 0) {
      throw new Error(`Unexpected console/page errors:\n  - ${errors.join('\n  - ')}`);
    }
  },

  openConceptWindow: async ({ page }, use) => {
    const helper = async (topicId = 'dc-circuits') => {
      await page.waitForSelector('body[data-js-ready="true"]');
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
      await page.evaluate(
        ({ t, c }: { t: string; c: string }) =>
          (window as unknown as { conceptModal?: { open: (t: string, c: string) => void } })
            .conceptModal?.open(t, c),
        { t: topicId, c: conceptName },
      );
      const win = page.locator('.concept-window').first();
      await win.waitFor({ state: 'visible' });
      return win;
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
