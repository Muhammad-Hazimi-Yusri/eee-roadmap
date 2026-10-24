/**
 * build-field-guide.mjs
 *
 * Reads the consultant field guide from content/field-guide/ and emits
 * src/data/field-guide/guide.json with every reference resolved:
 *
 *   - clause refs  → content/standards/_clauses.yaml (+ their documents)
 *   - doc refs     → content/standards/_catalogue.yaml
 *   - source refs  → content/field-guide/_sources.yaml (books, CIGRE, IEEE)
 *   - concepts     → content/concepts/*.yaml, plus every roadmap topic that
 *                    teaches the concept (from content/tracks/*.yaml)
 *
 * Any unresolved reference is an error and fails the build: the guide's
 * whole promise is "every claim points at a real clause or chapter".
 *
 * Run via: node scripts/build-field-guide.mjs
 * Called automatically as part of: npm run build:data
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(__dirname, '..');

export const JURISDICTIONS = [
  { id: 'GB',  label: 'GB transmission', short: 'GB',  rulebook: 'NESO Grid Code (ECC)' },
  { id: 'G99', label: 'GB distribution', short: 'G99', rulebook: 'ENA EREC G99' },
  { id: 'IE',  label: 'Ireland',         short: 'IE',  rulebook: 'EirGrid Grid Code' },
  { id: 'NI',  label: 'Northern Ireland', short: 'NI', rulebook: 'SONI Grid Code' },
  { id: 'RfG', label: 'EU baseline',     short: 'RfG', rulebook: 'NC RfG 2016/631' },
];

export const VISUALS = new Set([
  'landscape-map', 'document-stack', 'banding-chart', 'lifecycle',
  'rocof-calculator', 'syncon-anatomy', 'capability-chart',
  'frt-explorer', 'ffci-sketch',
  'voltage-slope',
  'droop-explorer', 'frequency-timeline',
]);

const REQUIRED_TOPIC_FIELDS = ['id', 'title', 'order', 'checked', 'summary', 'bigPicture'];

function loadYaml(path) {
  return YAML.parse(readFileSync(path, 'utf-8'));
}

/** Read every input the build needs from disk. */
export function loadInputs(root = DEFAULT_ROOT) {
  const guideDir = join(root, 'content', 'field-guide');
  const topics = readdirSync(guideDir)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
    .sort()
    .map(f => ({ file: f, data: loadYaml(join(guideDir, f)) }));

  const sources   = loadYaml(join(guideDir, '_sources.yaml'))?.sources ?? {};
  const catalogue = loadYaml(join(root, 'content', 'standards', '_catalogue.yaml'))?.documents ?? [];
  const clauses   = loadYaml(join(root, 'content', 'standards', '_clauses.yaml'))?.clauses ?? [];

  const conceptsDir = join(root, 'content', 'concepts');
  const concepts = {};
  for (const f of readdirSync(conceptsDir).filter(f => f.endsWith('.yaml') && !f.startsWith('_'))) {
    const data = loadYaml(join(conceptsDir, f));
    for (const [id, c] of Object.entries(data?.concepts ?? {})) concepts[id] = c;
  }

  const tracksDir = join(root, 'content', 'tracks');
  const tracks = existsSync(tracksDir)
    ? readdirSync(tracksDir).filter(f => f.endsWith('.yaml')).sort()
        .map(f => ({ slug: basename(f, '.yaml'), data: loadYaml(join(tracksDir, f)) }))
    : [];

  return { topics, sources, catalogue, clauses, concepts, tracks };
}

function docHref(doc, page) {
  if (doc.pdfUrl && page > 0) return `${doc.pdfUrl}#page=${page}`;
  return doc.landingUrl || doc.pdfUrl || '';
}

function sourceLabel(src, section) {
  const lead = src.authors.split(',')[0].trim();
  const etAl = src.authors.includes(',') && !src.authors.includes('(eds)') ? ' et al.' : '';
  const who = src.kind === 'brochure' ? src.edition : `${lead}${etAl}`;
  if (!section) return `${who} ${src.year}`;
  const where = /^\d/.test(section.id)
    ? (section.id.includes('.') ? `§${section.id}` : `ch. ${section.id}`)
    : section.title;
  return `${who} ${src.year}, ${where}${section.page ? ` (p. ${section.page})` : ''}`;
}

/**
 * Pure build step: validate and resolve. Returns { guide, errors }.
 * Errors are human-readable strings; an empty list means the guide is sound.
 */
