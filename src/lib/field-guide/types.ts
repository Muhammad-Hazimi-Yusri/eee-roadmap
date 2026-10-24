// src/lib/field-guide/types.ts
// Shape of src/data/field-guide/guide.json, emitted by scripts/build-field-guide.mjs.

export type ColumnId = 'GB' | 'G99' | 'IE' | 'NI' | 'RfG';

export interface Column {
  id: ColumnId;
  label: string;
  short: string;
  rulebook: string;
}

export interface DocSummary {
  id: string;
  title: string;
  publisher: string;
  version: string;
  jurisdiction: string;
}

export interface ViewerTarget {
  doc: string;
  clause: string | null;
  page: number | null;
}

export interface ClauseRef {
  kind: 'clause' | 'doc';
  ref: string;
  label: string;
  title: string;
  summary: string;
  pin: string | null;
  page: number;
  doc: DocSummary;
  href: string;
  viewer: ViewerTarget;
}

export type SourceStatus = 'checked' | 'inferred' | 'memory';

export interface SourceRef {
  kind: 'source';
  ref: string;
  label: string;
  title: string;
  sectionTitle: string | null;
  page: number | null;
  status: SourceStatus;
  access: 'open' | 'paywalled';
  href: string;
  why?: string;
}

export type ResolvedRef = ClauseRef | SourceRef;

export interface Block {
  title: string;
  body: string;
  refs: ResolvedRef[];
}

export interface MatrixCell {
  text: string;
  refs: ResolvedRef[];
}

export interface MatrixRow {
  param: string;
  cells: Partial<Record<ColumnId, MatrixCell>>;
}

export interface ConceptLink {
  id: string;
  name: string;
  locations: { track: string; trackTitle: string; topicId: string; topicTitle: string }[];
}

export interface Topic {
  id: string;
  title: string;
  kicker: string;
  order: number;
  checked: string;
  asks: string[];
  summary: string;
  bigPicture: string;
  visuals: string[];
  keyIdeas: Block[];
  matrix: { caption: string; rows: MatrixRow[] } | null;
  pitfalls: Block[];
  inStudies: Block[];
  reading: SourceRef[];
  concepts: ConceptLink[];
  related: string[];
}

export interface Source {
  id: string;
  kind: string;
  authors: string;
  title: string;
  edition: string;
  publisher: string;
  year: number;
  isbn: string;
  doi: string;
  href: string;
  access: 'open' | 'paywalled';
  basis: string;
  sections: { id: string; title: string; page?: number; status: SourceStatus }[];
}

export interface Guide {
  _meta: { generatedAt: string; topicCount: number; citedCount: number };
  jurisdictions: Column[];
  topics: Topic[];
  cited: (ClauseRef & { topics: string[] })[];
  sources: Source[];
}
