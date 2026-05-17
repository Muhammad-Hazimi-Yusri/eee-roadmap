/**
 * build-standards.mjs
 *
 * Reads the standards catalogue, clauses, and cross-references from
 * content/standards/ and emits:
 *
 *   src/data/standards-index.json   — Fuse.js search index (bundle inline)
 *   public/data/standards.json      — Full catalogue + clauses + xrefs
 *                                     (lazy-loaded by the React island at runtime)
 *
 * Run via: node scripts/build-standards.mjs
 * Called automatically as part of: npm run build:data
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT             = join(__dirname, '..');
const STANDARDS_DIR    = join(ROOT, 'content', 'standards');
const DATA_DIR         = join(ROOT, 'src', 'data');
const PUBLIC_DATA_DIR  = join(ROOT, 'public', 'data');
const CATALOGUE_PATH   = join(STANDARDS_DIR, '_catalogue.yaml');
const CLAUSES_PATH     = join(STANDARDS_DIR, '_clauses.yaml');
const XREFS_PATH       = join(STANDARDS_DIR, '_xrefs.yaml');
const INDEX_OUT_PATH   = join(DATA_DIR, 'standards-index.json');
const PUBLIC_OUT_PATH  = join(PUBLIC_DATA_DIR, 'standards.json');

function loadYaml(path) {
  if (!existsSync(path)) return null;
  return YAML.parse(readFileSync(path, 'utf-8'));
}

function buildStandards() {
  if (!existsSync(STANDARDS_DIR)) {
    console.log('⚠️  content/standards/ not found — skipping standards build');
    return;
  }

  console.log('🔄 Building standards catalogue...\n');

  const catalogue = loadYaml(CATALOGUE_PATH);
  const clauses   = loadYaml(CLAUSES_PATH);
  const xrefs     = loadYaml(XREFS_PATH);

  if (!catalogue?.documents) {
    console.log('  ⚠️  No documents in _catalogue.yaml — nothing to build');
    return;
  }

  const documents     = catalogue.documents;
  const clauseEntries = clauses?.clauses ?? [];
  const xrefEntries   = xrefs?.xrefs   ?? [];

  // Index documents by ID for fast lookup
  const docById = new Map(documents.map(d => [d.id, d]));

  // Validate clauses point to known docs
  const knownDocIds = new Set(documents.map(d => d.id));
  for (const c of clauseEntries) {
    if (!knownDocIds.has(c.docId)) {
      console.warn(`  ⚠️  clause ${c.ref} points to unknown docId "${c.docId}"`);
    }
  }

  // Validate xref endpoints; resolve them to clause refs
  const clauseRefs = new Set(clauseEntries.map(c => c.ref));
  const validXrefs = [];
  for (const x of xrefEntries) {
    // Allow endpoints to be either a clause ref or a bare docId
    const fromOk = clauseRefs.has(x.from) || knownDocIds.has(x.from);
    const toOk   = clauseRefs.has(x.to)   || knownDocIds.has(x.to);
    if (!fromOk) console.warn(`  ⚠️  xref from="${x.from}" not in clauses or documents`);
    if (!toOk)   console.warn(`  ⚠️  xref to="${x.to}" not in clauses or documents`);
    if (fromOk && toOk) validXrefs.push(x);
  }

  // Build incoming/outgoing adjacency for fast lookup at runtime
  const incoming = {};
  const outgoing = {};
  for (const x of validXrefs) {
    (outgoing[x.from] ??= []).push({ to: x.to, relation: x.relation, note: x.note });
    (incoming[x.to]   ??= []).push({ from: x.from, relation: x.relation, note: x.note });
  }

  // ── Public payload (catalogue + clauses + xrefs + adjacency) ────────────────
  const publicPayload = {
    _meta: {
      generatedAt: new Date().toISOString(),
      documentCount: documents.length,
      clauseCount:   clauseEntries.length,
      xrefCount:     validXrefs.length,
    },
    documents,
    clauses: clauseEntries,
    xrefs:   validXrefs,
    incoming,
    outgoing,
  };

  // ── Search index (smaller, bundle-friendly) ─────────────────────────────────
  const searchEntries = [];
  for (const d of documents) {
    searchEntries.push({
      kind: 'document',
      ref:  d.id,
      title: d.title,
      publisher: d.publisher,
      summary:   d.summary ?? '',
      tags: [
        ...(d.projectTypes ?? []),
        ...(d.studyTypes   ?? []),
        d.jurisdiction,
        d.license,
      ],
    });
  }
  for (const c of clauseEntries) {
    const doc = docById.get(c.docId);
    searchEntries.push({
      kind: 'clause',
      ref:  c.ref,
      title: c.title,
      clauseId: c.clauseId,
      docId:    c.docId,
      docTitle: doc?.title ?? '',
      publisher: doc?.publisher ?? '',
      summary:   c.summary ?? '',
      tags: [
        ...(c.projectTypes ?? []),
        ...(c.studyTypes   ?? []),
        ...(c.forms        ?? []),
      ],
    });
  }

  // ── Write outputs ───────────────────────────────────────────────────────────
  if (!existsSync(DATA_DIR))        mkdirSync(DATA_DIR,        { recursive: true });
  if (!existsSync(PUBLIC_DATA_DIR)) mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

  writeFileSync(INDEX_OUT_PATH,  JSON.stringify(searchEntries, null, 2), 'utf-8');
  writeFileSync(PUBLIC_OUT_PATH, JSON.stringify(publicPayload, null, 2), 'utf-8');

  console.log(`  ✅ ${documents.length} documents`);
  console.log(`  ✅ ${clauseEntries.length} clauses`);
  console.log(`  ✅ ${validXrefs.length} cross-references\n`);
  console.log(`  → ${INDEX_OUT_PATH}`);
  console.log(`  → ${PUBLIC_OUT_PATH}\n`);
  console.log('✨ Standards catalogue built\n');
}

buildStandards();
