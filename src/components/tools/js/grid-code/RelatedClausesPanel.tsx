// Right-pane "Related clauses" panel — peek view for the current
// document or clause. Three tabs: Related (xrefs), Forms (submission
// artefacts), Plain-English summary.

import { useMemo, useState } from 'react';
import type {
  StandardDocument, StandardClause, AdjacencyEntry, XrefRelation,
} from '../../../../lib/grid-code/types';

interface Props {
  doc: StandardDocument;
  clause?: StandardClause;
  outgoing: AdjacencyEntry[];
  incoming: AdjacencyEntry[];
  clauses: StandardClause[];
  documents: StandardDocument[];
  onJumpToClause: (clause: StandardClause) => void;
  onJumpToDoc:    (doc: StandardDocument) => void;
}

const RELATION_LABEL: Record<XrefRelation, string> = {
  'defined-in':   'defined in',
  'defines':      'defines',
  'modified-by':  'modified by',
  'see-also':     'see also',
  'tested-by':    'tested by',
  'evidenced-by': 'evidenced by',
  'mirrors':      'mirrors',
  'commercial':   'commercial framework',
};

export default function RelatedClausesPanel({
  doc, clause, outgoing, incoming, clauses, documents, onJumpToClause, onJumpToDoc,
}: Props) {
  const [tab, setTab] = useState<'related' | 'forms' | 'notes'>('related');

  const docById    = useMemo(() => new Map(documents.map(d => [d.id, d])), [documents]);
  const clauseByRef = useMemo(() => new Map(clauses.map(c => [c.ref, c])), [clauses]);

  function resolveTarget(ref: string): { kind: 'clause'; clause: StandardClause } | { kind: 'doc'; doc: StandardDocument } | null {
    const c = clauseByRef.get(ref);
    if (c) return { kind: 'clause', clause: c };
    const d = docById.get(ref);
    if (d) return { kind: 'doc', doc: d };
    return null;
  }

  function onClickEdge(ref: string) {
    const t = resolveTarget(ref);
    if (!t) return;
    if (t.kind === 'clause') onJumpToClause(t.clause);
    else onJumpToDoc(t.doc);
  }

  // Combine outgoing and incoming for display; show relation direction in label
  const edges = useMemo(() => {
    const items: { ref: string; relation: XrefRelation; note?: string; direction: 'out' | 'in' }[] = [];
    for (const e of outgoing) if (e.to)   items.push({ ref: e.to,   relation: e.relation, note: e.note, direction: 'out' });
    for (const e of incoming) if (e.from) items.push({ ref: e.from, relation: e.relation, note: e.note, direction: 'in'  });
    return items;
  }, [outgoing, incoming]);

  const forms = clause?.forms ?? [];
  const summary = clause?.summary ?? doc.summary ?? '';
  const docClauses = useMemo(() => clauses.filter(c => c.docId === doc.id), [clauses, doc.id]);

  return (
    <div className="rcp-root">
      <div className="rcp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'related'} className={tab === 'related' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('related')}>
          Related <span className="rcp-tab-count">{edges.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'forms'} className={tab === 'forms' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('forms')}>
          Forms <span className="rcp-tab-count">{forms.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'notes'} className={tab === 'notes' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('notes')}>
          Notes
        </button>
      </div>

      <div className="rcp-body">
        {tab === 'related' && (
          edges.length === 0 ? (
            <p className="rcp-empty">
              {clause
                ? 'No cross-references recorded for this clause yet.'
                : 'Open a specific clause to see related references — for now, here are the indexed clauses in this document:'}
            </p>
          ) : (
            <ul className="rcp-list">
              {edges.map((e, i) => {
                const target = resolveTarget(e.ref);
                if (!target) return null;
                const label = target.kind === 'clause' ? `${target.clause.clauseId} — ${target.clause.title}` : target.doc.title;
                const sub = target.kind === 'clause' ? docById.get(target.clause.docId)?.title : target.doc.publisher;
                return (
                  <li key={`${e.ref}-${i}`}>
                    <button type="button" className="rcp-edge" onClick={() => onClickEdge(e.ref)}>
                      <div className="rcp-edge-rel">
                        <span className={`rcp-rel rcp-rel--${e.direction}`}>{RELATION_LABEL[e.relation]}</span>
                        <span className="rcp-rel-dir">{e.direction === 'out' ? '→' : '←'}</span>
                      </div>
                      <div className="rcp-edge-title">{label}</div>
                      <div className="rcp-edge-sub">{sub}</div>
                      {e.note && <div className="rcp-edge-note">{e.note}</div>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        )}

        {tab === 'related' && edges.length === 0 && !clause && docClauses.length > 0 && (
          <ul className="rcp-list rcp-list--clauses">
            {docClauses.map(c => (
              <li key={c.ref}>
                <button type="button" className="rcp-edge" onClick={() => onJumpToClause(c)}>
                  <div className="rcp-edge-title"><code>{c.clauseId}</code>  {c.title}</div>
                  {c.summary && <div className="rcp-edge-note">{c.summary}</div>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === 'forms' && (
          forms.length === 0 ? (
            <p className="rcp-empty">No linked submission artefacts for this {clause ? 'clause' : 'document'}.</p>
          ) : (
            <ul className="rcp-forms">
              {forms.map(f => <li key={f}><code>{f}</code></li>)}
            </ul>
          )
        )}

        {tab === 'notes' && (
          summary ? (
            <div className="rcp-summary"><p>{summary}</p></div>
          ) : (
            <p className="rcp-empty">No plain-English summary yet.</p>
          )
        )}
      </div>

      <style>{`
        .rcp-root { display: flex; flex-direction: column; height: 100%; }
        .rcp-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg-grid);
        }
        .rcp-tab {
          flex: 1;
          padding: 0.5rem 0.7rem;
          background: transparent;
          border: none;
          font-family: var(--font-mono); font-size: 0.7rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .rcp-tab--active {
          color: var(--color-text);
          border-bottom-color: var(--color-copper);
          background: var(--color-bg);
        }
        .rcp-tab-count {
          display: inline-block;
          margin-left: 0.3rem;
          padding: 0 0.3rem;
          font-size: 0.65rem;
          background: var(--color-bg);
          border-radius: 2px;
          color: var(--color-text-muted);
        }
        .rcp-tab--active .rcp-tab-count {
          background: var(--color-copper);
          color: white;
        }
        .rcp-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 0.5rem;
        }
        .rcp-empty {
          font-size: 0.78rem;
          color: var(--color-text-muted);
          font-style: italic;
          margin: 0.5rem 0;
          padding: 0.5rem;
        }
        .rcp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.3rem; }
        .rcp-edge {
          display: block;
          width: 100%; text-align: left;
          padding: 0.45rem 0.55rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          cursor: pointer;
          font-family: inherit;
          border-radius: 3px;
        }
        .rcp-edge:hover { border-color: var(--color-copper); }
        .rcp-edge-rel {
          display: flex; align-items: center; gap: 0.3rem;
          font-family: var(--font-mono); font-size: 0.62rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text-muted);
          margin-bottom: 0.2rem;
        }
        .rcp-rel {
          padding: 0.05rem 0.35rem;
          background: var(--color-bg-grid);
          border-radius: 2px;
        }
        .rcp-rel--out { background: rgb(184 115 51 / 12%); color: var(--color-copper); }
        .rcp-rel--in  { background: rgb(45 80 22 / 12%);  color: var(--color-pcb); }
        .rcp-rel-dir { color: var(--color-text-muted); }
        .rcp-edge-title { font-size: 0.8rem; font-weight: 600; }
        .rcp-edge-title code {
          font-family: var(--font-mono); font-size: 0.78rem;
          color: var(--color-copper); margin-right: 0.4rem;
        }
        .rcp-edge-sub {
          font-size: 0.7rem; color: var(--color-text-muted);
          margin-top: 0.1rem;
        }
        .rcp-edge-note {
          font-size: 0.7rem; color: var(--color-text-muted);
          margin-top: 0.25rem;
          line-height: 1.4;
          font-style: italic;
        }
        .rcp-forms {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.3rem;
        }
        .rcp-forms li {
          padding: 0.3rem 0.5rem;
          background: var(--color-bg-grid);
          border: 1px solid var(--color-border);
          border-radius: 2px;
        }
        .rcp-forms code { font-family: var(--font-mono); font-size: 0.78rem; }
        .rcp-summary {
          font-size: 0.85rem; line-height: 1.55;
          color: var(--color-text);
        }
        .rcp-summary p { margin: 0.5rem 0; }
      `}</style>
    </div>
  );
}
