// src/lib/grid-code/reindex.ts
//
// Shared indexing pipeline: runs the two extraction phases (per-clause
// page numbers, then heading outline) against a local PDF and persists
// the results in IndexedDB. Used by:
//   - UploadDropzone, on a fresh upload (the user provided a new file)
//   - ViewerSplitPane, when a stale extractor version is detected on an
//     existing local copy (auto-upgrade) or when the user clicks the
//     manual "Re-index" footer action
//
// Both phases share the same blob; the second phase doesn't re-fetch.
// A per-doc in-flight map de-duplicates concurrent calls so the auto
// re-index and a user click can't both fire extraction simultaneously.

import {
  extractClausePages, extractDocumentOutline, EXTRACTOR_VERSION,
} from './pdf-extract';
import {
  setLocalPdfClausePages, setLocalPdfOutline, setLocalPdfExtractorVersion,
} from './local-pdfs';
import type { StandardClause } from './types';

export type IndexingPhase = 'clauses' | 'outline';

export interface IndexingProgress {
  phase:   IndexingPhase;
  current: number;
  total:   number;
}

export interface RunDocIndexingOptions {
  // Progress callback fired per page within each phase. The phase changes
  // when the clausePages walk finishes and the outline walk begins.
  onProgress?: (p: IndexingProgress) => void;
  // Per-phase wall-clock budget. Default 60 s each (enough for a
  // 700-page Grid Code on a modern machine; bails earlier on slow ones).
  timeoutMs?: number;
}

// docId -> in-flight promise. Awaits the existing run if a second call
// arrives while one is in progress. Cleared on settle (success or fail).
const inFlight = new Map<string, Promise<void>>();

/**
 * Run both indexing phases against `file`, persist results, and stamp
 * the record with the current EXTRACTOR_VERSION. Idempotent (a successful
 * re-run produces the same writes); safe to call repeatedly. Concurrent
 * calls for the same docId await the same underlying promise.
 *
 * If either extraction phase throws, the version stamp is NOT written
 * (so the next viewer load will retry). Any partial writes from the
 * first phase still take effect — that's intentional: a partial result
 * is better than the old garbage.
 */
export function runDocIndexing(
  docId: string,
  file: File | Blob,
  clauses: StandardClause[],
  opts: RunDocIndexingOptions = {},
): Promise<void> {
  const existing = inFlight.get(docId);
  if (existing) return existing;

  const run = (async () => {
    const timeoutMs = opts.timeoutMs ?? 60_000;
    const blob = file as Blob;

    // Phase 1: per-clause page numbers (drives auto-jump for curated
    // _clauses.yaml entries).
    const docClauses = clauses.filter(c => c.docId === docId);
    if (docClauses.length > 0) {
      const clauseIds = docClauses.map(c => c.clauseId);
      opts.onProgress?.({ phase: 'clauses', current: 0, total: 0 });
      const pages = await extractClausePages(blob, clauseIds, {
        timeoutMs,
        onProgress: (current, total) =>
          opts.onProgress?.({ phase: 'clauses', current, total }),
      });
      await setLocalPdfClausePages(docId, pages);
    }

    // Phase 2: heading outline (drives the OUTLINE tab).
    opts.onProgress?.({ phase: 'outline', current: 0, total: 0 });
    const outline = await extractDocumentOutline(blob, {
      timeoutMs,
      maxEntries: 500,
      onProgress: (current, total) =>
        opts.onProgress?.({ phase: 'outline', current, total }),
    });
    await setLocalPdfOutline(docId, outline);

    // Stamp the version last, so a failure leaves the record stale
    // (which triggers another retry on next load).
    await setLocalPdfExtractorVersion(docId, EXTRACTOR_VERSION);
  })();

  inFlight.set(docId, run);
  run.finally(() => {
    if (inFlight.get(docId) === run) inFlight.delete(docId);
  });
  return run;
}

// Re-export so callers don't need a second import for the version check.
export { EXTRACTOR_VERSION } from './pdf-extract';
