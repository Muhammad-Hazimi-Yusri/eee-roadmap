// Unit tests for reindex.ts — the two-phase indexing orchestrator. Pure
// orchestration logic, so we mock both collaborators (pdf-extract for the
// extraction phases, local-pdfs for the IndexedDB writes) and assert the
// ordering / failure / dedup contracts the file documents.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as pdfExtract from '../pdf-extract';
import * as localPdfs from '../local-pdfs';
import { runDocIndexing, type IndexingProgress } from '../reindex';
import type { StandardClause } from '../types';

vi.mock('../pdf-extract', () => ({
  EXTRACTOR_VERSION: 3,
  extractClausePages: vi.fn(),
  extractDocumentOutline: vi.fn(),
}));
vi.mock('../local-pdfs', () => ({
  setLocalPdfClausePages: vi.fn(),
  setLocalPdfOutline: vi.fn(),
  setLocalPdfExtractorVersion: vi.fn(),
}));

const extractClausePages         = vi.mocked(pdfExtract.extractClausePages);
const extractDocumentOutline     = vi.mocked(pdfExtract.extractDocumentOutline);
const setLocalPdfClausePages     = vi.mocked(localPdfs.setLocalPdfClausePages);
const setLocalPdfOutline         = vi.mocked(localPdfs.setLocalPdfOutline);
const setLocalPdfExtractorVersion = vi.mocked(localPdfs.setLocalPdfExtractorVersion);

const clauses: StandardClause[] = [
  { ref: 'grid-code/ECC.6.3.7',  docId: 'grid-code', clauseId: 'ECC.6.3.7',  title: 'Frequency Response' },
  { ref: 'grid-code/ECC.6.3.15', docId: 'grid-code', clauseId: 'ECC.6.3.15', title: 'Fault Ride Through' },
  { ref: 'erec-g99/13.2',        docId: 'erec-g99',  clauseId: '13.2',       title: 'Frequency Response' },
];
const file = new File(['fake-pdf-bytes'], 'grid-code.pdf', { type: 'application/pdf' });

beforeEach(() => {
  // clearAllMocks wipes call history but keeps implementations; we then set
  // benign defaults so each test only overrides what it cares about. The
  // module-level inFlight map clears itself on settle, so as long as every
  // test awaits its run, no cross-test leakage occurs.
  vi.clearAllMocks();
  extractClausePages.mockResolvedValue({});
  extractDocumentOutline.mockResolvedValue([]);
  setLocalPdfClausePages.mockResolvedValue(undefined);
  setLocalPdfOutline.mockResolvedValue(undefined);
  setLocalPdfExtractorVersion.mockResolvedValue(undefined);
});

