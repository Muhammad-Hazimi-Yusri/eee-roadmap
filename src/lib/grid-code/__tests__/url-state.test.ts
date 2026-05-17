// Unit tests for the URL <-> ViewerState helpers.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readState, writeState } from '../url-state';

// Mock a minimal window for write operations (vitest defaults to node env).
function makeWindow(initialSearch = '') {
  let search = initialSearch;
  const win = {
    location: {
      get search() { return search; },
      get pathname() { return '/tools/grid-code-viewer/'; },
      get hash() { return ''; },
      get href() { return `https://example/tools/grid-code-viewer/${search}`; },
    },
    history: {
      replaceState(_state: unknown, _title: string, url: string) {
        const qIdx = url.indexOf('?');
        search = qIdx >= 0 ? url.slice(qIdx) : '';
      },
      pushState(_state: unknown, _title: string, url: string) {
        this.replaceState(_state, _title, url);
      },
    },
  };
  return win;
}

describe('grid-code url-state', () => {
  let win: ReturnType<typeof makeWindow>;

  beforeEach(() => {
    win = makeWindow('');
    vi.stubGlobal('window', win);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses an empty search string to defaults', () => {
    const s = readState('');
    expect(s.doc).toBeUndefined();
    expect(s.clause).toBeUndefined();
    expect(s.view).toBe('list');
  });

  it('parses doc, clause, page, q', () => {
    const s = readState('?doc=erec-g99&clause=13.6&page=180&q=fault+ride+through&view=viewer');
    expect(s.doc).toBe('erec-g99');
    expect(s.clause).toBe('13.6');
    expect(s.page).toBe(180);
    expect(s.q).toBe('fault ride through');
    expect(s.view).toBe('viewer');
  });

  it('parses facets as comma-separated arrays', () => {
    const s = readState('?pt=G99-C,BESS&st=FRT,Reactive&lic=link-only');
    expect(s.facets?.projectTypes).toEqual(['G99-C', 'BESS']);
    expect(s.facets?.studyTypes).toEqual(['FRT', 'Reactive']);
    expect(s.facets?.license).toEqual(['link-only']);
  });

  it('writes state back to URL and reads it back', () => {
    writeState({ doc: 'grid-code', clause: 'ECC.6.3.7', page: 42, view: 'viewer' });
    const round = readState(win.location.search);
    expect(round.doc).toBe('grid-code');
    expect(round.clause).toBe('ECC.6.3.7');
    expect(round.page).toBe(42);
    expect(round.view).toBe('viewer');
  });

  it('round-trips facets through writeState + readState', () => {
    writeState({
      facets: {
        projectTypes: ['G99-C', 'G99-D'],
        studyTypes:   ['FRT'],
        license:      ['link-only', 'hostable-eu'],
      },
      view: 'list',
    });
    const round = readState(win.location.search);
    expect(round.facets?.projectTypes).toEqual(['G99-C', 'G99-D']);
    expect(round.facets?.studyTypes).toEqual(['FRT']);
    expect(round.facets?.license).toEqual(['link-only', 'hostable-eu']);
  });

  it('clears facets when arrays are empty', () => {
    writeState({ facets: { projectTypes: ['G99-C'] }, view: 'list' });
    writeState({ facets: {}, view: 'list' });
    const round = readState(win.location.search);
    expect(round.facets).toBeUndefined();
  });
});
