// src/lib/grid-code/local-pdfs.ts
// IndexedDB-backed local PDF storage for the Grid Code Viewer.
//
// Why this exists: most GB grid-code PDFs (NESO, ENA, DCode) are hosted
// by the publisher and can't be fetched cross-origin (CORS) or framed
// (X-Frame-Options), so we can't render them in PDF.js directly. Asking
// the user to upload their own copy sidesteps both — the file lives in
// their browser only (we never upload, never re-host), so there's no
// CORS issue and no copyright concern.

const DB_NAME    = 'eee-grid-code';
const STORE_NAME = 'local-pdfs';
const DB_VERSION = 1;

export interface LocalPdfRecord {
  docId: string;
  fileName: string;
  blob: Blob;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  // clauseId -> 1-based page number, populated by post-upload extraction.
  // Absent when the PDF hasn't been indexed yet, or when extraction failed.
  clausePages?: Record<string, number>;
}

function indexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined' && !!crypto.subtle;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!indexedDbAvailable()) {
      reject(new Error('IndexedDB / crypto.subtle unavailable in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'docId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function sha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function storeLocalPdf(docId: string, file: File): Promise<LocalPdfRecord> {
  if (!indexedDbAvailable()) throw new Error('Local PDF storage unavailable');

  const hash = await sha256(file);
  const record: LocalPdfRecord = {
    docId,
    fileName:  file.name,
    blob:      file,
    sizeBytes: file.size,
    sha256:    hash,
    uploadedAt: new Date().toISOString(),
  };

  const db = await openDb();
  return new Promise<LocalPdfRecord>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => { db.close(); resolve(record); };
    tx.onerror    = () => { db.close(); reject(tx.error ?? new Error('Store failed')); };
  });
}

export async function getLocalPdf(docId: string): Promise<LocalPdfRecord | null> {
  if (!indexedDbAvailable()) return null;
  const db = await openDb();
  return new Promise<LocalPdfRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(docId);
    req.onsuccess = () => { db.close(); resolve((req.result as LocalPdfRecord | undefined) ?? null); };
    req.onerror   = () => { db.close(); reject(req.error ?? new Error('Read failed')); };
  });
}

// Update the clausePages sidecar without re-hashing the blob. No-op when
// no record exists for docId (defensive — the upload may have been removed
// while a background extraction was still running).
export async function setLocalPdfClausePages(
  docId: string,
  clausePages: Record<string, number>,
): Promise<void> {
  if (!indexedDbAvailable()) return;
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(docId);
    getReq.onsuccess = () => {
      const rec = getReq.result as LocalPdfRecord | undefined;
      if (rec) {
        rec.clausePages = clausePages;
        store.put(rec);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error ?? new Error('Update failed')); };
  });
}

export async function removeLocalPdf(docId: string): Promise<void> {
  if (!indexedDbAvailable()) return;
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(docId);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error ?? new Error('Delete failed')); };
  });
}

export async function listLocalPdfs(): Promise<LocalPdfRecord[]> {
  if (!indexedDbAvailable()) return [];
  const db = await openDb();
  return new Promise<LocalPdfRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => { db.close(); resolve((req.result as LocalPdfRecord[] | undefined) ?? []); };
    req.onerror   = () => { db.close(); reject(req.error ?? new Error('List failed')); };
  });
}

export function formatBytes(n: number): string {
  if (n < 1024)         return `${n} B`;
  if (n < 1024 * 1024)  return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
