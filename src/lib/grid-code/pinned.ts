// src/lib/grid-code/pinned.ts
// localStorage-backed pinned clauses (Phase 1). Cloud sync intentionally deferred.

const STORAGE_KEY = 'eee-grid-pinned-v1';

export interface Pin {
  ref: string;          // clause ref or docId
  title: string;
  pinnedAt: string;     // ISO date
  note?: string;
}

function safeRead(): Pin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(pins: Pin[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch {
    // Quota or disabled storage — silently ignore in Phase 1
  }
}

export function getPinned(): Pin[] {
  return safeRead();
}

export function isPinned(ref: string): boolean {
  return safeRead().some(p => p.ref === ref);
}

export function togglePin(pin: Omit<Pin, 'pinnedAt'>): Pin[] {
  const current = safeRead();
  const idx = current.findIndex(p => p.ref === pin.ref);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push({ ...pin, pinnedAt: new Date().toISOString() });
  }
  safeWrite(current);
  return current;
}

export function clearPins(): void {
  safeWrite([]);
}
