// Unit test for the standards build script — runs the build and validates
// the resulting JSON outputs against expected shape.

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..', '..');
const INDEX     = join(ROOT, 'src',    'data', 'standards-index.json');
const PUBLIC    = join(ROOT, 'public', 'data', 'standards.json');

describe('build-standards.mjs output', () => {
  beforeAll(() => {
    execSync('node scripts/build-standards.mjs', { cwd: ROOT, stdio: 'pipe' });
  });

  it('writes both index and public payload', () => {
    expect(existsSync(INDEX)).toBe(true);
    expect(existsSync(PUBLIC)).toBe(true);
  });

  it('public payload has the right top-level shape', () => {
    const payload = JSON.parse(readFileSync(PUBLIC, 'utf-8'));
    expect(payload).toHaveProperty('_meta');
    expect(payload).toHaveProperty('documents');
    expect(payload).toHaveProperty('clauses');
    expect(payload).toHaveProperty('xrefs');
    expect(payload).toHaveProperty('incoming');
    expect(payload).toHaveProperty('outgoing');
    expect(Array.isArray(payload.documents)).toBe(true);
    expect(payload.documents.length).toBeGreaterThan(10);
  });

  it('every clause points to a known document', () => {
    const payload = JSON.parse(readFileSync(PUBLIC, 'utf-8'));
    const docIds = new Set(payload.documents.map(d => d.id));
    for (const c of payload.clauses) {
      expect(docIds.has(c.docId), `clause ${c.ref} → unknown docId "${c.docId}"`).toBe(true);
    }
  });

  it('every xref endpoint resolves to a known clause or document', () => {
    const payload = JSON.parse(readFileSync(PUBLIC, 'utf-8'));
    const docIds     = new Set(payload.documents.map(d => d.id));
    const clauseRefs = new Set(payload.clauses.map(c => c.ref));
    for (const x of payload.xrefs) {
      const fromOk = clauseRefs.has(x.from) || docIds.has(x.from);
      const toOk   = clauseRefs.has(x.to)   || docIds.has(x.to);
      expect(fromOk, `xref from="${x.from}" not resolved`).toBe(true);
      expect(toOk,   `xref to="${x.to}" not resolved`).toBe(true);
    }
  });

  it('document IDs are unique', () => {
    const payload = JSON.parse(readFileSync(PUBLIC, 'utf-8'));
    const seen = new Set();
    for (const d of payload.documents) {
      expect(seen.has(d.id), `duplicate document id "${d.id}"`).toBe(false);
      seen.add(d.id);
    }
  });

  it('clause refs are unique', () => {
    const payload = JSON.parse(readFileSync(PUBLIC, 'utf-8'));
    const seen = new Set();
    for (const c of payload.clauses) {
      expect(seen.has(c.ref), `duplicate clause ref "${c.ref}"`).toBe(false);
      seen.add(c.ref);
    }
  });

  it('outgoing and incoming adjacency mirror the xref list', () => {
    const payload = JSON.parse(readFileSync(PUBLIC, 'utf-8'));
    let outTotal = 0;
    let inTotal  = 0;
    for (const edges of Object.values(payload.outgoing)) outTotal += edges.length;
    for (const edges of Object.values(payload.incoming)) inTotal  += edges.length;
    expect(outTotal).toBe(payload.xrefs.length);
    expect(inTotal).toBe(payload.xrefs.length);
  });

  it('search index has expected entry shape', () => {
    const index = JSON.parse(readFileSync(INDEX, 'utf-8'));
    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBeGreaterThan(20);
    for (const entry of index.slice(0, 5)) {
      expect(['document', 'clause']).toContain(entry.kind);
      expect(entry).toHaveProperty('ref');
      expect(entry).toHaveProperty('title');
      expect(Array.isArray(entry.tags)).toBe(true);
    }
  });
});
