import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist the mock object so vi.mock (also hoisted) can reference it
const mockSupabaseModule = vi.hoisted(() => ({
  supabase: null as any,
  isSupabaseConfigured: false,
}));

vi.mock('./supabase', () => mockSupabaseModule);

import {
  getCurrentUserId,
  loadCloudProgress,
  saveCloudProgress,
  getLocalProgress,
  saveLocalProgress,
  mergeProgress,
  syncOnLogin,
  pullAndMerge,
  syncOnPageLoad,
  queueSync,
  loadCustomContent,
  saveCustomContent,
} from './sync';

import { emptyCustomContent } from '../types/custom-content';

// --- Mock Helpers ---

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

function createMockSupabaseClient(overrides: {
  session?: { user: { id: string } } | null;
  selectResult?: { data: any; error: any };
  upsertResult?: { error: any };
} = {}) {
  const {
    session = null,
    selectResult = { data: null, error: null },
    upsertResult = { error: null },
  } = overrides;

  const mockSingle = vi.fn().mockResolvedValue(selectResult);
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockUpsert = vi.fn().mockResolvedValue(upsertResult);
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
  });

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session },
      }),
    },
    from: mockFrom,
    _mocks: { mockFrom, mockSelect, mockEq, mockSingle, mockUpsert },
  };
}

function setupSupabase(overrides?: Parameters<typeof createMockSupabaseClient>[0]) {
  const client = createMockSupabaseClient(overrides);
  mockSupabaseModule.supabase = client as any;
  mockSupabaseModule.isSupabaseConfigured = true;
  return client;
}

const mockLocalStorage = createMockStorage();
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

const mockReload = vi.fn();
Object.defineProperty(globalThis, 'window', {
  value: { location: { reload: mockReload } },
  writable: true,
});

vi.spyOn(console, 'log').mockImplementation(() => {});

beforeEach(() => {
  mockLocalStorage.clear();
  mockReload.mockClear();
  mockSupabaseModule.supabase = null;
  mockSupabaseModule.isSupabaseConfigured = false;
  vi.restoreAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

// --- Tests ---

describe('getCurrentUserId', () => {
  it('returns null when Supabase is not configured', async () => {
    expect(await getCurrentUserId()).toBeNull();
  });

  it('returns null when supabase client is null', async () => {
    mockSupabaseModule.isSupabaseConfigured = true;
    mockSupabaseModule.supabase = null;
    expect(await getCurrentUserId()).toBeNull();
  });

  it('returns null when no active session', async () => {
    setupSupabase({ session: null });
    expect(await getCurrentUserId()).toBeNull();
  });

  it('returns user ID when session exists', async () => {
    setupSupabase({ session: { user: { id: 'user-123' } } });
    expect(await getCurrentUserId()).toBe('user-123');
  });
});

describe('loadCloudProgress', () => {
  it('returns null when Supabase not configured', async () => {
    expect(await loadCloudProgress()).toBeNull();
  });

  it('returns null when no user session', async () => {
    setupSupabase({ session: null });
    expect(await loadCloudProgress()).toBeNull();
  });

  it('returns null on query error', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: null, error: { message: 'fail' } },
    });
    expect(await loadCloudProgress()).toBeNull();
  });

  it('returns null when data is null', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: null, error: null },
    });
    expect(await loadCloudProgress()).toBeNull();
  });

  it('returns progress from cloud data', async () => {
    const progress = { complete: ['a:b'], important: ['c:d'] };
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress }, error: null },
    });
    expect(await loadCloudProgress()).toEqual(progress);
  });

  it('queries correct table, column, and user_id', async () => {
    const client = setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress: { complete: [], important: [] } }, error: null },
    });
    await loadCloudProgress();

    expect(client._mocks.mockFrom).toHaveBeenCalledWith('user_progress');
    expect(client._mocks.mockSelect).toHaveBeenCalledWith('progress');
    expect(client._mocks.mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(client._mocks.mockSingle).toHaveBeenCalled();
  });
});

