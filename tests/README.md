# Testing & Visual QA

Three layers of automation guard against UI regressions.

## Layers

1. **Unit tests** — `vitest` under `src/**/*.test.ts`. Run with `npm test` or `npm run test:run`.
2. **Integration / E2E tests** — Playwright specs in `tests/integration/`. Run with `npm run test:e2e`.
3. **Visual regression** — `tests/integration/visual.spec.ts` uses `toHaveScreenshot()`. Baselines live under `tests/integration/visual.spec.ts-snapshots/` and are committed to git.

## Running locally

```bash
# All unit tests once
npm run test:run

# All Playwright tests (starts dev server automatically)
npm run test:e2e

# Playwright UI mode — best for authoring / debugging
npx playwright test --ui

# Just one spec
npx playwright test tests/integration/concept-windows.spec.ts

# Run mobile project (touch drag paths)
npx playwright test --project=mobile-chrome

# Update visual snapshots after intentional UI changes
npx playwright test visual.spec.ts --update-snapshots

# Run without visual diffing (CI does this until baselines exist)
npx playwright test --ignore-snapshots
```

## Shared fixtures (`fixtures.ts`)

New specs should import `test` and `expect` from `./fixtures` instead of `@playwright/test`. The fixtures add:

- **`consoleErrors` fixture** — every test automatically fails if the page emits a `pageerror` or `console.error` event that isn't in the known-benign allowlist. Most runtime regressions (undefined refs, failed fetches, hydration mismatches) surface here without needing a dedicated assertion.
- **`openConceptWindow(topicId?)` fixture** — opens a concept window by calling the public `window.conceptModal.open()` API. Bypasses the 250 ms click debounce and is stable across roadmap data changes. Defaults to the `dc-circuits` topic on the fundamentals track.
- **`docListenerCount(page)` helper** — returns a running count of `document.addEventListener` calls vs. `removeEventListener` calls. Used by the "no listener leaks" hygiene test.
- **`seedStorage(page, entries)` / `clearStorage(page)`** — deterministic localStorage setup before navigation. Use `seedStorage` to test restore paths without UI setup.

## What each spec covers

| File | Scope |
|---|---|
| `interactions.spec.ts` | Concept-pill click / dblclick / shift-click, progress persistence, demo reset |
| `navigation.spec.ts` | Cross-page navigation, hash routing |
| `accessibility.spec.ts` | axe-core WCAG 2.1 AA scan of every page + interactive states |
| `concept-windows.spec.ts` | Pinning, opacity slider (global + per-window), drag-while-pinned, restore from corrupted storage, listener-leak hygiene |
| `visual.spec.ts` | Screenshot baselines for the settings panel and concept-window canonical states |

## Writing new specs

- Import from `./fixtures`, not `@playwright/test`, to inherit the error guard.
- Call `clearStorage(page)` in `beforeEach` for determinism — roadmap state persists in localStorage and can bleed across tests otherwise.
- Prefer calling `window.conceptModal.open(topicId, conceptName)` via `page.evaluate` over clicking a pill — faster and avoids the 250 ms click-debounce race.
- For touch-drag paths, add `test.use({ ...devices['Pixel 5'] })` or run the spec on the `mobile-chrome` project.

## CI

`.github/workflows/deploy.yml` runs:

- `npm run test:coverage` (vitest with coverage)
- `npx playwright test --project=chromium --ignore-snapshots`

`--ignore-snapshots` skips visual diffs until baselines are committed. To enable visual regression in CI:

1. Run `npx playwright test visual.spec.ts --update-snapshots` locally (Linux, matching CI OS).
2. Commit the generated PNGs under `tests/integration/visual.spec.ts-snapshots/`.
3. Remove `--ignore-snapshots` from the workflow.

Because screenshot output is OS-dependent (font rendering), baselines should be generated on the same OS as CI (Ubuntu latest). An easy way: use a local Docker container matching `mcr.microsoft.com/playwright:v1.57.0-jammy`.
