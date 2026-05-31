// Inline dropzone for the viewer pane. Shown when a doc has no
// hostable PDF source — user provides their own copy, stored locally
// in IndexedDB, never sent to a server.

import { useRef, useState } from 'react';
import type { StandardDocument, StandardClause } from '../../../../lib/grid-code/types';
import { storeLocalPdf, formatBytes, isQuotaError } from '../../../../lib/grid-code/local-pdfs';
import { runDocIndexing, type IndexingProgress } from '../../../../lib/grid-code/reindex';
import { showToast } from '../../../../utils/toast';

interface Props {
  doc: StandardDocument;
  // Clauses for this doc. Used to seed the post-upload page-number extraction.
  // Optional — when omitted, the upload still works but the clause→page map
  // won't be populated.
  clauses?: StandardClause[];
  onUploaded: () => void;
}

export default function UploadDropzone({ doc, clauses, onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [indexing, setIndexing] = useState<IndexingProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file) return;
    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(`Not a PDF: ${file.name}`);
      return;
    }
    if (file.size === 0) {
      setError('File is empty');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError(`File too large (${formatBytes(file.size)}). Max 200 MB.`);
      return;
    }
    // Pre-flight storage check: warn before hashing a file we can't store.
    // Best-effort — browsers without the Storage API just skip this and let
    // the write below surface any real quota error.
    try {
      const est = await navigator.storage?.estimate?.();
      if (est && typeof est.quota === 'number' && typeof est.usage === 'number'
          && est.usage + file.size > est.quota * 0.95) {
        const msg = `Not enough browser storage for this file (${formatBytes(file.size)}). Remove an existing local copy or clear site data, then retry.`;
        setError(msg);
        showToast(msg, 'error', 6000);
        return;
      }
    } catch { /* Storage API unavailable — proceed; the write will surface quota errors. */ }

    setBusy(true);
    try {
      await storeLocalPdf(doc.id, file);
      onUploaded();
      // Kick off the shared two-phase indexing pipeline in the background.
      // Non-blocking — user can already see the PDF while it finishes.
      runDocIndexing(doc.id, file, clauses ?? [], {
        onProgress: setIndexing,
      })
        .then(result => {
          setIndexing(null);
          onUploaded();
          if (result.timedOut) {
            showToast(
              'Outline may be incomplete on this large PDF — open the viewer and use “Re-index” to finish.',
              'info', 6000,
            );
          }
        })
        .catch(err => {
          console.warn('[grid-code] background indexing failed:', err);
          setIndexing(null);
          showToast('Background indexing failed — clause page-jumps and the outline may be limited.', 'error');
        });
    } catch (err) {
      const quota = isQuotaError(err);
      const msg = quota
        ? 'Not enough browser storage to save this PDF. Remove an existing local copy or clear site data, then retry.'
        : (err instanceof Error ? err.message : 'Upload failed');
      setError(msg);
      if (quota) showToast(msg, 'error', 6000);
    } finally {
      setBusy(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="ud-root">
      <h3 className="ud-title">{doc.title}</h3>
      {doc.version && <p className="ud-sub">Catalogue version: <strong>{doc.version}</strong>{doc.date ? ` · ${doc.date}` : ''}</p>}

      {doc.license === 'link-only' ? (
        <p className="ud-blurb">
          The publisher hosts this document themselves and doesn't permit cross-site embedding,
          so we can't preview it directly. You can either open it at the publisher, or drop your
          own downloaded copy below to view it inline (with all the cross-reference features).
        </p>
      ) : doc.license === 'paywalled' ? (
        <p className="ud-blurb">
          This standard is paywalled. Purchase a copy from the publisher and drop it below to
          view it inline. Your file stays in your browser — it's never uploaded anywhere.
        </p>
      ) : (
        <p className="ud-blurb">
          Drop a local PDF copy to view it inline. The file stays in your browser only.
        </p>
      )}

      <div
        className={`ud-drop ${dragOver ? 'ud-drop--over' : ''} ${busy ? 'ud-drop--busy' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click(); }}
        aria-label={`Upload a local copy of ${doc.title}`}
      >
        {busy ? (
          <span>Hashing &amp; storing…</span>
        ) : (
          <>
            <span className="ud-drop-primary">Drop your PDF here</span>
            <span className="ud-drop-secondary">or click to choose a file</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && <p className="ud-error" role="alert">{error}</p>}
      {indexing && (
        <p className="ud-indexing" role="status">
          {indexing.phase === 'clauses'
            ? 'Indexing clauses for page-jumps…'
            : 'Building document outline…'}
          {indexing.total > 0 && (
            <span> page {indexing.current} / {indexing.total}</span>
          )}
        </p>
      )}

      <div className="ud-cta-row">
        {doc.pdfUrl && (
          <a href={doc.pdfUrl} target="_blank" rel="noreferrer" className="ud-cta ud-cta--primary">
            ↗ Open at publisher
          </a>
        )}
        {doc.landingUrl && doc.landingUrl !== doc.pdfUrl && (
          <a href={doc.landingUrl} target="_blank" rel="noreferrer" className="ud-cta">
            Publisher landing page
          </a>
        )}
      </div>

      <p className="ud-fineprint">
        Files stay in your browser via IndexedDB — never uploaded. Stored per-document; replacing
        an upload overwrites the previous copy. Clearing site data removes them.
      </p>

      <style>{`
        .ud-root {
          padding: 1.5rem 1.5rem 1.25rem;
          max-width: 38rem;
          margin: 0 auto;
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .ud-title {
          font-family: var(--font-mono); font-size: 1rem; font-weight: 600;
          margin: 0;
          color: var(--color-text);
        }
        .ud-sub {
          margin: 0;
          font-family: var(--font-mono); font-size: 0.72rem;
          color: var(--color-text-muted);
        }
        .ud-blurb {
          margin: 0.25rem 0 0.5rem;
          font-size: 0.86rem; line-height: 1.55;
          color: var(--color-text-muted);
        }
        .ud-drop {
          border: 2px dashed var(--color-border);
          border-radius: 4px;
          padding: 2rem 1rem;
          text-align: center;
          cursor: pointer;
          display: flex; flex-direction: column; gap: 0.25rem;
          color: var(--color-text-muted);
          transition: border-color 0.15s, background 0.15s;
          background: var(--color-bg-grid);
        }
        .ud-drop:hover, .ud-drop:focus-visible {
          border-color: var(--color-copper);
          color: var(--color-text);
          outline: none;
        }
        .ud-drop--over {
          border-color: var(--color-copper);
          background: rgb(184 115 51 / 8%);
          color: var(--color-text);
        }
        .ud-drop--busy {
          cursor: progress;
          opacity: 0.7;
        }
        .ud-drop-primary {
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 600;
        }
        .ud-drop-secondary {
          font-size: 0.75rem;
        }
        .ud-error {
          margin: 0;
          padding: 0.5rem 0.7rem;
          background: rgb(239 68 68 / 10%);
          border: 1px solid rgb(239 68 68 / 40%);
          border-radius: 3px;
          color: #ef4444;
          font-family: var(--font-mono); font-size: 0.78rem;
        }
        .ud-indexing {
          margin: 0;
          padding: 0.4rem 0.7rem;
          background: rgb(34 197 94 / 8%);
          border: 1px solid rgb(34 197 94 / 35%);
          border-radius: 3px;
          color: #16a34a;
          font-family: var(--font-mono); font-size: 0.72rem;
        }
        .ud-indexing span { color: var(--color-text-muted); margin-left: 0.4rem; }
        .ud-cta-row {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
          margin-top: 0.25rem;
        }
        .ud-cta {
          font-family: var(--font-mono); font-size: 0.78rem;
          padding: 0.4rem 0.75rem;
          border: 1px solid var(--color-border);
          color: var(--color-text);
          text-decoration: none;
          border-radius: 3px;
          background: var(--color-bg);
        }
        .ud-cta:hover { border-color: var(--color-copper); color: var(--color-copper); }
        .ud-cta--primary {
          background: var(--color-copper);
          color: white;
          border-color: var(--color-copper);
        }
        .ud-cta--primary:hover {
          background: var(--color-copper-light);
          border-color: var(--color-copper-light);
          color: white;
        }
        .ud-fineprint {
          margin: 0.5rem 0 0;
          font-size: 0.7rem; line-height: 1.5;
          color: var(--color-text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
