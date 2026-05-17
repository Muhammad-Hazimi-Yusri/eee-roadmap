// Search palette — ⌘K command-style modal.
// Fuse.js over titles, clause IDs, summaries and tags.

import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { StandardDocument, StandardClause } from '../../../../lib/grid-code/types';

interface Props {
  documents: StandardDocument[];
  clauses: StandardClause[];
  onClose: () => void;
  onPickDoc:    (doc: StandardDocument) => void;
  onPickClause: (clause: StandardClause) => void;
}

interface IndexedRow {
  kind: 'document' | 'clause';
  ref: string;
  title: string;
  clauseId?: string;
  publisher: string;
  summary?: string;
  tags: string[];
  doc?: StandardDocument;
  clause?: StandardClause;
}

export default function SearchPalette({ documents, clauses, onClose, onPickDoc, onPickClause }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  // Build index once per session
  const fuse = useMemo(() => {
    const rows: IndexedRow[] = [];
    for (const d of documents) {
      rows.push({
        kind: 'document',
        ref: d.id,
        title: d.title,
        publisher: d.publisher,
        summary: d.summary,
        tags: [
          ...(d.projectTypes ?? []),
          ...(d.studyTypes ?? []),
          d.jurisdiction ?? '',
          d.license,
        ],
        doc: d,
      });
    }
    for (const c of clauses) {
      const doc = documents.find(x => x.id === c.docId);
      rows.push({
        kind: 'clause',
        ref: c.ref,
        title: c.title,
        clauseId: c.clauseId,
        publisher: doc?.publisher ?? '',
        summary: c.summary,
        tags: [
          ...(c.projectTypes ?? []),
          ...(c.studyTypes   ?? []),
          ...(c.forms        ?? []),
        ],
        clause: c,
      });
    }
    return new Fuse(rows, {
      keys: [
        { name: 'title',    weight: 0.4 },
        { name: 'clauseId', weight: 0.3 },
        { name: 'tags',     weight: 0.15 },
        { name: 'summary',  weight: 0.1 },
        { name: 'publisher', weight: 0.05 },
      ],
      threshold: 0.4,
      includeScore: true,
      shouldSort: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [documents, clauses]);

  const results = useMemo<IndexedRow[]>(() => {
    if (!q.trim()) {
      // Show a curated default mix: featured clauses + flagship docs
      return [
        ...clauses.slice(0, 8).map<IndexedRow>(c => ({
          kind: 'clause' as const,
          ref: c.ref,
          title: c.title,
          clauseId: c.clauseId,
          publisher: documents.find(x => x.id === c.docId)?.publisher ?? '',
          summary: c.summary,
          tags: [],
          clause: c,
        })),
      ];
    }
    return fuse.search(q, { limit: 30 }).map(r => r.item);
  }, [q, fuse, clauses, documents]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function commit(row: IndexedRow) {
    if (row.kind === 'document' && row.doc)    onPickDoc(row.doc);
    if (row.kind === 'clause'   && row.clause) onPickClause(row.clause);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(0, a - 1)); return; }
    if (e.key === 'Enter')     { e.preventDefault(); if (results[active]) commit(results[active]); }
  }

  return (
    <div className="sp-root" role="dialog" aria-modal="true" aria-label="Search palette">
      <div className="sp-backdrop" onClick={onClose} />
      <div className="sp-paper" onKeyDown={onKey}>
        <input
          ref={inputRef}
          className="sp-input"
          type="text"
          value={q}
          placeholder="Search clauses, documents, e.g. ECC.6.3.7, fault ride through, BESS…"
          onChange={e => setQ(e.target.value)}
          aria-label="Search"
        />
        <ul className="sp-list" role="listbox">
          {results.length === 0 ? (
            <li className="sp-empty">No matches. Try a clause ID or topic keyword.</li>
          ) : (
            results.map((r, i) => (
              <li
                key={`${r.kind}-${r.ref}`}
                role="option"
                aria-selected={i === active}
                className={`sp-item ${i === active ? 'sp-item--active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(r)}
              >
                <span className={`sp-badge sp-badge--${r.publisher.toLowerCase()}`}>{r.publisher || r.kind}</span>
                <span className="sp-item-title">
                  {r.clauseId && <code className="sp-clauseid">{r.clauseId}</code>}
                  {r.title}
                </span>
                {r.summary && <span className="sp-item-summary">{r.summary}</span>}
              </li>
            ))
          )}
        </ul>
        <footer className="sp-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </footer>
      </div>

      <style>{`
        .sp-root {
          position: fixed; inset: 0; z-index: 10001;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 12vh;
        }
        .sp-backdrop {
          position: absolute; inset: 0;
          background: rgb(0 0 0 / 50%);
        }
        .sp-paper {
          position: relative;
          width: min(640px, 92vw);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          box-shadow: 0 10px 40px rgb(0 0 0 / 30%);
          display: flex; flex-direction: column;
          max-height: 70vh;
          border-radius: 4px;
        }
        .sp-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
          font-family: var(--font-mono); font-size: 0.95rem;
          outline: none;
        }
        .sp-input:focus { border-bottom-color: var(--color-copper); }
        .sp-list {
          list-style: none; padding: 0; margin: 0;
          overflow-y: auto;
          flex: 1; min-height: 0;
        }
        .sp-empty {
          padding: 1.5rem;
          text-align: center; font-size: 0.82rem;
          color: var(--color-text-muted);
        }
        .sp-item {
          padding: 0.55rem 0.8rem;
          cursor: pointer;
          border-bottom: 1px solid var(--color-border);
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 0.6rem;
          row-gap: 0.2rem;
          align-items: baseline;
        }
        .sp-item--active { background: var(--color-bg-grid); }
        .sp-badge {
          font-family: var(--font-mono); font-size: 0.6rem;
          padding: 0.1rem 0.35rem;
          background: var(--color-bg-grid);
          color: var(--color-text-muted);
          text-transform: uppercase; letter-spacing: 0.06em;
          border-radius: 2px;
          align-self: start;
        }
        .sp-badge--neso { background: rgb(37 99 235 / 12%); color: #2563eb; }
        .sp-badge--ena  { background: rgb(45 80 22 / 12%);  color: var(--color-pcb); }
        .sp-badge--eu   { background: rgb(250 200 0 / 18%); color: #b88500; }
        .sp-badge--dcode { background: rgb(184 115 51 / 12%); color: var(--color-copper); }
        .sp-item-title { font-size: 0.85rem; }
        .sp-clauseid {
          font-family: var(--font-mono); font-size: 0.78rem;
          color: var(--color-copper); margin-right: 0.45rem;
        }
        .sp-item-summary {
          grid-column: 2;
          font-size: 0.72rem; color: var(--color-text-muted);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sp-foot {
          padding: 0.3rem 0.8rem;
          border-top: 1px solid var(--color-border);
          background: var(--color-bg-grid);
          display: flex; gap: 1rem;
          font-family: var(--font-mono); font-size: 0.65rem;
          color: var(--color-text-muted);
        }
        .sp-foot kbd {
          font-family: var(--font-mono); font-size: 0.65rem;
          padding: 0 0.3rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 2px;
          margin-right: 0.2rem;
        }
      `}</style>
    </div>
  );
}
