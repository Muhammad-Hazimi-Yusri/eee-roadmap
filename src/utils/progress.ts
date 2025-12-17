// src/utils/progress.ts

export const STORAGE_KEY = 'eee-progress-v2';

export interface ProgressState {
  complete: string[];  // ["topicId:concept", ...]
  important: string[]; // ["topicId:concept", ...]
}

export function getProgress(): ProgressState {
  if (typeof localStorage === 'undefined') {
    return { complete: [], important: [] };
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : { complete: [], important: [] };
}

export function saveProgress(progress: ProgressState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isComplete(key: string): boolean {
  return getProgress().complete.includes(key);
}

export function isImportant(key: string): boolean {
  return getProgress().important.includes(key);
}

export function toggleComplete(key: string): boolean {
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

export function toggleImportant(key: string): boolean {
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

export function setComplete(key: string): boolean {
  const progress = getProgress();
  if (progress.complete.includes(key)) return false;
  progress.complete.push(key);
  saveProgress(progress);
  return true;
}

export function setImportant(key: string): boolean {
  const progress = getProgress();
  if (progress.important.includes(key)) return false;
  progress.important.push(key);
  saveProgress(progress);
  return true;
}

export function resetState(key: string): void {
  const progress = getProgress();
  progress.complete = progress.complete.filter(k => k !== key);
  progress.important = progress.important.filter(k => k !== key);
  saveProgress(progress);
}