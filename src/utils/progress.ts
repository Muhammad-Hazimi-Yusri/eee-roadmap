/**
 * Progress tracking utilities for storing completion and importance states.
 * Supports both localStorage (persistent) and sessionStorage (per-session).
 * 
 * @module progress
 */

/** Storage type options */
export type StorageType = 'local' | 'session';

/** Progress state containing arrays of completed and important item keys */
export interface ProgressState {
  complete: string[];
  important: string[];
}

/** Progress store interface with all state management methods */
export interface ProgressStore {
  /** Get full progress state */
  getProgress: () => ProgressState;
  /** Check if key is marked complete */
  isComplete: (key: string) => boolean;
  /** Check if key is marked important */
  isImportant: (key: string) => boolean;
  /** Toggle complete state, returns new state */
  toggleComplete: (key: string) => boolean;
  /** Toggle important state, returns new state */
  toggleImportant: (key: string) => boolean;
  /** Set key as complete (idempotent), returns true if state changed */
  setComplete: (key: string) => boolean;
  /** Set key as important (idempotent), returns true if state changed */
  setImportant: (key: string) => boolean;
  /** Reset both states for a key */
  resetState: (key: string) => void;
  /** Clear all progress data */
  clearAll: () => void;
}

/**
 * Factory function to create a progress store.
 * 
 * @param storageKey - Key used in storage (e.g., 'eee-progress-v2')
 * @param storageType - 'local' for persistent, 'session' for per-tab
 * @returns ProgressStore instance
 * 
 * @example
 * // Persistent storage for real roadmap
 * const store = createProgressStore('eee-progress-v2', 'local');
 * 
 * @example
 * // Session storage for demo (clears on tab close)
 * const demoStore = createProgressStore('eee-demo', 'session');
 */
export function createProgressStore(
  storageKey: string,
  storageType: StorageType = 'local'
): ProgressStore {
  
  function getStorage(): Storage | null {
    try {
      return storageType === 'local' ? localStorage : sessionStorage;
    } catch {
      return null;
    }
  }

  function getProgress(): ProgressState {
    const storage = getStorage();
    if (!storage) return { complete: [], important: [] };
    
    const saved = storage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { complete: [], important: [] };
  }

  function saveProgress(progress: ProgressState): void {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(storageKey, JSON.stringify(progress));
  }

  function isComplete(key: string): boolean {
    return getProgress().complete.includes(key);
  }

  function isImportant(key: string): boolean {
    return getProgress().important.includes(key);
  }

  function toggleComplete(key: string): boolean {
    const progress = getProgress();
    if (progress.complete.includes(key)) {
      progress.complete = progress.complete.filter(k => k !== key);
      saveProgress(progress);
      return false;
    } else {
      progress.complete.push(key);
      saveProgress(progress);
      return true;
    }
  }

  function toggleImportant(key: string): boolean {
    const progress = getProgress();
    if (progress.important.includes(key)) {
      progress.important = progress.important.filter(k => k !== key);
      saveProgress(progress);
      return false;
    } else {
      progress.important.push(key);
      saveProgress(progress);
      return true;
    }
  }

  function setComplete(key: string): boolean {
    const progress = getProgress();
    if (progress.complete.includes(key)) return false;
    progress.complete.push(key);
    saveProgress(progress);
    return true;
  }

  function setImportant(key: string): boolean {
    const progress = getProgress();
    if (progress.important.includes(key)) return false;
    progress.important.push(key);
    saveProgress(progress);
    return true;
  }

  function resetState(key: string): void {
    const progress = getProgress();
    progress.complete = progress.complete.filter(k => k !== key);
    progress.important = progress.important.filter(k => k !== key);
    saveProgress(progress);
  }

  function clearAll(): void {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(storageKey);
  }

  return {
    getProgress,
    isComplete,
    isImportant,
    toggleComplete,
    toggleImportant,
    setComplete,
    setImportant,
    resetState,
    clearAll,
  };
}