import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'eee-progress-v2';

interface ProgressState {
  complete: string[];
  important: string[];
}

// Get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// Load progress from Supabase
export async function loadCloudProgress(): Promise<ProgressState | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  
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

// Save progress to Supabase
export async function saveCloudProgress(progress: ProgressState): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      progress,
      updated_at: new Date().toISOString(),
    });
}

// Local storage helpers
export function getLocalProgress(): ProgressState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { complete: [], important: [] };
  } catch {
    return { complete: [], important: [] };
  }
}

export function saveLocalProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Merge two progress states (union)
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  return {
    complete: [...new Set([...a.complete, ...b.complete])],
    important: [...new Set([...a.important, ...b.important])],
  };
}

// Sync on login - merge local and cloud, save to both
export async function syncOnLogin(): Promise<void> {
  if (!isSupabaseConfigured) return;
  
  console.log('Signed in, syncing progress...');
  
  const local = getLocalProgress();
  const cloud = await loadCloudProgress();
  
  const merged = cloud ? mergeProgress(local, cloud) : local;
  
  saveLocalProgress(merged);
  await saveCloudProgress(merged);
  
  console.log('Progress synced:', merged);
}

// Pull from cloud and apply - returns true if there were changes
export async function pullAndMerge(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  
  const userId = await getCurrentUserId();
  if (!userId) return false;
  
  const local = getLocalProgress();
  const cloud = await loadCloudProgress();
  
  if (!cloud) return false;
  
  const localStr = JSON.stringify(local);
  const cloudStr = JSON.stringify(cloud);
  
  if (localStr !== cloudStr) {
    // Trust cloud since we push immediately on every change
    saveLocalProgress(cloud);
    console.log('Progress synced from cloud');
    return true;
  }
  
  return false;
}

// Sync on page load - pull from cloud and reload if changes
export async function syncOnPageLoad(): Promise<void> {
  const hasChanges = await pullAndMerge();
  if (hasChanges) {
    window.location.reload();
  }
}

// Debounced sync for continuous updates
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function queueSync(): void {
  if (!isSupabaseConfigured) return;
  
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const progress = getLocalProgress();
    await saveCloudProgress(progress);
    console.log('Progress synced to cloud');
  }, 1000);
}