describe('saveCloudProgress', () => {
  const progress = { complete: ['a:b'], important: [] };

  it('returns early when Supabase not configured', async () => {
    await saveCloudProgress(progress);
    // No error thrown, and no Supabase calls made
  });

  it('returns early when no user session', async () => {
    const client = setupSupabase({ session: null });
    await saveCloudProgress(progress);
    expect(client._mocks.mockUpsert).not.toHaveBeenCalled();
  });

  it('upserts with correct payload', async () => {
    const client = setupSupabase({ session: { user: { id: 'user-123' } } });
    await saveCloudProgress(progress);

    expect(client._mocks.mockFrom).toHaveBeenCalledWith('user_progress');
    expect(client._mocks.mockUpsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      progress,
      updated_at: expect.any(String),
    });
  });

  it('includes ISO timestamp in updated_at', async () => {
    const client = setupSupabase({ session: { user: { id: 'user-123' } } });
    await saveCloudProgress(progress);

    const payload = client._mocks.mockUpsert.mock.calls[0][0];
    expect(payload.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('getLocalProgress', () => {
  it('returns empty default when nothing saved', () => {
    expect(getLocalProgress()).toEqual({ complete: [], important: [] });
  });

  it('returns parsed progress from localStorage', () => {
    const progress = { complete: ['a:b'], important: ['c:d'] };
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify(progress));
    expect(getLocalProgress()).toEqual(progress);
  });

  it('returns empty default on JSON parse error', () => {
    mockLocalStorage.setItem('eee-progress-v2', 'not-json');
    expect(getLocalProgress()).toEqual({ complete: [], important: [] });
  });

  it('reads from correct storage key', () => {
    const progress = { complete: ['x:y'], important: [] };
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify(progress));
    // wrong key should not return our data
    mockLocalStorage.setItem('wrong-key', JSON.stringify({ complete: ['wrong'], important: [] }));
    expect(getLocalProgress()).toEqual(progress);
  });
});

describe('saveLocalProgress', () => {
  it('writes stringified progress to localStorage', () => {
    const progress = { complete: ['x:y'], important: [] };
    saveLocalProgress(progress);
    expect(mockLocalStorage.getItem('eee-progress-v2')).toBe(JSON.stringify(progress));
  });

  it('overwrites previous data', () => {
    saveLocalProgress({ complete: ['a'], important: [] });
    saveLocalProgress({ complete: ['b'], important: ['c'] });
    expect(JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!)).toEqual({
      complete: ['b'],
      important: ['c'],
    });
  });
});

describe('mergeProgress', () => {
  it('merges disjoint complete arrays', () => {
    const result = mergeProgress(
      { complete: ['a'], important: [] },
      { complete: ['b'], important: [] },
    );
    expect(result.complete).toEqual(['a', 'b']);
  });

  it('merges disjoint important arrays', () => {
    const result = mergeProgress(
      { complete: [], important: ['x'] },
      { complete: [], important: ['y'] },
    );
    expect(result.important).toEqual(['x', 'y']);
  });

  it('deduplicates complete entries', () => {
    const result = mergeProgress(
      { complete: ['a', 'b'], important: [] },
      { complete: ['b', 'c'], important: [] },
    );
    expect(result.complete).toEqual(['a', 'b', 'c']);
  });

  it('deduplicates important entries', () => {
    const result = mergeProgress(
      { complete: [], important: ['x', 'y'] },
      { complete: [], important: ['y', 'z'] },
    );
    expect(result.important).toEqual(['x', 'y', 'z']);
  });

  it('handles both arrays empty', () => {
    const result = mergeProgress(
      { complete: [], important: [] },
      { complete: [], important: [] },
    );
    expect(result).toEqual({ complete: [], important: [] });
  });

  it('handles a empty, b non-empty', () => {
    const result = mergeProgress(
      { complete: [], important: [] },
      { complete: ['a'], important: ['x'] },
    );
    expect(result).toEqual({ complete: ['a'], important: ['x'] });
  });

  it('handles a non-empty, b empty', () => {
    const result = mergeProgress(
      { complete: ['a'], important: ['x'] },
      { complete: [], important: [] },
    );
    expect(result).toEqual({ complete: ['a'], important: ['x'] });
  });

  it('handles full overlap', () => {
    const result = mergeProgress(
      { complete: ['a', 'b'], important: ['x'] },
      { complete: ['a', 'b'], important: ['x'] },
    );
    expect(result).toEqual({ complete: ['a', 'b'], important: ['x'] });
  });

  it('preserves order: a elements first, then new from b', () => {
    const result = mergeProgress(
      { complete: ['c', 'a'], important: [] },
      { complete: ['b', 'a'], important: [] },
    );
    expect(result.complete).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate inputs', () => {
    const a = { complete: ['a'], important: ['x'] };
    const b = { complete: ['b'], important: ['y'] };
    const aCopy = { complete: [...a.complete], important: [...a.important] };
    const bCopy = { complete: [...b.complete], important: [...b.important] };

    mergeProgress(a, b);

    expect(a).toEqual(aCopy);
    expect(b).toEqual(bCopy);
  });
});

describe('syncOnLogin', () => {
  it('returns early when Supabase not configured', async () => {
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));
    await syncOnLogin();
    // localStorage unchanged
    expect(JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!)).toEqual({
      complete: ['a'],
      important: [],
    });
  });

  it('uses only local when no cloud data', async () => {
    const client = setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: null, error: null },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    await syncOnLogin();

    expect(JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!)).toEqual({
      complete: ['a'],
      important: [],
    });
    expect(client._mocks.mockUpsert).toHaveBeenCalled();
  });

  it('merges local and cloud when both exist', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: {
        data: { progress: { complete: ['b'], important: ['x'] } },
        error: null,
      },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    await syncOnLogin();

    const saved = JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!);
    expect(saved.complete).toContain('a');
    expect(saved.complete).toContain('b');
    expect(saved.important).toContain('x');
  });

  it('saves merged result to localStorage', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: {
        data: { progress: { complete: ['b'], important: [] } },
        error: null,
      },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    await syncOnLogin();

    const saved = JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!);
    expect(saved).toEqual({ complete: ['a', 'b'], important: [] });
  });

  it('saves merged result to cloud', async () => {
    const client = setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: {
        data: { progress: { complete: ['b'], important: [] } },
        error: null,
      },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    await syncOnLogin();

    expect(client._mocks.mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        progress: { complete: ['a', 'b'], important: [] },
      }),
    );
  });
});

