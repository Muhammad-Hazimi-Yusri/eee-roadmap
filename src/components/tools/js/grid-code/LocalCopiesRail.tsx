// Left-rail section listing documents the user has uploaded a local PDF for.
// Click to open the viewer with the local copy. localStorage-mirrored
// invalidation so the rail updates after uploads/removals in the viewer.

import { useEffect, useState } from 'react';
import type { StandardDocument } from '../../../../lib/grid-code/types';
import { listLocalPdfs, formatBytes, type LocalPdfRecord } from '../../../../lib/grid-code/local-pdfs';

interface Props {
  documents: StandardDocument[];
  onOpenDoc: (doc: StandardDocument) => void;
  /** Bumped by parents whenever uploads change so we re-list. */
  invalidationKey?: number;
}

export default function LocalCopiesRail({ documents, onOpenDoc, invalidationKey = 0 }: Props) {
  const [items, setItems] = useState<LocalPdfRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    listLocalPdfs()
      .then(list => { if (!cancelled) setItems(list); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [invalidationKey]);

  // Refresh when window regains focus (covers cross-tab uploads).
  useEffect(() => {
    function onFocus() {
      listLocalPdfs().then(setItems).catch(() => {});
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (items.length === 0) return null;

  const docById = new Map(documents.map(d => [d.id, d]));

  return (
    <div className="lcr-root">
      <h4 className="lcr-title">Your uploads ({items.length})</h4>
      <ul className="lcr-list">
        {items.map(rec => {
          const d = docById.get(rec.docId);
          if (!d) return null;
          return (
            <li key={rec.docId}>
              <button
                type="button"
                className="lcr-btn"
                onClick={() => onOpenDoc(d)}
                title={`${rec.fileName} · ${formatBytes(rec.sizeBytes)}`}
              >
                <span className="lcr-doc">{d.title}</span>
                <span className="lcr-meta">{formatBytes(rec.sizeBytes)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <style>{`
        .lcr-root {
          margin-top: 0.75rem;
          padding-top: 0.6rem;
          border-top: 1px dashed var(--color-border);
        }
        .lcr-title {
          font-family: var(--font-mono); font-size: 0.72rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin: 0 0 0.4rem;
          color: var(--color-text);
        }
        .lcr-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.18rem;
        }
        .lcr-btn {
          width: 100%;
          padding: 0.2rem 0.4rem;
          background: rgb(34 197 94 / 8%);
          border: 1px solid rgb(34 197 94 / 35%);
          color: var(--color-text);
          font-family: var(--font-mono); font-size: 0.7rem;
          text-align: left;
          cursor: pointer;
          border-radius: 2px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 0.4rem;
        }
        .lcr-btn:hover { border-color: #16a34a; background: rgb(34 197 94 / 14%); }
        .lcr-doc {
          flex: 1; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .lcr-meta {
          flex-shrink: 0;
          font-size: 0.62rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
