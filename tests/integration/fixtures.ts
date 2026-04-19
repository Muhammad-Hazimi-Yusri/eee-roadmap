import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

type Fixtures = {
  consoleErrors: string[];
  listenerProbe: void;
  openConceptWindow: (topicId?: string) => Promise<Locator>;
};

type ProbeWindow = {
  __docListenerCount: number;
  __docListenerTypes: Record<string, number>;
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
        // Dedupe by (type, listener-ref, capture) to mirror what the browser
        // actually stores — a second addEventListener with the same tuple is a
        // no-op at the platform level. Counting raw calls produces false
        // positives from libraries (e.g. Tippy) that re-bind idempotent
        // listeners on every instance.
        const w = window as unknown as {
          __docListenerCount: number;
          __docListenerTypes: Record<string, number>;
        };
        w.__docListenerCount = 0;
        w.__docListenerTypes = {};
        const registered = new Map<string, Set<EventListenerOrEventListenerObject>>();
        const captureOf = (opts?: AddEventListenerOptions | EventListenerOptions | boolean) =>
          typeof opts === 'boolean' ? opts : !!opts?.capture;
        const bucket = (type: string, capture: boolean) => {
          const key = `${type}|${capture ? 'c' : ''}`;
          let set = registered.get(key);
          if (!set) { set = new Set(); registered.set(key, set); }
          return set;
        };
        const origAdd = document.addEventListener.bind(document);
        const origRm = document.removeEventListener.bind(document);
        // Astro's dev toolbar (loaded via `npm run dev`) registers astro:*
        // document listeners asynchronously after page load. They're framework
        // infrastructure, unrelated to app-level leaks; ignore them.
        const isFrameworkEvent = (type: string) => type.startsWith('astro:');
        document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions | boolean) => {
          if (!isFrameworkEvent(type)) {
            const set = bucket(type, captureOf(opts));
            if (!set.has(listener)) {
              set.add(listener);
              w.__docListenerCount++;
              w.__docListenerTypes[type] = (w.__docListenerTypes[type] ?? 0) + 1;
            }
          }
          return origAdd(type, listener, opts);
        }) as typeof document.addEventListener;
        document.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, opts?: EventListenerOptions | boolean) => {
          if (!isFrameworkEvent(type)) {
            const set = bucket(type, captureOf(opts));
            if (set.has(listener)) {
              set.delete(listener);
              w.__docListenerCount--;
              w.__docListenerTypes[type] = (w.__docListenerTypes[type] ?? 0) - 1;
            }
          }
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
    () => (window as unknown as ProbeWindow).__docListenerCount ?? 0,
  );
}

export async function docListenerTypes(page: Page): Promise<Record<string, number>> {
  return page.evaluate(
    () => ({ ...((window as unknown as ProbeWindow).__docListenerTypes ?? {}) }),
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
  // addInitScript runs before EVERY navigation, including page.reload(). Tests
  // that reload to verify state survives must keep their localStorage between
  // initial goto and reload — so clear only on the first navigation, gated by
  // a cookie marker (cookies survive navigations; sessionStorage does not,
  // because the script itself clears it).
  await page.addInitScript(() => {
    try {
      if (document.cookie.includes('__eee-test-cleared=1')) return;
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = '__eee-test-cleared=1; path=/';
    } catch {
      /* ignore */
    }
  });
}
