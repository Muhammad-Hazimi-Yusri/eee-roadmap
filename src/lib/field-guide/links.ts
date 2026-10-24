// src/lib/field-guide/links.ts
// Link helpers shared by the field-guide pages.

import type { ViewerTarget } from './types';

/** Deep link into the Grid Code Viewer tool for a document/clause. */
export function viewerHref(v: ViewerTarget, base = '/'): string {
  const p = new URLSearchParams({ doc: v.doc, view: 'viewer' });
  if (v.clause) p.set('clause', v.clause);
  if (v.page) p.set('page', String(v.page));
  return `${base}tools/grid-code-viewer/?${p.toString()}`;
}

const SHORT_DOC: Record<string, string> = {
  'grid-code': 'NESO GC',
  'digitalised-grid-code': 'NESO GC (digital)',
  'erec-g99': 'G99',
  'eirgrid-grid-code': 'EirGrid GC',
  'soni-grid-code': 'SONI GC',
  'nc-rfg': 'RfG',
  'eirgrid-scu-impl-note': 'SCU note',
  'eirgrid-scu-emt-spec': 'SCU EMT spec',
  'ie-rfg-banding': 'IE banding',
  'gn-grid-forming': 'NESO GFM guide',
  'gn-stability-pathfinder': 'NESO Pathfinder',
  'gn-storage': 'NESO storage GN',
};

/** Short document label for a reference chip, e.g. "EirGrid GC". */
export function shortDocLabel(docId: string, publisher: string): string {
  return SHORT_DOC[docId] ?? publisher;
}

/** Colour family per jurisdiction/publisher, used for reference chips and chart series. */
export function jurisdictionTone(j: string): 'gb' | 'ie' | 'ni' | 'eu' | 'other' {
  if (j === 'GB' || j === 'Scotland' || j === 'Offshore' || j === 'G99') return 'gb';
  if (j === 'IE') return 'ie';
  if (j === 'NI') return 'ni';
  if (j === 'EU' || j === 'RfG') return 'eu';
  return 'other';
}