describe('runDocIndexing', () => {
  it('runs both phases, stamps the version last, and returns a full result', async () => {
    extractClausePages.mockResolvedValue({ 'ECC.6.3.7': 12, 'ECC.6.3.15': 40 });
    extractDocumentOutline.mockResolvedValue([
      { id: 'ECC.6.3.7', title: 'Frequency Response', page: 12, source: 'toc' },
    ]);

    const result = await runDocIndexing('grid-code', file, clauses);

    expect(result).toEqual({ clausesIndexed: 2, outlineEntries: 1, timedOut: false, stamped: true });
    // Ordering: clausePages → outline → version stamp (stamp must be last).
    expect(setLocalPdfClausePages.mock.invocationCallOrder[0])
      .toBeLessThan(setLocalPdfOutline.mock.invocationCallOrder[0]);
    expect(setLocalPdfOutline.mock.invocationCallOrder[0])
      .toBeLessThan(setLocalPdfExtractorVersion.mock.invocationCallOrder[0]);
    expect(setLocalPdfExtractorVersion).toHaveBeenCalledWith('grid-code', 3);
  });

  it('seeds phase 1 with only the clauses whose docId matches', async () => {
    await runDocIndexing('grid-code', file, clauses);
    expect(extractClausePages).toHaveBeenCalledTimes(1);
    const passedIds = extractClausePages.mock.calls[0][1];
    expect(passedIds).toEqual(['ECC.6.3.7', 'ECC.6.3.15']); // erec-g99/13.2 excluded
  });

  it('skips phase 1 entirely when no clause matches the doc', async () => {
    extractDocumentOutline.mockResolvedValue([
      { id: 'Annex A', title: 'Compliance', page: 3, source: 'auto' },
    ]);
    // 'dcode' has no clause in the fixture → docClauses is empty.
    const result = await runDocIndexing('dcode', file, clauses);

    expect(extractClausePages).not.toHaveBeenCalled();
    expect(setLocalPdfClausePages).not.toHaveBeenCalled();
    expect(extractDocumentOutline).toHaveBeenCalledTimes(1);
    expect(setLocalPdfExtractorVersion).toHaveBeenCalledWith('dcode', 3);
    expect(result).toEqual({ clausesIndexed: 0, outlineEntries: 1, timedOut: false, stamped: true });
  });

  it('does not write the outline or stamp the version when phase 1 throws', async () => {
    extractClausePages.mockRejectedValue(new Error('clause boom'));

    await expect(runDocIndexing('grid-code', file, clauses)).rejects.toThrow('clause boom');

    expect(setLocalPdfClausePages).not.toHaveBeenCalled();
    expect(extractDocumentOutline).not.toHaveBeenCalled();
    expect(setLocalPdfOutline).not.toHaveBeenCalled();
    expect(setLocalPdfExtractorVersion).not.toHaveBeenCalled();
  });

  it('preserves the phase-1 write but skips the stamp when phase 2 throws', async () => {
    // The documented "partial is better than old garbage" contract: a failed
    // outline phase leaves clausePages written but the version unstamped, so
    // the next viewer load retries.
    extractClausePages.mockResolvedValue({ 'ECC.6.3.7': 12 });
    extractDocumentOutline.mockRejectedValue(new Error('outline boom'));

    await expect(runDocIndexing('grid-code', file, clauses)).rejects.toThrow('outline boom');

    expect(setLocalPdfClausePages).toHaveBeenCalledWith('grid-code', { 'ECC.6.3.7': 12 });
    expect(setLocalPdfOutline).not.toHaveBeenCalled();
    expect(setLocalPdfExtractorVersion).not.toHaveBeenCalled();
  });

  it('de-duplicates concurrent calls for the same doc', async () => {
    let resolveClauses!: (v: Record<string, number>) => void;
    extractClausePages.mockReturnValue(new Promise(res => { resolveClauses = res; }));

    const p1 = runDocIndexing('grid-code', file, clauses);
    const p2 = runDocIndexing('grid-code', file, clauses);

    expect(p1).toBe(p2);                              // same in-flight promise
    expect(extractClausePages).toHaveBeenCalledTimes(1);

    resolveClauses({ 'ECC.6.3.7': 1 });
    await Promise.all([p1, p2]);
    expect(extractClausePages).toHaveBeenCalledTimes(1); // never fired a second time
  });

  it('re-runs extraction after the previous run has settled', async () => {
    await runDocIndexing('grid-code', file, clauses);
    expect(extractClausePages).toHaveBeenCalledTimes(1);
    await runDocIndexing('grid-code', file, clauses);
    expect(extractClausePages).toHaveBeenCalledTimes(2); // in-flight map was cleared
  });

  it('forwards per-phase progress in order', async () => {
    extractClausePages.mockImplementation(async (_blob, _ids, opts) => {
      opts?.onProgress?.(1, 10);
      return { 'ECC.6.3.7': 1 };
    });
    extractDocumentOutline.mockImplementation(async (_blob, opts) => {
      opts?.onProgress?.(5, 20);
      return [];
    });

    const progress: IndexingProgress[] = [];
    await runDocIndexing('grid-code', file, clauses, { onProgress: p => progress.push(p) });

    expect(progress).toEqual([
      { phase: 'clauses', current: 0, total: 0 },
      { phase: 'clauses', current: 1, total: 10 },
      { phase: 'outline', current: 0, total: 0 },
      { phase: 'outline', current: 5, total: 20 },
    ]);
  });

  it('passes a custom timeoutMs to both extractors', async () => {
    await runDocIndexing('grid-code', file, clauses, { timeoutMs: 1234 });
    expect(extractClausePages.mock.calls[0][2]).toMatchObject({ timeoutMs: 1234 });
    expect(extractDocumentOutline.mock.calls[0][1]).toMatchObject({ timeoutMs: 1234 });
  });

  it('defaults the per-phase timeout to 60 000 ms', async () => {
    await runDocIndexing('grid-code', file, clauses);
    expect(extractClausePages.mock.calls[0][2]).toMatchObject({ timeoutMs: 60_000 });
    expect(extractDocumentOutline.mock.calls[0][1]).toMatchObject({ timeoutMs: 60_000 });
  });

  it('reports timedOut when an extraction phase signals a timeout', async () => {
    extractDocumentOutline.mockImplementation(async (_blob, opts) => {
      opts?.onTimeout?.();
      return [];
    });
    const result = await runDocIndexing('grid-code', file, clauses);
    expect(result.timedOut).toBe(true);
    expect(result.stamped).toBe(true); // a partial run still stamps + resolves
  });
});
