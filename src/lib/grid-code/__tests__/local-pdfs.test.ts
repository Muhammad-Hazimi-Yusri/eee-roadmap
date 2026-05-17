// Unit tests for local-pdfs.ts — the IndexedDB-backed PDF blob store.
// Vitest's default env is node, so we mock IndexedDB + crypto.subtle.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Minimal in-memory IndexedDB shim (enough for our usage) ───────────────────
type Row = { docId: string; [k: string]: unknown };

type MockReq<T = unknown> = {
  result: T | undefined;
  error: unknown;
  onsuccess: null | (() => void);
  onerror:   null | (() => void);
  onupgradeneeded?: null | (() => void);
};

function makeMockIndexedDb() {
  const stores = new Map<string, Map<string, Row>>();

  function makeDb() {
    return {
      objectStoreNames: { contains: (n: string) => stores.has(n) },
      createObjectStore(name: string) {
        stores.set(name, new Map());
        return {};
      },
      transaction(name: string) {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name)!;
        const tx: {
          oncomplete: null | (() => void);
          onerror:    null | (() => void);
          error: null;
          objectStore: () => unknown;
        } = {
          oncomplete: null,
          onerror: null,
          error: null,
          objectStore: () => ({}),
        };
        const pending: Array<{ req: MockReq; exec: () => unknown }> = [];
        queueMicrotask(() => {
          for (const { req, exec } of pending) {
            try {
              req.result = exec();
              req.onsuccess?.();
            } catch (err) {
              req.error = err;
              req.onerror?.();
            }
          }
          tx.oncomplete?.();
        });
        tx.objectStore = () => ({
          put(row: Row) {
            const req: MockReq = { result: undefined, error: null, onsuccess: null, onerror: null };
            pending.push({ req, exec: () => store.set(row.docId, row) });
            return req;
          },
          get(key: string) {
            const req: MockReq = { result: undefined, error: null, onsuccess: null, onerror: null };
            pending.push({ req, exec: () => store.get(key) });
            return req;
          },
          getAll() {
            const req: MockReq = { result: undefined, error: null, onsuccess: null, onerror: null };
            pending.push({ req, exec: () => [...store.values()] });
            return req;
          },
          delete(key: string) {
            const req: MockReq = { result: undefined, error: null, onsuccess: null, onerror: null };
            pending.push({ req, exec: () => store.delete(key) });
            return req;
          },
        });
        return tx;
      },
      close() { /* no-op */ },
    };
  }

  return {
    open(_name: string, _version: number) {
      const db = makeDb();
      const req: MockReq = {
        result: db,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      queueMicrotask(() => {
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
    _stores: stores,
  };
}

// crypto.subtle SHA-256 mock — deterministic per input
const mockCrypto = {
  subtle: {
    async digest(_algo: string, buf: ArrayBuffer) {
      const out = new ArrayBuffer(32);
      const view = new Uint8Array(out);
      const src  = new Uint8Array(buf);
      for (let i = 0; i < 32; i++) view[i] = (src[i % Math.max(1, src.length)] ?? 0) ^ i;
      return out;
    },
  },
};

let mockIdb: ReturnType<typeof makeMockIndexedDb>;

beforeEach(() => {
  mockIdb = makeMockIndexedDb();
  vi.stubGlobal('indexedDB', mockIdb);
  vi.stubGlobal('crypto', mockCrypto);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function makeFile(name: string, body: string): File {
  return new File([body], name, { type: 'application/pdf' });
}

describe('grid-code local-pdfs', () => {
  it('returns null for a doc with no upload', async () => {
    const { getLocalPdf } = await import('../local-pdfs');
    expect(await getLocalPdf('grid-code')).toBeNull();
  });

  it('stores and retrieves a PDF', async () => {
    const { storeLocalPdf, getLocalPdf } = await import('../local-pdfs');
    const file = makeFile('grid-code.pdf', 'fake-pdf-bytes');
    const rec = await storeLocalPdf('grid-code', file);
    expect(rec.docId).toBe('grid-code');
    expect(rec.fileName).toBe('grid-code.pdf');
    expect(rec.sizeBytes).toBe(file.size);
    expect(rec.sha256).toMatch(/^[0-9a-f]{64}$/);

    const got = await getLocalPdf('grid-code');
    expect(got).not.toBeNull();
    expect(got?.docId).toBe('grid-code');
    expect(got?.fileName).toBe('grid-code.pdf');
  });

  it('lists all uploaded PDFs', async () => {
    const { storeLocalPdf, listLocalPdfs } = await import('../local-pdfs');
    await storeLocalPdf('grid-code', makeFile('a.pdf', 'aaa'));
    await storeLocalPdf('erec-g99',  makeFile('b.pdf', 'bbb'));
    const list = await listLocalPdfs();
    expect(list.map(r => r.docId).sort()).toEqual(['erec-g99', 'grid-code']);
  });

  it('removes a stored PDF', async () => {
    const { storeLocalPdf, removeLocalPdf, getLocalPdf } = await import('../local-pdfs');
    await storeLocalPdf('grid-code', makeFile('a.pdf', 'aaa'));
    expect(await getLocalPdf('grid-code')).not.toBeNull();
    await removeLocalPdf('grid-code');
    expect(await getLocalPdf('grid-code')).toBeNull();
  });

  it('storing the same docId twice overwrites the previous', async () => {
    const { storeLocalPdf, getLocalPdf } = await import('../local-pdfs');
    await storeLocalPdf('grid-code', makeFile('v1.pdf', 'aaa'));
    await storeLocalPdf('grid-code', makeFile('v2.pdf', 'bbbbbb'));
    const got = await getLocalPdf('grid-code');
    expect(got?.fileName).toBe('v2.pdf');
    expect(got?.sizeBytes).toBe(6);
  });

  it('formatBytes handles boundaries', async () => {
    const { formatBytes } = await import('../local-pdfs');
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
