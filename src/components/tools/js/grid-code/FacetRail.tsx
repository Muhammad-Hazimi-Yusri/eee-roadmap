// Left-rail faceted filter for the Grid Code Viewer.
// Visual style follows the existing RoadmapSettings.astro patterns.

import { useMemo, useState } from 'react';
import type {
  StandardDocument, FacetState, Publisher, ProjectType, StudyType,
  Jurisdiction, LicenseBucket,
} from '../../../../lib/grid-code/types';

interface Props {
  documents: StandardDocument[];
  facets: FacetState;
  onChange: (next: FacetState | undefined) => void;
  resultCount: number;
  onOpenPalette: () => void;
}

interface FacetGroup<T extends string> {
  key: keyof FacetState;
  label: string;
  values: T[];
}

const PROJECT_TYPES: ProjectType[] = ['G98', 'G99-A', 'G99-B', 'G99-C', 'G99-D', 'BESS', 'Synch', 'PPM', 'HVDC', 'OFTO', 'Demand'];
const STUDY_TYPES:   StudyType[]   = ['FRT', 'FFCI', 'FreqResp', 'Reactive', 'AVR', 'PSS', 'Harmonics', 'Flicker', 'Unbalance', 'Protection', 'LoM', 'EMT', 'BlackStart', 'SSO', 'LoadFlow', 'FaultLevel', 'POD'];
const PUBLISHERS:    Publisher[]   = ['NESO', 'ENA', 'DCode', 'EU', 'UKGov', 'IEEE', 'IEC', 'VDE', 'AEMC'];
const JURISDICTIONS: Jurisdiction[] = ['GB', 'EU', 'US', 'DE', 'AU', 'Scotland', 'Offshore'];
const LICENSES:      LicenseBucket[] = ['link-only', 'hostable-eu', 'paywalled'];

const LICENSE_LABEL: Record<LicenseBucket, string> = {
  'link-only':   'Link only',
  'hostable-eu': 'EU (hostable)',
  'paywalled':   'Paywalled',
};

