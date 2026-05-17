// src/lib/grid-code/url-state.ts
// URL <-> ViewerState sync for /tools/grid-code-viewer.
// Source of truth is the URL — components read on mount, write on every change.

import type { ViewerState, FacetState } from './types';

const KEY_DOC      = 'doc';
const KEY_CLAUSE   = 'clause';
const KEY_PAGE     = 'page';
const KEY_QUERY    = 'q';
const KEY_FACETS   = {
  publisher:    'pub',
  projectTypes: 'pt',
  studyTypes:   'st',
  jurisdiction: 'jur',
  license:      'lic',
} as const;
const KEY_VIEW     = 'view';

export function readState(search: string = typeof window === 'undefined' ? '' : window.location.search): ViewerState {
  const p = new URLSearchParams(search);
  const facets: FacetState = {};
  for (const [k, paramName] of Object.entries(KEY_FACETS)) {
    const v = p.get(paramName);
    if (v) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (facets as any)[k] = v.split(',').filter(Boolean);
    }
  }
  const page = p.get(KEY_PAGE);
  const view = p.get(KEY_VIEW) === 'viewer' ? 'viewer' : 'list';
  return {
    doc:    p.get(KEY_DOC)    ?? undefined,
    clause: p.get(KEY_CLAUSE) ?? undefined,
    page:   page ? Number(page) : undefined,
    q:      p.get(KEY_QUERY)  ?? undefined,
    facets: Object.keys(facets).length > 0 ? facets : undefined,
    view,
  };
}

export function writeState(state: ViewerState, replace = true): void {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams(window.location.search);

  // Single-value params
  for (const [key, paramName] of [
    [state.doc,                       KEY_DOC],
    [state.clause,                    KEY_CLAUSE],
    [state.page !== undefined ? String(state.page) : undefined, KEY_PAGE],
    [state.q,                         KEY_QUERY],
    [state.view === 'viewer' ? 'viewer' : undefined, KEY_VIEW],
  ] as const) {
    if (key) p.set(paramName, key);
    else p.delete(paramName);
  }

  // Facet arrays
  for (const [k, paramName] of Object.entries(KEY_FACETS)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = state.facets?.[k as keyof FacetState] as any[] | undefined;
    if (v && v.length > 0) p.set(paramName, v.join(','));
    else p.delete(paramName);
  }

  const next = `${window.location.pathname}?${p.toString()}${window.location.hash}`;
  const fn = replace ? 'replaceState' : 'pushState';
  window.history[fn](null, '', next);
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', window.location.pathname);
}
