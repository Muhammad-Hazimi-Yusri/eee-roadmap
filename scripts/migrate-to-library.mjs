#!/usr/bin/env node
/**
 * migrate-to-library.mjs
 *
 * One-time migration: extracts concepts from track YAML files into a shared
 * concept library, then rewrites track files to use ref: syntax.
 *
 * Outputs (originals in content/ are NOT deleted — keep for diffing):
 *   content/concepts/<domain>.yaml   — domain-grouped concept library files
 *   content/tracks/<track>.yaml      — tracks rewritten with ref: syntax
 *   migration-report.json            — detailed log of all decisions made
 *
 * Usage: node scripts/migrate-to-library.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const CONTENT    = join(ROOT, 'content');
const CONCEPTS   = join(CONTENT, 'concepts');
const TRACKS_OUT = join(CONTENT, 'tracks');

const EXCLUDE = new Set(['sample', '_glossary']);

// ─── Domain metadata ─────────────────────────────────────────────────────────

const DOMAIN_META = {
  mathematics:            'Mathematical foundations: complex numbers, calculus, linear algebra, and transforms',
  'circuit-analysis':     'Laws, theorems, and techniques for analysing DC and AC electrical circuits',
  electronics:            'Semiconductor devices, amplifiers, and analogue electronics',
  'digital-electronics':  'Logic circuits, digital design, and microprocessor fundamentals',
  'signals-systems':      'Signal processing, Fourier/Laplace analysis, and system theory',
  'power-electronics':    'Power conversion: inverters, converters, and motor drives',
  'control-systems':      'Feedback control, stability analysis, and system dynamics',
  electromagnetics:       "Electric and magnetic fields, Maxwell's equations, and wave propagation",
  'power-systems':        'Generation, transmission, distribution, and protection of electrical power systems',
  'distributed-generation': 'Renewable energy integration, microgrids, and distributed energy resources',
  instrumentation:        'Measurement, sensors, and test equipment',
  uncategorized:          'Concepts awaiting manual categorisation into a domain',
};

// ─── Domain assignment rules ──────────────────────────────────────────────────
// Checked in order — first match wins.
// match(trackSlug, sectionId) → bool

const DOMAIN_RULES = [
  // Whole-track assignments (highest priority)
  {
    match: (t) => t === 'power-system-fundamentals' || t === 'advanced-power-system-analysis',
    domain: 'power-systems',
  },
  { match: (t) => t === 'distributed-generation', domain: 'distributed-generation' },

  // fundamentals — section-based
  { match: (t, s) => t === 'fundamentals' && s === 'math-foundations', domain: 'mathematics' },
  {
    match: (t, s) => t === 'fundamentals' && /circuit|dc|ac|network|thevenin|norton|superpos/i.test(s),
    domain: 'circuit-analysis',
  },
  {
    match: (t, s) => t === 'fundamentals' && /component|device|diode|transistor|semiconductor|bjt|mosfet|op.?amp/i.test(s),
    domain: 'electronics',
  },
  {
    match: (t, s) => t === 'fundamentals' && /electromag|field|maxwell|wave/i.test(s),
    domain: 'electromagnetics',
  },
  {
    match: (t, s) => t === 'fundamentals' && /measur|lab|instrument|sensor/i.test(s),
    domain: 'instrumentation',
  },
  { match: (t) => t === 'fundamentals', domain: 'circuit-analysis' }, // fallback for fundamentals

  // core — section-based
  { match: (t, s) => t === 'core' && /analog|amplif|filter/i.test(s),                           domain: 'electronics' },
  { match: (t, s) => t === 'core' && /digital|logic|gate|flip|micro/i.test(s),                  domain: 'digital-electronics' },
  { match: (t, s) => t === 'core' && /signal|fourier|laplace|spectrum|transform/i.test(s),      domain: 'signals-systems' },
  { match: (t, s) => t === 'core' && /power.?electron|converter|inverter|rectif|switch/i.test(s), domain: 'power-electronics' },
  { match: (t, s) => t === 'core' && /control|feedback|pid|stability|bode/i.test(s),            domain: 'control-systems' },
  { match: (t, s) => t === 'core' && /electromag|maxwell|wave|antenna/i.test(s),                domain: 'electromagnetics' },
  { match: (t) => t === 'core', domain: 'uncategorized' },

  // advanced — section-based
  { match: (t, s) => t === 'advanced' && /signal|dsp|fourier|laplace|transform/i.test(s),   domain: 'signals-systems' },
  { match: (t, s) => t === 'advanced' && /control|state.?space|optimal|robust/i.test(s),   domain: 'control-systems' },
  { match: (t, s) => t === 'advanced' && /power|converter|drive|machine/i.test(s),         domain: 'power-electronics' },
  { match: (t, s) => t === 'advanced' && /electromag|rf|microwave|antenna/i.test(s),       domain: 'electromagnetics' },
  { match: (t, s) => t === 'advanced' && /analog|vlsi|ic.?design/i.test(s),                domain: 'electronics' },
  { match: (t) => t === 'advanced', domain: 'uncategorized' },

  // Fallback
  { match: () => true, domain: 'uncategorized' },
];

// Domain priority for conflict resolution (lower index = preferred)
const DOMAIN_PRIORITY = [
  'power-systems', 'distributed-generation',
  'mathematics', 'circuit-analysis', 'electronics', 'digital-electronics',
  'signals-systems', 'power-electronics', 'control-systems', 'electromagnetics',
  'instrumentation', 'uncategorized',
];

function assignDomain(trackSlug, sectionId) {
  for (const rule of DOMAIN_RULES) {
    if (rule.match(trackSlug, sectionId ?? '')) return rule.domain;
  }
  return 'uncategorized';
}

function betterDomain(a, b) {
  const ia = DOMAIN_PRIORITY.indexOf(a);
  const ib = DOMAIN_PRIORITY.indexOf(b);
  if (ia === -1) return b;
  if (ib === -1) return a;
  return ia <= ib ? a : b;
}

// ─── Name / ID utilities ──────────────────────────────────────────────────────

/** Normalize a name for deduplication comparison. */
function normalizeName(name) {
  return (name ?? '')
    .toLowerCase()
    .replace(/[''`']/g, '')     // remove apostrophes
    .replace(/[^\w\s]/g, ' ')   // non-word chars → space
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generate a stable kebab-case ID from a concept name. */
function nameToId(name) {
  return (name ?? '')
    .toLowerCase()
    .replace(/[''`']/g, '')
    .replace(/&/g, 'and')
    .replace(/π/g, 'pi')
    .replace(/[Ωω]/g, 'omega')
    .replace(/μ/g, 'mu')
    .replace(/α/g, 'alpha')
    .replace(/β/g, 'beta')
    .replace(/θ/g, 'theta')
    .replace(/φ/g, 'phi')
    .replace(/δ/g, 'delta')
    .replace(/ε/g, 'epsilon')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Notes utilities ──────────────────────────────────────────────────────────

function notesEmpty(notes) {
  return !notes || String(notes).trim() === '';
}

function notesIdentical(a, b) {
  return (a ?? '').trim() === (b ?? '').trim();
}

/** True if `a` is fully contained within `b` (canonical covers track's notes). */
function notesContainedIn(a, b) {
  if (notesEmpty(a)) return true;
  return (b ?? '').includes(a.trim());
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. Find track files ───────────────────────────────────────────────────
  const trackSlugs = readdirSync(CONTENT)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''))
    .filter(f => !EXCLUDE.has(f))
    .sort();

  console.log(`\n📂  Found ${trackSlugs.length} track files: ${trackSlugs.join(', ')}\n`);

  // ── 2. Parse tracks ───────────────────────────────────────────────────────
  /** @type {Map<string, object>} slug → parsed YAML */
  const tracks = new Map();
  for (const slug of trackSlugs) {
    const raw = readFileSync(join(CONTENT, `${slug}.yaml`), 'utf-8');
    tracks.set(slug, YAML.parse(raw));
  }

  // ── 3. Build concept map ──────────────────────────────────────────────────
  // conceptMap: normalizedName → {
  //   normalizedKey, canonicalName, canonicalNotes, domain, id,
  //   occurrences: [{ trackSlug, sectionId, topicId, topicTitle, name, notes, domain }]
  // }
  const conceptMap = new Map();

  for (const [slug, data] of tracks.entries()) {
    for (const section of (data.sections ?? [])) {
      const sectionId = section.id ?? '';
      const domain = assignDomain(slug, sectionId);

      for (const item of (section.items ?? [])) {
        for (const concept of (item.concepts ?? [])) {
          if (!concept.name) continue;

          const normalized = normalizeName(concept.name);
          const occurrence = {
            trackSlug: slug,
            sectionId,
            topicId: item.id,
            topicTitle: item.title,
            name: concept.name,
            notes: concept.notes ?? null,
            domain,
          };

          if (!conceptMap.has(normalized)) {
            conceptMap.set(normalized, {
              normalizedKey: normalized,
              canonicalName: concept.name,
              canonicalNotes: concept.notes ?? null,
              domain,
              id: null,           // assigned in step 4
              occurrences: [occurrence],
            });
          } else {
            const entry = conceptMap.get(normalized);
            entry.occurrences.push(occurrence);

            // Prefer longer / more fully-capitalised name as canonical
            if (concept.name.length > entry.canonicalName.length) {
              entry.canonicalName = concept.name;
            }

            // Prefer the longest non-empty notes as canonical
            if (!notesEmpty(concept.notes)) {
              if (
                notesEmpty(entry.canonicalNotes) ||
                concept.notes.trim().length > (entry.canonicalNotes?.trim().length ?? 0)
              ) {
                entry.canonicalNotes = concept.notes;
              }
            }

            // Keep the most specific domain
            entry.domain = betterDomain(entry.domain, domain);
          }
        }
      }
    }
  }

  console.log(`📊  ${conceptMap.size} unique concepts found across all tracks\n`);

  // ── 4. Assign concept IDs (resolve collisions) ────────────────────────────
  const usedIds = new Map(); // id → normalizedKey
  const idConflicts = [];

  for (const entry of conceptMap.values()) {
    let base = nameToId(entry.canonicalName);
    if (!base) base = 'concept';

    let id = base;
    let suffix = 2;
    while (usedIds.has(id) && usedIds.get(id) !== entry.normalizedKey) {
      id = `${base}-${suffix++}`;
    }

    if (id !== base) {
      idConflicts.push({ id, baseName: entry.canonicalName, base });
      console.warn(`  ⚠️  ID collision: "${entry.canonicalName}" → "${id}" (suffix added)`);
    }

    entry.id = id;
    usedIds.set(id, entry.normalizedKey);
  }

  // ── 5. Group by domain ────────────────────────────────────────────────────
  // domains: domain → Map(conceptId → entry)
  const domains = new Map();
  for (const entry of conceptMap.values()) {
    if (!domains.has(entry.domain)) domains.set(entry.domain, new Map());
    domains.get(entry.domain).set(entry.id, entry);
  }

  // ── 6. Create output directories ──────────────────────────────────────────
  mkdirSync(CONCEPTS,   { recursive: true });
  mkdirSync(TRACKS_OUT, { recursive: true });

  // ── 7. Write concept domain YAML files ───────────────────────────────────
  console.log('✍️   Writing concept domain files...\n');

  const reportDomains = {};

  for (const [domain, concepts] of [...domains.entries()].sort()) {
    const conceptsObj = {};
    for (const [id, entry] of [...concepts.entries()].sort()) {
      conceptsObj[id] = {
        name: entry.canonicalName,
        ...(notesEmpty(entry.canonicalNotes) ? {} : { notes: entry.canonicalNotes }),
      };
    }

    const domainDoc = {
      _meta: {
        domain,
        description: DOMAIN_META[domain] ?? `Concepts in the ${domain} domain`,
      },
      concepts: conceptsObj,
    };

    const yamlOut = YAML.stringify(domainDoc, { lineWidth: 0 });
    const header = [
      `# EEE Roadmap — Concept Library: ${domain}`,
      `# Auto-generated by scripts/migrate-to-library.mjs — review and edit as needed.`,
      `# See CONTRIBUTING.md for the concept file format.`,
      ``,
    ].join('\n');

    const outPath = join(CONCEPTS, `${domain}.yaml`);
    writeFileSync(outPath, header + yamlOut, 'utf-8');
    console.log(`  ✅  content/concepts/${domain}.yaml  (${concepts.size} concepts)`);
    reportDomains[domain] = [...concepts.keys()].sort();
  }

  // ── 8. Rewrite track files with ref: syntax ───────────────────────────────
  console.log('\n✍️   Rewriting track files...\n');

  // Quick lookup: normalizedName → entry
  const byNorm = new Map();
  for (const [k, v] of conceptMap.entries()) byNorm.set(k, v);

  const allOverrides = [];
  const allUnresolved = [];

  for (const [slug, data] of tracks.entries()) {
    for (const section of (data.sections ?? [])) {
      for (const item of (section.items ?? [])) {
        if (!Array.isArray(item.concepts) || item.concepts.length === 0) continue;

        const newConcepts = [];

        for (const concept of item.concepts) {
          if (!concept.name) {
            // Unusual — pass through
            newConcepts.push(concept);
            continue;
          }

          const normalized = normalizeName(concept.name);
          const entry = byNorm.get(normalized);

          if (!entry) {
            // Shouldn't happen; fall back to inline and log
            console.warn(`  ⚠️  Unresolved: "${concept.name}" in ${slug}/${item.id}`);
            newConcepts.push(concept);
            allUnresolved.push({ track: slug, topicId: item.id, name: concept.name });
            continue;
          }

          const trackNotes  = concept.notes ?? null;
          const canonNotes  = entry.canonicalNotes;

          if (
            notesEmpty(trackNotes) ||
            notesIdentical(trackNotes, canonNotes) ||
            notesContainedIn(trackNotes, canonNotes)
          ) {
            // Bare ref — canonical covers this track's notes
            newConcepts.push({ ref: entry.id });
          } else {
            // Notes differ — use notes_replace override
            newConcepts.push({ ref: entry.id, override: { notes_replace: trackNotes } });
            allOverrides.push({
              conceptId: entry.id,
              conceptName: entry.canonicalName,
              track: slug,
              topicId: item.id,
              reason: 'notes_differ',
            });
          }
        }

        item.concepts = newConcepts;
      }
    }

    const header = [
      `# EEE Roadmap — ${data.meta?.title ?? slug} Track`,
      `# Migrated to concept library format. Concepts live in content/concepts/`,
      `# See CONTRIBUTING.md for the track and concept library formats.`,
      ``,
    ].join('\n');

    const outPath = join(TRACKS_OUT, `${slug}.yaml`);
    writeFileSync(outPath, header + YAML.stringify(data, { lineWidth: 0 }), 'utf-8');
    console.log(`  ✅  content/tracks/${slug}.yaml`);
  }

  // ── 9. Build migration report ─────────────────────────────────────────────
  const multiTrackConcepts = [];
  for (const entry of conceptMap.values()) {
    const distinctTracks = [...new Set(entry.occurrences.map(o => o.trackSlug))];
    if (distinctTracks.length > 1) {
      multiTrackConcepts.push({
        id: entry.id,
        name: entry.canonicalName,
        domain: entry.domain,
        occurrences: entry.occurrences.length,
        tracks: distinctTracks,
        hasCanonicalNotes: !notesEmpty(entry.canonicalNotes),
        overrideCount: allOverrides.filter(o => o.conceptId === entry.id).length,
      });
    }
  }

  // Per-track concept counts
  const trackStats = {};
  for (const slug of trackSlugs) {
    const data = tracks.get(slug);
    let total = 0;
    for (const section of (data.sections ?? [])) {
      for (const item of (section.items ?? [])) {
        total += (item.concepts ?? []).length;
      }
    }
    trackStats[slug] = { totalConceptSlots: total };
  }

  const report = {
    summary: {
      tracksProcessed: trackSlugs.length,
      uniqueConcepts: conceptMap.size,
      domainsCreated: domains.size,
      multiTrackConcepts: multiTrackConcepts.length,
      overridesCreated: allOverrides.length,
      unresolvedConcepts: allUnresolved.length,
      idConflicts: idConflicts.length,
    },
    trackStats,
    domains: reportDomains,
    multiTrackConcepts,
    overrides: allOverrides,
    unresolved: allUnresolved,
    idConflicts,
  };

  const reportPath = join(ROOT, 'migration-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // ── 10. Summary ───────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('✨  Migration complete!\n');
  console.log(`  Tracks processed   : ${trackSlugs.length}`);
  console.log(`  Unique concepts    : ${conceptMap.size}`);
  console.log(`  Domain files       : ${domains.size}`);
  console.log(`  Multi-track shared : ${multiTrackConcepts.length}`);
  console.log(`  Overrides created  : ${allOverrides.length}`);
  if (allUnresolved.length > 0) {
    console.log(`  ⚠️  Unresolved       : ${allUnresolved.length} (check migration-report.json)`);
  }
  if (idConflicts.length > 0) {
    console.log(`  ⚠️  ID conflicts     : ${idConflicts.length} (check migration-report.json)`);
  }
  console.log('\n  Output:');
  console.log('    content/concepts/   — concept domain files');
  console.log('    content/tracks/     — rewritten track files');
  console.log('    migration-report.json\n');
  console.log('  Next steps:');
  console.log('    1. Review migration-report.json for overrides and multi-track concepts');
  console.log('    2. Diff content/<track>.yaml vs content/tracks/<track>.yaml');
  console.log('    3. Spot-check concept domain files for correctness');
  console.log('    4. Run: npm run build:data (after Phase 2 build pipeline update)');
}

main().catch(err => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
