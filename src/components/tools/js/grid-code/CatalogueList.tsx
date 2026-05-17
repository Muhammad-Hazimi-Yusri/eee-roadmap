// Catalogue listing — grouped by publisher.

import { useMemo } from 'react';
import type { StandardDocument } from '../../../../lib/grid-code/types';

interface Props {
  documents: StandardDocument[];
  totalCount: number;
  onOpen: (doc: StandardDocument) => void;
}

const LICENSE_BADGE: Record<string, { label: string; cls: string }> = {
  'link-only':   { label: 'link-only',   cls: 'lic--link' },
  'hostable-eu': { label: 'EU hostable', cls: 'lic--eu'   },
  'paywalled':   { label: 'paywalled',   cls: 'lic--pay'  },
};

const PUBLISHER_ORDER = ['NESO', 'ENA', 'DCode', 'EU', 'UKGov', 'IEEE', 'IEC', 'VDE', 'AEMC', 'CIGRE'];

export default function CatalogueList({ documents, totalCount, onOpen }: Props) {
  const grouped = useMemo(() => {
    const m = new Map<string, StandardDocument[]>();
    for (const d of documents) {
      if (!m.has(d.publisher)) m.set(d.publisher, []);
      m.get(d.publisher)!.push(d);
    }
    return [...m.entries()].sort(
      (a, b) => PUBLISHER_ORDER.indexOf(a[0]) - PUBLISHER_ORDER.indexOf(b[0])
    );
  }, [documents]);

  if (documents.length === 0) {
    return (
      <div className="cat-empty">
        <p>No documents match your filters.</p>
        <p className="cat-empty__sub">{totalCount} total in catalogue — try clearing filters.</p>
      </div>
    );
  }

  return (
    <div className="cat-root">
      <header className="cat-head">
        <h2>Standards catalogue</h2>
        <p className="cat-sub">{documents.length} documents — pick one to open in the viewer.</p>
      </header>

      {grouped.map(([publisher, docs]) => (
        <section className="cat-group" key={publisher}>
          <h3 className="cat-group-title">{publisher}</h3>
          <ul className="cat-list">
            {docs.map(d => {
              const badge = LICENSE_BADGE[d.license] ?? LICENSE_BADGE['link-only'];
              return (
                <li key={d.id} className="cat-item">
                  <button type="button" className="cat-item-btn" onClick={() => onOpen(d)}>
                    <div className="cat-item-row1">
                      <span className="cat-item-title">{d.title}</span>
                      <span className={`cat-lic ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="cat-item-row2">
                      {d.version && <span className="cat-meta">{d.version}</span>}
                      {d.date     && <span className="cat-meta">{d.date}</span>}
                      {d.pages    && <span className="cat-meta">~{d.pages} pp</span>}
                      {d.jurisdiction && <span className="cat-meta cat-meta--jur">{d.jurisdiction}</span>}
                    </div>
                    {d.summary && <p className="cat-item-summary">{d.summary}</p>}
                    {(d.projectTypes?.length || d.studyTypes?.length) ? (
                      <div className="cat-item-tags">
                        {d.projectTypes?.map(pt => <span key={pt} className="cat-tag cat-tag--pt">{pt}</span>)}
                        {d.studyTypes  ?.map(st => <span key={st} className="cat-tag cat-tag--st">{st}</span>)}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <style>{`
        .cat-empty { padding: 3rem 2rem; text-align: center; color: var(--color-text-muted); }
        .cat-empty__sub { font-size: 0.8rem; }
        .cat-head { margin-bottom: 1rem; }
        .cat-head h2 {
          font-family: var(--font-mono); font-size: 1rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 0 0 0.25rem;
        }
        .cat-sub { font-size: 0.82rem; color: var(--color-text-muted); margin: 0; }

        .cat-group { margin-bottom: 1.25rem; }
        .cat-group-title {
          font-family: var(--font-mono); font-size: 0.72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.3rem 0.6rem;
          background: var(--color-bg-grid);
          border-left: 3px solid var(--color-copper);
          margin: 0 0 0.5rem;
        }
        .cat-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .cat-item-btn {
          width: 100%; text-align: left;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          padding: 0.6rem 0.85rem;
          font-family: inherit; font-size: inherit; color: var(--color-text);
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          border-radius: 3px;
        }
        .cat-item-btn:hover, .cat-item-btn:focus {
          border-color: var(--color-copper);
          box-shadow: 0 0 0 1px var(--color-copper);
          outline: none;
        }
        .cat-item-row1 {
          display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
        }
        .cat-item-title { font-weight: 600; font-size: 0.92rem; }
        .cat-item-row2 {
          display: flex; gap: 0.6rem; flex-wrap: wrap;
          font-family: var(--font-mono); font-size: 0.7rem;
          color: var(--color-text-muted);
          margin-top: 0.2rem;
        }
        .cat-meta--jur { color: var(--color-copper); }
        .cat-item-summary {
          font-size: 0.82rem; color: var(--color-text-muted);
          margin: 0.45rem 0 0; line-height: 1.5;
        }
        .cat-item-tags {
          display: flex; flex-wrap: wrap; gap: 0.25rem;
          margin-top: 0.5rem;
        }
        .cat-tag {
          font-family: var(--font-mono); font-size: 0.65rem;
          padding: 0.08rem 0.4rem; border-radius: 2px;
          background: var(--color-bg-grid); color: var(--color-text-muted);
        }
        .cat-tag--pt { background: rgb(184 115 51 / 12%); color: var(--color-copper); }
        .cat-tag--st { background: rgb(45 80 22 / 12%);  color: var(--color-pcb); }

        .cat-lic {
          font-family: var(--font-mono); font-size: 0.62rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 0.1rem 0.4rem; border-radius: 2px;
          flex-shrink: 0;
        }
        .lic--link { background: rgb(37 99 235 / 12%); color: #2563eb; border: 1px solid rgb(37 99 235 / 35%); }
        .lic--eu   { background: rgb(34 197 94 / 12%); color: #16a34a; border: 1px solid rgb(34 197 94 / 35%); }
        .lic--pay  { background: var(--color-bg-grid); color: var(--color-text-muted); border: 1px solid var(--color-border); }
      `}</style>
    </div>
  );
}