export function buildFieldGuide(inputs, { generatedAt = new Date().toISOString() } = {}) {
  const { topics, sources, catalogue, clauses, concepts, tracks } = inputs;
  const errors = [];
  const docById = new Map(catalogue.map(d => [d.id, d]));
  const clauseByRef = new Map(clauses.map(c => [c.ref, c]));
  const topicIds = new Set(topics.map(t => t.data?.id));

  // concept id → roadmap locations that teach it
  const conceptLocations = {};
  for (const { slug, data } of tracks) {
    for (const section of data?.sections ?? []) {
      for (const item of section.items ?? []) {
        for (const c of item.concepts ?? []) {
          if (!c?.ref) continue;
          (conceptLocations[c.ref] ??= []).push({
            track: slug, trackTitle: data.meta?.title ?? slug,
            topicId: item.id, topicTitle: item.title,
          });
        }
      }
    }
  }

  const resolveRef = (raw, where) => {
    const r = typeof raw === 'string'
      ? (raw.includes('/') ? { clause: raw } : { doc: raw })
      : raw ?? {};
    if (r.clause) {
      const c = clauseByRef.get(r.clause);
      if (!c) { errors.push(`${where}: unknown clause "${r.clause}"`); return null; }
      const doc = docById.get(c.docId);
      if (!doc) { errors.push(`${where}: clause "${r.clause}" has unknown doc "${c.docId}"`); return null; }
      const page = c.pageStart ?? 0;
      return {
        kind: 'clause', ref: c.ref, label: c.clauseId, title: c.title, summary: c.summary ?? '',
        pin: r.pin ?? null, page,
        doc: { id: doc.id, title: doc.title, publisher: doc.publisher, version: doc.version ?? '', jurisdiction: doc.jurisdiction ?? '' },
        href: docHref(doc, page),
        viewer: { doc: doc.id, clause: c.clauseId, page: page > 0 ? page : null },
      };
    }
    if (r.doc) {
      const doc = docById.get(r.doc);
      if (!doc) { errors.push(`${where}: unknown document "${r.doc}"`); return null; }
      return {
        kind: 'doc', ref: doc.id, label: doc.title, title: doc.title, summary: doc.summary ?? '',
        pin: r.pin ?? null, page: 0,
        doc: { id: doc.id, title: doc.title, publisher: doc.publisher, version: doc.version ?? '', jurisdiction: doc.jurisdiction ?? '' },
        href: docHref(doc, 0),
        viewer: { doc: doc.id, clause: null, page: null },
      };
    }
    if (r.source) {
      const src = sources[r.source];
      if (!src) { errors.push(`${where}: unknown source "${r.source}"`); return null; }
      let section = null;
      if (r.section) {
        section = (src.sections ?? []).find(s => s.id === String(r.section));
        if (!section) { errors.push(`${where}: source "${r.source}" has no section "${r.section}"`); return null; }
      }
      return {
        kind: 'source', ref: r.source, label: sourceLabel(src, section),
        title: src.title, sectionTitle: section?.title ?? null,
        page: section?.page ?? null,
        status: section?.status ?? 'checked',
        access: src.access, href: src.url ?? (src.doi ? `https://doi.org/${src.doi}` : ''),
      };
    }
    errors.push(`${where}: reference needs clause, doc or source (${JSON.stringify(raw)})`);
    return null;
  };

  const resolveList = (list, where) => (list ?? []).map((r, i) => resolveRef(r, `${where}[${i}]`)).filter(Boolean);

  const seenOrders = new Map();
  const out = [];
  for (const { file, data: t } of topics) {
    const where = `field-guide/${file}`;
    if (!t || typeof t !== 'object') { errors.push(`${where}: empty or invalid YAML`); continue; }
    for (const f of REQUIRED_TOPIC_FIELDS) {
      if (t[f] === undefined || t[f] === '') errors.push(`${where}: missing "${f}"`);
    }
    if (t.id && `${t.id}.yaml` !== file) errors.push(`${where}: id "${t.id}" must match the file name`);
    if (seenOrders.has(t.order)) errors.push(`${where}: order ${t.order} also used by ${seenOrders.get(t.order)}`);
    seenOrders.set(t.order, file);

    for (const v of t.visuals ?? []) {
      if (!VISUALS.has(v)) errors.push(`${where}: unknown visual "${v}"`);
    }
    for (const c of t.concepts ?? []) {
      if (!concepts[c]) errors.push(`${where}: unknown concept "${c}"`);
    }
    for (const r of t.related ?? []) {
      if (!topicIds.has(r)) errors.push(`${where}: unknown related topic "${r}"`);
    }

    const block = (items, key) => (items ?? []).map((it, i) => ({
      title: it.title, body: it.body ?? '',
      refs: resolveList(it.refs, `${where} ${key}[${i}]`),
    }));

    const matrix = t.matrix ? {
      caption: t.matrix.caption ?? '',
      rows: (t.matrix.rows ?? []).map((row, i) => {
        const cells = {};
        for (const [jur, cell] of Object.entries(row.cells ?? {})) {
          if (!JURISDICTIONS.some(j => j.id === jur)) {
            errors.push(`${where} matrix[${i}]: unknown column "${jur}"`);
            continue;
          }
          const refs = [
            ...(cell.ref ? [cell.ref] : []),
            ...(cell.refs ?? []),
          ];
          cells[jur] = {
            text: cell.text,
            refs: resolveList(refs, `${where} matrix[${i}].${jur}`),
          };
        }
        return { param: row.param, cells };
      }),
    } : null;

    out.push({
      id: t.id, title: t.title, kicker: t.kicker ?? '', order: t.order, checked: t.checked,
      asks: t.asks ?? [], summary: t.summary, bigPicture: t.bigPicture,
      visuals: t.visuals ?? [],
      keyIdeas: block(t.keyIdeas, 'keyIdeas'),
      matrix,
      pitfalls: block(t.pitfalls, 'pitfalls'),
      inStudies: block(t.inStudies, 'inStudies'),
      reading: (t.reading ?? []).map((r, i) => {
        const ref = resolveRef(r, `${where} reading[${i}]`);
        return ref ? { ...ref, why: r.why ?? '' } : null;
      }).filter(Boolean),
      concepts: (t.concepts ?? []).filter(c => concepts[c]).map(id => ({
        id, name: concepts[id].name, locations: conceptLocations[id] ?? [],
      })),
      related: t.related ?? [],
    });
  }

  out.sort((a, b) => a.order - b.order);

  // Every clause and document the guide cites, for the "sources used" index.
  const cited = new Map();
  const collect = (refs, topicId) => {
    for (const r of refs) {
      if (r.kind === 'source') continue;
      const entry = cited.get(r.ref) ?? { ...r, pin: null, topics: [] };
      if (!entry.topics.includes(topicId)) entry.topics.push(topicId);
      cited.set(r.ref, entry);
    }
  };
  for (const t of out) {
    for (const b of [...t.keyIdeas, ...t.pitfalls, ...t.inStudies]) collect(b.refs, t.id);
    for (const row of t.matrix?.rows ?? []) for (const cell of Object.values(row.cells)) collect(cell.refs, t.id);
  }

  const guide = {
    _meta: { generatedAt, topicCount: out.length, citedCount: cited.size },
    jurisdictions: JURISDICTIONS,
    topics: out,
    cited: [...cited.values()].sort((a, b) => a.ref.localeCompare(b.ref)),
    sources: Object.entries(sources).map(([id, s]) => ({
      id, kind: s.kind, authors: s.authors, title: s.title, edition: s.edition ?? '',
      publisher: s.publisher, year: s.year, isbn: s.isbn ?? '', doi: s.doi ?? '',
      href: s.url ?? (s.doi ? `https://doi.org/${s.doi}` : ''), access: s.access, basis: s.basis ?? '',
      sections: s.sections ?? [],
    })),
  };
  return { guide, errors };
}

function main() {
  console.log('🔄 Building field guide...\n');
  const { guide, errors } = buildFieldGuide(loadInputs());
  if (errors.length) {
    for (const e of errors) console.log(`  ❌ ${e}`);
    console.log(`\n❌ Field guide has ${errors.length} unresolved reference(s)`);
    process.exit(1);
  }
  const outDir = join(DEFAULT_ROOT, 'src', 'data', 'field-guide');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'guide.json');
  writeFileSync(outPath, JSON.stringify(guide, null, 2), 'utf-8');
  console.log(`  ✅ ${guide.topics.length} topics, ${guide._meta.citedCount} cited clauses/documents, ${guide.sources.length} sources`);
  console.log(`  → ${outPath}\n`);
  console.log('✨ Field guide built\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
