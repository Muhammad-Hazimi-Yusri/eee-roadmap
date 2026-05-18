// src/lib/grid-code/types.ts
// Shared TypeScript types for the Grid Code & Standards Viewer tool.
// Matches the YAML schema in content/standards/ and the build output
// of scripts/build-standards.mjs.

export type ProjectType =
  | 'G98' | 'G99-A' | 'G99-B' | 'G99-C' | 'G99-D'
  | 'BESS' | 'Synch' | 'PPM' | 'HVDC' | 'OFTO' | 'Demand';

export type StudyType =
  | 'LoadFlow' | 'FaultLevel' | 'Reactive' | 'FRT' | 'FreqResp'
  | 'AVR' | 'PSS' | 'POD' | 'Harmonics' | 'Flicker' | 'Unbalance'
  | 'Protection' | 'LoM' | 'EMT' | 'BlackStart' | 'SSO' | 'FFCI';

export type LicenseBucket = 'link-only' | 'hostable-eu' | 'paywalled';

export type Publisher =
  | 'NESO' | 'ENA' | 'DCode' | 'EU' | 'UKGov'
  | 'IEEE' | 'IEC' | 'VDE' | 'AEMC' | 'CIGRE';

export type Jurisdiction = 'GB' | 'EU' | 'Scotland' | 'Offshore' | 'US' | 'DE' | 'AU';

export type XrefRelation =
  | 'defined-in' | 'defines' | 'modified-by' | 'see-also'
  | 'tested-by' | 'evidenced-by' | 'mirrors' | 'commercial';

export interface StandardDocument {
  id: string;
  title: string;
  publisher: Publisher;
  version?: string;
  date?: string;
  pdfUrl?: string;
  landingUrl?: string;
  license: LicenseBucket;
  projectTypes?: ProjectType[];
  studyTypes?: StudyType[];
  jurisdiction?: Jurisdiction;
  sizeMb?: number;
  pages?: number;
  summary?: string;
  // Whether the publisher allows cross-site iframing of pdfUrl directly.
  // When true and no local copy exists, the viewer renders a bare iframe
  // pointing at the publisher URL (native browser PDF viewer) instead of
  // showing the upload dropzone. Set conservatively based on per-publisher
  // X-Frame-Options / CSP frame-ancestors knowledge.
  iframeable?: boolean;
}

export type HighlightSource = 'id' | 'title' | 'custom';

// A single navigable anchor in the per-document outline. Comes from either
// _clauses.yaml (curated) or the post-upload heading extractor (auto).
export interface OutlineEntry {
  id:    string;     // clauseId, e.g. "ECC.6.3.7", "13.2", "Article 14"
  title: string;
  page:  number;     // 1-based
  source: 'curated' | 'auto';
}

export interface StandardClause {
  ref: string;       // e.g. "grid-code/ECC.6.3.15"
  docId: string;
  clauseId: string;
  title: string;
  pageStart?: number;
  projectTypes?: ProjectType[];
  studyTypes?: StudyType[];
  forms?: string[];
  summary?: string;
}

export interface Xref {
  from: string;
  to: string;
  relation: XrefRelation;
  note?: string;
}

export interface AdjacencyEntry {
  // For outgoing[ref] -> entries point `to`; for incoming[ref] -> entries point `from`.
  to?: string;
  from?: string;
  relation: XrefRelation;
  note?: string;
}

export interface StandardsPayload {
  _meta: {
    generatedAt: string;
    documentCount: number;
    clauseCount: number;
    xrefCount: number;
  };
  documents: StandardDocument[];
  clauses: StandardClause[];
  xrefs: Xref[];
  incoming: Record<string, AdjacencyEntry[]>;
  outgoing: Record<string, AdjacencyEntry[]>;
}

export interface FacetState {
  publisher?: Publisher[];
  projectTypes?: ProjectType[];
  studyTypes?: StudyType[];
  jurisdiction?: Jurisdiction[];
  license?: LicenseBucket[];
}

export interface ViewerState {
  doc?: string;       // docId from catalogue
  clause?: string;    // clauseId within doc (or full ref)
  page?: number;
  q?: string;         // search term
  facets?: FacetState;
  view?: 'list' | 'viewer';
}
