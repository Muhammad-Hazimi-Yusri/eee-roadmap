// src/utils/progress.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { createProgressStore, type ProgressStore } from './progress';

// Mock storage
function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage });

describe('createProgressStore', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  describe('with localStorage', () => {
    let store: ProgressStore;

    beforeEach(() => {
      store = createProgressStore('test-key', 'local');
    });

    it('returns empty state when nothing saved', () => {
      expect(store.getProgress()).toEqual({ complete: [], important: [] });
    });

    it('setComplete adds to complete list', () => {
      expect(store.setComplete('a:b')).toBe(true);
      expect(store.isComplete('a:b')).toBe(true);
    });

    it('setComplete returns false if already complete', () => {
      store.setComplete('a:b');
      expect(store.setComplete('a:b')).toBe(false);
    });

    it('setImportant adds to important list', () => {
      expect(store.setImportant('a:b')).toBe(true);
      expect(store.isImportant('a:b')).toBe(true);
    });

    it('setImportant returns false if already important', () => {
      store.setImportant('a:b');
      expect(store.setImportant('a:b')).toBe(false);
    });

    it('toggleComplete toggles state', () => {
      expect(store.toggleComplete('a:b')).toBe(true);
      expect(store.isComplete('a:b')).toBe(true);
      
      expect(store.toggleComplete('a:b')).toBe(false);
      expect(store.isComplete('a:b')).toBe(false);
    });

    it('toggleImportant toggles state', () => {
      expect(store.toggleImportant('a:b')).toBe(true);
      expect(store.isImportant('a:b')).toBe(true);
      
      expect(store.toggleImportant('a:b')).toBe(false);
      expect(store.isImportant('a:b')).toBe(false);
    });

    it('resetState removes from both lists', () => {
      store.setComplete('a:b');
      store.setImportant('a:b');
      
      store.resetState('a:b');
      
      expect(store.isComplete('a:b')).toBe(false);
      expect(store.isImportant('a:b')).toBe(false);
    });

    it('clearAll removes all data', () => {
      store.setComplete('a:b');
      store.setImportant('c:d');
      
      store.clearAll();
      
      expect(store.getProgress()).toEqual({ complete: [], important: [] });
    });
  });

  describe('with sessionStorage', () => {
    let store: ProgressStore;

    beforeEach(() => {
      store = createProgressStore('demo-key', 'session');
    });

    it('uses sessionStorage not localStorage', () => {
      store.setComplete('a:b');
      
      expect(mockSessionStorage.getItem('demo-key')).not.toBeNull();
      expect(mockLocalStorage.getItem('demo-key')).toBeNull();
    });
  });

  describe('isolation', () => {
    it('different keys are isolated', () => {
      const store1 = createProgressStore('key1', 'local');
      const store2 = createProgressStore('key2', 'local');

      store1.setComplete('item');
      
      expect(store1.isComplete('item')).toBe(true);
      expect(store2.isComplete('item')).toBe(false);
    });
  });
});