describe('pullAndMerge', () => {
  it('returns false when Supabase not configured', async () => {
    expect(await pullAndMerge()).toBe(false);
  });

  it('returns false when no user session', async () => {
    setupSupabase({ session: null });
    expect(await pullAndMerge()).toBe(false);
  });

  it('returns false when no cloud data', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: null, error: null },
    });
    expect(await pullAndMerge()).toBe(false);
  });

  it('returns false when local equals cloud', async () => {
    const progress = { complete: ['a'], important: [] };
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress }, error: null },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify(progress));

    expect(await pullAndMerge()).toBe(false);
  });

  it('returns true and overwrites local when cloud differs', async () => {
    const cloudProgress = { complete: ['a', 'b'], important: ['x'] };
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress: cloudProgress }, error: null },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    expect(await pullAndMerge()).toBe(true);
    expect(JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!)).toEqual(cloudProgress);
  });

  it('trusts cloud data (overwrites, does not merge)', async () => {
    const cloudProgress = { complete: ['y'], important: [] };
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress: cloudProgress }, error: null },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['x'], important: [] }));

    await pullAndMerge();

    const saved = JSON.parse(mockLocalStorage.getItem('eee-progress-v2')!);
    expect(saved).toEqual(cloudProgress);
    expect(saved.complete).not.toContain('x');
  });
});

describe('syncOnPageLoad', () => {
  it('reloads page when changes detected', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress: { complete: ['new'], important: [] } }, error: null },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: [], important: [] }));

    await syncOnPageLoad();

    expect(mockReload).toHaveBeenCalledOnce();
  });

  it('does not reload when no changes', async () => {
    const progress = { complete: ['a'], important: [] };
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { progress }, error: null },
    });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify(progress));

    await syncOnPageLoad();

    expect(mockReload).not.toHaveBeenCalled();
  });

  it('does not reload when Supabase not configured', async () => {
    await syncOnPageLoad();
    expect(mockReload).not.toHaveBeenCalled();
  });
});