export default function FacetRail({ documents, facets, onChange, resultCount, onOpenPalette }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Compute counts per facet value (over the unfiltered document set)
  const counts = useMemo(() => {
    const c: Record<string, Record<string, number>> = {
      publisher: {}, projectTypes: {}, studyTypes: {}, jurisdiction: {}, license: {},
    };
    for (const d of documents) {
      c.publisher[d.publisher] = (c.publisher[d.publisher] ?? 0) + 1;
      if (d.jurisdiction) c.jurisdiction[d.jurisdiction] = (c.jurisdiction[d.jurisdiction] ?? 0) + 1;
      c.license[d.license] = (c.license[d.license] ?? 0) + 1;
      for (const pt of d.projectTypes ?? []) c.projectTypes[pt] = (c.projectTypes[pt] ?? 0) + 1;
      for (const st of d.studyTypes   ?? []) c.studyTypes[st]   = (c.studyTypes[st]   ?? 0) + 1;
    }
    return c;
  }, [documents]);

  function toggle<K extends keyof FacetState>(group: K, value: NonNullable<FacetState[K]>[number]) {
    const current = facets[group] ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next: any[] = (current as any[]).includes(value)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (current as any[]).filter(v => v !== value)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : [...(current as any[]), value];
    const updated: FacetState = { ...facets, [group]: next.length > 0 ? next : undefined };
    // Remove empty arrays for clean URL state
    for (const k of Object.keys(updated) as (keyof FacetState)[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = updated[k] as any[] | undefined;
      if (!v || v.length === 0) delete updated[k];
    }
    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  }

  function clearAll() { onChange(undefined); }

  const groups: FacetGroup<string>[] = [
    { key: 'projectTypes', label: 'Project type', values: PROJECT_TYPES },
    { key: 'studyTypes',   label: 'Study type',   values: STUDY_TYPES },
    { key: 'publisher',    label: 'Publisher',    values: PUBLISHERS },
    { key: 'jurisdiction', label: 'Jurisdiction', values: JURISDICTIONS },
    { key: 'license',      label: 'License',      values: LICENSES },
  ];

  const activeCount = Object.values(facets).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);

  return (
    <div className="facet-rail">
      <div className="facet-head">
        <button type="button" className="facet-search-btn" onClick={onOpenPalette} aria-label="Open search palette">
          <span>Search…</span>
          <kbd>⌘K</kbd>
        </button>
      </div>

      <div className="facet-summary">
        <span><b>{resultCount}</b> of {documents.length} docs</span>
        {activeCount > 0 && (
          <button type="button" className="facet-clear" onClick={clearAll}>clear filters</button>
        )}
      </div>

      {groups.map(g => {
        const isCollapsed = collapsed[g.key] === true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any[] = (facets[g.key] as any[] | undefined) ?? [];
        return (
          <div className="facet-group" key={g.key}>
            <button
              type="button"
              className="facet-group-head"
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed(c => ({ ...c, [g.key]: !isCollapsed }))}
            >
              <span>{g.label}</span>
              <span className="facet-chev" aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
            </button>
            {!isCollapsed && (
              <ul className="facet-list">
                {g.values.map(v => {
                  const count = counts[g.key]?.[v] ?? 0;
                  const isActive = active.includes(v);
                  const disabled = count === 0 && !isActive;
                  const display = g.key === 'license' ? LICENSE_LABEL[v as LicenseBucket] ?? v : v;
                  return (
                    <li key={v}>
                      <button
                        type="button"
                        className={`facet-btn ${isActive ? 'facet-btn--active' : ''}`}
                        disabled={disabled}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => toggle(g.key, v as any)}
                      >
                        <span>{display}</span>
                        <span className="facet-count">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      <style>{`
        .facet-rail { display: flex; flex-direction: column; gap: 0.5rem; }
        .facet-head {}
        .facet-search-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.45rem 0.6rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          cursor: pointer;
          border-radius: 3px;
        }
        .facet-search-btn:hover { color: var(--color-text); border-color: var(--color-copper); }
        .facet-search-btn kbd {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 0.05rem 0.35rem;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          background: var(--color-bg-grid);
        }
        .facet-summary {
          display: flex; align-items: center; justify-content: space-between;
          font-family: var(--font-mono); font-size: 0.72rem;
          color: var(--color-text-muted);
          padding: 0.1rem 0;
        }
        .facet-clear {
          background: none; border: none; padding: 0;
          font-family: var(--font-mono); font-size: 0.7rem;
          color: var(--color-copper); cursor: pointer; text-decoration: underline;
        }
        .facet-group {
          border-top: 1px dashed var(--color-border);
          padding-top: 0.4rem;
        }
        .facet-group-head {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          background: none; border: none; padding: 0.25rem 0;
          font-family: var(--font-mono); font-size: 0.72rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text); cursor: pointer;
        }
        .facet-chev { font-size: 0.7rem; color: var(--color-text-muted); }
        .facet-list {
          list-style: none; padding: 0; margin: 0.2rem 0 0.4rem;
          display: flex; flex-direction: column; gap: 0.18rem;
        }
        .facet-btn {
          width: 100%;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.25rem 0.45rem;
          background: var(--color-bg-grid);
          border: 1px solid transparent;
          color: var(--color-text);
          font-family: var(--font-mono); font-size: 0.72rem;
          cursor: pointer; border-radius: 2px;
          text-align: left;
        }
        .facet-btn:hover:not(:disabled) {
          border-color: var(--color-copper);
        }
        .facet-btn--active {
          background: var(--color-copper);
          color: white;
          border-color: var(--color-copper);
        }
        .facet-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .facet-count {
          font-size: 0.68rem;
          color: var(--color-text-muted);
          background: var(--color-bg);
          padding: 0 0.3rem;
          border-radius: 2px;
        }
        .facet-btn--active .facet-count {
          background: rgb(255 255 255 / 25%);
          color: white;
        }
      `}</style>
    </div>
  );
}
