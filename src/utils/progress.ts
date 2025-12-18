// src/utils/progress.ts

export interface ProgressState {
  complete: string[];
  important: string[];
}

export interface ProgressStore {
  getProgress: () => ProgressState;
  isComplete: (key: string) => boolean;
  isImportant: (key: string) => boolean;
  toggleComplete: (key: string) => boolean;
  toggleImportant: (key: string) => boolean;
  setComplete: (key: string) => boolean;
  setImportant: (key: string) => boolean;
  resetState: (key: string) => void;
  clearAll: () => void;
}

export type StorageType = 'local' | 'session';

/**
 * Create a progress store with specified storage backend
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