describe('queueSync', () => {
  it('does nothing when Supabase not configured', async () => {
    vi.useFakeTimers();
    queueSync();
    await vi.advanceTimersByTimeAsync(2000);
    // No error, no calls
  });

  it('saves local progress to cloud after 1s debounce', async () => {
    vi.useFakeTimers();
    const client = setupSupabase({ session: { user: { id: 'user-123' } } });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    queueSync();
    await vi.advanceTimersByTimeAsync(1000);

    expect(client._mocks.mockUpsert).toHaveBeenCalledOnce();
  });

  it('debounces: multiple rapid calls only trigger one save', async () => {
    vi.useFakeTimers();
    const client = setupSupabase({ session: { user: { id: 'user-123' } } });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    queueSync();
    queueSync();
    queueSync();
    await vi.advanceTimersByTimeAsync(1000);

    expect(client._mocks.mockUpsert).toHaveBeenCalledOnce();
  });

  it('resets timer on subsequent calls', async () => {
    vi.useFakeTimers();
    const client = setupSupabase({ session: { user: { id: 'user-123' } } });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    queueSync();
    await vi.advanceTimersByTimeAsync(500);
    expect(client._mocks.mockUpsert).not.toHaveBeenCalled();

    queueSync(); // resets the timer
    await vi.advanceTimersByTimeAsync(500);
    expect(client._mocks.mockUpsert).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    expect(client._mocks.mockUpsert).toHaveBeenCalledOnce();
  });

  it('does not save before timeout elapses', async () => {
    vi.useFakeTimers();
    const client = setupSupabase({ session: { user: { id: 'user-123' } } });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    queueSync();
    await vi.advanceTimersByTimeAsync(999);

    expect(client._mocks.mockUpsert).not.toHaveBeenCalled();
  });

  it('does not save when no user session at callback time', async () => {
    vi.useFakeTimers();
    const client = setupSupabase({ session: null });
    mockLocalStorage.setItem('eee-progress-v2', JSON.stringify({ complete: ['a'], important: [] }));

    queueSync();
    await vi.advanceTimersByTimeAsync(1000);

    expect(client._mocks.mockUpsert).not.toHaveBeenCalled();
  });
});

describe('loadCustomContent', () => {
  it('returns emptyCustomContent when not configured', async () => {
    expect(await loadCustomContent()).toEqual(emptyCustomContent);
  });

  it('returns emptyCustomContent when supabase client is null', async () => {
    mockSupabaseModule.isSupabaseConfigured = true;
    mockSupabaseModule.supabase = null;
    expect(await loadCustomContent()).toEqual(emptyCustomContent);
  });

  it('returns emptyCustomContent when no user session', async () => {
    setupSupabase({ session: null });
    expect(await loadCustomContent()).toEqual(emptyCustomContent);
  });

  it('returns emptyCustomContent on query error', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: null, error: { message: 'fail' } },
    });
    expect(await loadCustomContent()).toEqual(emptyCustomContent);
  });

  it('returns emptyCustomContent when custom_content is null', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { custom_content: null }, error: null },
    });
    expect(await loadCustomContent()).toEqual(emptyCustomContent);
  });

  it('returns custom content from cloud', async () => {
    const content = {
      tracks: {},
      concepts: { 'fundamentals/dc-circuits': [{ name: 'Custom', isCustom: true as const }] },
      conceptNotes: { 'fundamentals/dc-circuits/ohms-law': 'My notes' },
    };
    setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { custom_content: content }, error: null },
    });
    expect(await loadCustomContent()).toEqual(content);
  });

  it('queries correct column', async () => {
    const client = setupSupabase({
      session: { user: { id: 'user-123' } },
      selectResult: { data: { custom_content: emptyCustomContent }, error: null },
    });
    await loadCustomContent();

    expect(client._mocks.mockSelect).toHaveBeenCalledWith('custom_content');
  });
});

describe('saveCustomContent', () => {
  const content = { tracks: {}, concepts: {}, conceptNotes: {} };

  it('returns false when not configured', async () => {
    expect(await saveCustomContent(content)).toBe(false);
  });

  it('returns false when supabase client is null', async () => {
    mockSupabaseModule.isSupabaseConfigured = true;
    mockSupabaseModule.supabase = null;
    expect(await saveCustomContent(content)).toBe(false);
  });

  it('returns false when no user session', async () => {
    setupSupabase({ session: null });
    expect(await saveCustomContent(content)).toBe(false);
  });

  it('returns true on successful save', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      upsertResult: { error: null },
    });
    expect(await saveCustomContent(content)).toBe(true);
  });

  it('returns false on upsert error', async () => {
    setupSupabase({
      session: { user: { id: 'user-123' } },
      upsertResult: { error: { message: 'fail' } },
    });
    expect(await saveCustomContent(content)).toBe(false);
  });

  it('upserts with correct payload', async () => {
    const client = setupSupabase({
      session: { user: { id: 'user-123' } },
      upsertResult: { error: null },
    });
    await saveCustomContent(content);

    expect(client._mocks.mockFrom).toHaveBeenCalledWith('user_progress');
    expect(client._mocks.mockUpsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      custom_content: content,
      updated_at: expect.any(String),
    });
  });
});
