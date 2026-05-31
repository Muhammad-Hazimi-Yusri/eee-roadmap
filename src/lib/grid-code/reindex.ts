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

// Summary of a completed indexing run. Lets callers tell a full result
// apart from a truncated one — the extractors themselves return only a
// partial map / list with no built-in "I bailed early" signal, so we
// aggregate the per-phase onTimeout callbacks here.
export interface IndexingResult {
  clausesIndexed: number;   // entries in the clausePages map (0 if no clauses)
  outlineEntries: number;   // outline rows persisted
  timedOut: boolean;        // a phase bailed on its per-phase wall-clock budget
  stamped: boolean;         // the extractor version was written (full success)
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
const inFlight = new Map<string, Promise<IndexingResult>>();

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
 *
 * Resolves to an IndexingResult summarising the run. `timedOut` is true
 * when either phase hit its per-phase wall-clock budget and returned a
 * partial result — callers surface this so the user knows to re-index.
 */
export function runDocIndexing(
  docId: string,
  file: File | Blob,
  clauses: StandardClause[],
  opts: RunDocIndexingOptions = {},
): Promise<IndexingResult> {
  const existing = inFlight.get(docId);
  if (existing) return existing;

  const run = (async (): Promise<IndexingResult> => {
    const timeoutMs = opts.timeoutMs ?? 60_000;
    const blob = file as Blob;
    let timedOut = false;
    let clausesIndexed = 0;
    let outlineEntries = 0;

    // Phase 1: per-clause page numbers (drives auto-jump for curated
    // _clauses.yaml entries).
    const docClauses = clauses.filter(c => c.docId === docId);
    if (docClauses.length > 0) {
      const clauseIds = docClauses.map(c => c.clauseId);
      opts.onProgress?.({ phase: 'clauses', current: 0, total: 0 });
      const pages = await extractClausePages(blob, clauseIds, {
        timeoutMs,
        onTimeout: () => { timedOut = true; },
        onProgress: (current, total) =>
          opts.onProgress?.({ phase: 'clauses', current, total }),
      });
      clausesIndexed = Object.keys(pages).length;
      await setLocalPdfClausePages(docId, pages);
    }

    // Phase 2: heading outline (drives the OUTLINE tab).
    opts.onProgress?.({ phase: 'outline', current: 0, total: 0 });
    const outline = await extractDocumentOutline(blob, {
      timeoutMs,
      maxEntries: 500,
      onTimeout: () => { timedOut = true; },
      onProgress: (current, total) =>
        opts.onProgress?.({ phase: 'outline', current, total }),
    });
    outlineEntries = outline.length;
    await setLocalPdfOutline(docId, outline);

    // Stamp the version last, so a failure leaves the record stale
    // (which triggers another retry on next load).
    await setLocalPdfExtractorVersion(docId, EXTRACTOR_VERSION);

    return { clausesIndexed, outlineEntries, timedOut, stamped: true };
  })();

  inFlight.set(docId, run);
  // Clear the in-flight entry once the run settles (success OR failure) so a
  // later call re-runs. We use then(clear, clear) rather than
  // run.finally(clear): chaining .finally() forks a *second* promise that
  // re-throws on rejection, producing an unhandled rejection whenever a phase
  // fails. The caller still sees the failure via the returned `run`.
  const clear = () => { if (inFlight.get(docId) === run) inFlight.delete(docId); };
  void run.then(clear, clear);
  return run;
}

// Re-export so callers don't need a second import for the version check.
export { EXTRACTOR_VERSION } from './pdf-extract';
