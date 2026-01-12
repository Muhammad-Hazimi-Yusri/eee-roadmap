import { supabase } from './supabase';
import type { ProgressState } from '../utils/progress';

const STORAGE_KEY = 'eee-progress-v2';

/** Get current user ID, or null if not logged in */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/** Load progress from Supabase */
export async function loadCloudProgress(): Promise<ProgressState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_progress')
    .select('progress')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.progress as ProgressState;
}

/** Save progress to Supabase */
export async function saveCloudProgress(progress: ProgressState): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      progress: progress,
    });

  return !error;
}

/** Get local progress from localStorage */
export function getLocalProgress(): ProgressState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { complete: [], important: [] };
  } catch {
    return { complete: [], important: [] };
  }
}

/** Save to localStorage */
export function saveLocalProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Merge two progress states (union of both) */
export function mergeProgress(local: ProgressState, cloud: ProgressState): ProgressState {
  return {
    complete: [...new Set([...local.complete, ...cloud.complete])],
    important: [...new Set([...local.important, ...cloud.important])],
  };
}

/** 
 * Sync on login: merge local + cloud, save to both 
 * Returns the merged progress
 */
export async function syncOnLogin(): Promise<ProgressState> {
  const local = getLocalProgress();
  const cloud = await loadCloudProgress();
  
  // If no cloud data, upload local
  if (!cloud) {
    await saveCloudProgress(local);
    return local;
  }
  
  // Merge and save to both
  const merged = mergeProgress(local, cloud);
  saveLocalProgress(merged);
  await saveCloudProgress(merged);
  
  return merged;
}

/** Debounced sync - call this after any progress change */
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function queueSync(): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const local = getLocalProgress();
    await saveCloudProgress(local);
  }, 1000);
}