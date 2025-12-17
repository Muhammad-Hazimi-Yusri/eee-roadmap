// src/utils/progress.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  getProgress,
  saveProgress,
  isComplete,
  isImportant,
  toggleComplete,
  toggleImportant,
  setComplete,
  setImportant,
  resetState,
} from './progress';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('progress utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getProgress', () => {
    it('returns empty state when nothing saved', () => {
      const progress = getProgress();
      expect(progress).toEqual({ complete: [], important: [] });
    });

    it('returns saved state', () => {
      const saved = { complete: ['a:b'], important: ['c:d'] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      
      const progress = getProgress();
      expect(progress).toEqual(saved);
    });
  });

  describe('saveProgress', () => {
    it('saves state to localStorage', () => {
      const state = { complete: ['x:y'], important: [] };
      saveProgress(state);
      
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved).toEqual(state);
    });
  });

  describe('isComplete', () => {
    it('returns false when key not in complete list', () => {
      expect(isComplete('topic:concept')).toBe(false);
    });

    it('returns true when key in complete list', () => {
      saveProgress({ complete: ['topic:concept'], important: [] });
      expect(isComplete('topic:concept')).toBe(true);
    });
  });

  describe('isImportant', () => {
    it('returns false when key not in important list', () => {
      expect(isImportant('topic:concept')).toBe(false);
    });

    it('returns true when key in important list', () => {
      saveProgress({ complete: [], important: ['topic:concept'] });
      expect(isImportant('topic:concept')).toBe(true);
    });
  });

  describe('toggleComplete', () => {
    it('adds key and returns true when not complete', () => {
      const result = toggleComplete('topic:concept');
      
      expect(result).toBe(true);
      expect(isComplete('topic:concept')).toBe(true);
    });

    it('removes key and returns false when already complete', () => {
      saveProgress({ complete: ['topic:concept'], important: [] });
      
      const result = toggleComplete('topic:concept');
      
      expect(result).toBe(false);
      expect(isComplete('topic:concept')).toBe(false);
    });
  });

  describe('toggleImportant', () => {
    it('adds key and returns true when not important', () => {
      const result = toggleImportant('topic:concept');
      
      expect(result).toBe(true);
      expect(isImportant('topic:concept')).toBe(true);
    });

    it('removes key and returns false when already important', () => {
      saveProgress({ complete: [], important: ['topic:concept'] });
      
      const result = toggleImportant('topic:concept');
      
      expect(result).toBe(false);
      expect(isImportant('topic:concept')).toBe(false);
    });
  });

  describe('setComplete', () => {
    it('adds key and returns true when not complete', () => {
      const result = setComplete('topic:concept');
      
      expect(result).toBe(true);
      expect(isComplete('topic:concept')).toBe(true);
    });

    it('returns false when already complete (no duplicate)', () => {
      saveProgress({ complete: ['topic:concept'], important: [] });
      
      const result = setComplete('topic:concept');
      
      expect(result).toBe(false);
      expect(getProgress().complete.filter(k => k === 'topic:concept').length).toBe(1);
    });
  });

  describe('setImportant', () => {
    it('adds key and returns true when not important', () => {
      const result = setImportant('topic:concept');
      
      expect(result).toBe(true);
      expect(isImportant('topic:concept')).toBe(true);
    });

    it('returns false when already important (no duplicate)', () => {
      saveProgress({ complete: [], important: ['topic:concept'] });
      
      const result = setImportant('topic:concept');
      
      expect(result).toBe(false);
      expect(getProgress().important.filter(k => k === 'topic:concept').length).toBe(1);
    });
  });

  describe('resetState', () => {
    it('removes key from both complete and important', () => {
      saveProgress({ complete: ['topic:concept'], important: ['topic:concept'] });
      
      resetState('topic:concept');
      
      expect(isComplete('topic:concept')).toBe(false);
      expect(isImportant('topic:concept')).toBe(false);
    });

    it('preserves other keys', () => {
      saveProgress({ complete: ['a:b', 'c:d'], important: ['a:b', 'e:f'] });
      
      resetState('a:b');
      
      expect(isComplete('c:d')).toBe(true);
      expect(isImportant('e:f')).toBe(true);
    });
  });
});