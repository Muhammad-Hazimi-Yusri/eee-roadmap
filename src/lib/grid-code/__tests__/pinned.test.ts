// Unit tests for the localStorage-backed pin helper.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock minimal browser globals (vitest defaults to a node env)
function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() { return Object.keys(store).length; },
    clear()      { store = {}; },
    getItem(k)   { return store[k] ?? null; },
    setItem(k,v) { store[k] = String(v); },
    removeItem(k){ delete store[k]; },
    key(i)       { return Object.keys(store)[i] ?? null; },
  };
}

const storage = createMockStorage();

describe('grid-code pinned', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', { localStorage: storage });
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an empty list when nothing is pinned', async () => {
    const { getPinned, isPinned } = await import('../pinned');
    expect(getPinned()).toEqual([]);
    expect(isPinned('grid-code/ECC.6.3.7')).toBe(false);
  });

  it('adds and removes a pin', async () => {
    const { isPinned, togglePin, getPinned } = await import('../pinned');
    togglePin({ ref: 'grid-code/ECC.6.3.7', title: 'FRT' });
    expect(isPinned('grid-code/ECC.6.3.7')).toBe(true);
    expect(getPinned()).toHaveLength(1);

    togglePin({ ref: 'grid-code/ECC.6.3.7', title: 'FRT' });
    expect(isPinned('grid-code/ECC.6.3.7')).toBe(false);
    expect(getPinned()).toHaveLength(0);
  });

  it('keeps multiple pins independent', async () => {
    const { isPinned, togglePin, getPinned } = await import('../pinned');
    togglePin({ ref: 'grid-code/ECC.6.3.7',  title: 'Freq Resp' });
    togglePin({ ref: 'erec-g99/13.6',        title: 'G99 FRT' });
    togglePin({ ref: 'nc-rfg/Art.14',        title: 'RfG Type C' });

    expect(getPinned()).toHaveLength(3);
    expect(isPinned('grid-code/ECC.6.3.7')).toBe(true);
    expect(isPinned('erec-g99/13.6')).toBe(true);
    expect(isPinned('nc-rfg/Art.14')).toBe(true);

    togglePin({ ref: 'erec-g99/13.6', title: 'G99 FRT' });
    expect(getPinned()).toHaveLength(2);
    expect(isPinned('erec-g99/13.6')).toBe(false);
  });

  it('clears all pins', async () => {
    const { togglePin, getPinned, clearPins } = await import('../pinned');
    togglePin({ ref: 'a', title: 'A' });
    togglePin({ ref: 'b', title: 'B' });
    expect(getPinned()).toHaveLength(2);
    clearPins();
    expect(getPinned()).toEqual([]);
  });

  it('survives corrupted localStorage', async () => {
    storage.setItem('eee-grid-pinned-v1', 'not-json{');
    const { getPinned } = await import('../pinned');
    expect(getPinned()).toEqual([]);
  });
});
