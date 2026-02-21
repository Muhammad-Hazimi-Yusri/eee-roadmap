/**
 * Converts YAML roadmap files to JSON for the app to consume.
 * Supports both legacy inline-concept format (content/*.yaml) and
 * new concept-library format (content/tracks/*.yaml + content/concepts/).
 * Run via: npm run build:data
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const ROOT         = join(__dirname, '..');
const CONTENT_DIR  = join(ROOT, 'content');
const TRACKS_DIR   = join(CONTENT_DIR, 'tracks');
const CONCEPTS_DIR = join(CONTENT_DIR, 'concepts');
const DATA_DIR     = join(ROOT, 'src/data');

// Files to exclude from conversion (templates, examples)
const EXCLUDE = new Set(['sample', '_glossary']);

// Default meta values
const META_DEFAULTS = {
  title: '',       // Will derive from filename if empty
  description: '',
  icon: 'grid-3x3',
  featured: false,
  category: 'uncategorized',
  order: 999
};

/**
 * Convert filename to title case
 * e.g., 'distributed-generation' → 'Distributed Generation'
 */
function filenameToTitle(filename) {
  return filename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Load all concept domain files from content/concepts/ into a Map.
 * Returns Map<conceptId, { name, notes }> or null if library doesn't exist.
 */
function loadConceptLibrary() {
  if (!existsSync(CONCEPTS_DIR)) return null;

  const domainFiles = readdirSync(CONCEPTS_DIR)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

  if (domainFiles.length === 0) return null;

  const library = new Map(); // conceptId → { name, notes }

  for (const filename of domainFiles) {
    const raw  = readFileSync(join(CONCEPTS_DIR, filename), 'utf-8');
    const data = YAML.parse(raw);

    for (const [id, concept] of Object.entries(data.concepts ?? {})) {
      library.set(id, { name: concept.name, notes: concept.notes ?? undefined });
    }
  }

  return library;
}

/**
 * Resolve concept ref entries in a topic's concepts array.
 * - { ref: 'id' }                         → looks up library, returns { name, notes }
 * - { ref: 'id', override: { ... } }      → applies override to library notes
 * - { name: '...' }                        → pass-through (legacy inline format)
 *
 * @param {Array}  concepts  Raw concepts array from YAML
 * @param {Map}    library   Concept library map (or null for legacy mode)
 * @param {string} context   Track/topic path for error messages
 * @returns {Array} Resolved concepts array with { name, notes? } shape
 */
function resolveConceptRefs(concepts, library, context) {
  if (!Array.isArray(concepts)) return concepts;

  return concepts.map(concept => {
    // Legacy inline format — pass through unchanged
    if (concept.name !== undefined) return concept;

    // Ref format
    if (concept.ref !== undefined) {
      if (!library) {
        console.error(`  ❌ Ref "${concept.ref}" found in ${context} but no concept library loaded`);
        process.exit(1);
      }

      const base = library.get(concept.ref);
      if (!base) {
        console.error(`  ❌ Unresolved ref "${concept.ref}" in ${context}`);
        process.exit(1);
      }

      // Apply override if present
      const override = concept.override;
      if (!override) {
        return { name: base.name, ...(base.notes ? { notes: base.notes } : {}) };
      }

      if (override.notes_replace !== undefined) {
        // Replace notes entirely
        return {
          name: base.name,
          ...(override.notes_replace ? { notes: override.notes_replace } : {}),
        };
      }

      if (override.context_note !== undefined) {
        // Append context note to base notes
        const combined = [base.notes, override.context_note].filter(Boolean).join('\n\n');
        return { name: base.name, ...(combined ? { notes: combined } : {}) };
      }

      // Override block present but no recognised key — use base
      return { name: base.name, ...(base.notes ? { notes: base.notes } : {}) };
    }

    // Unknown format — pass through and warn
    console.warn(`  ⚠️  Unknown concept entry format in ${context}:`, concept);
    return concept;
  });
}

/**
 * Discover track files to process.
 * Prefers content/tracks/ (new library format) over content/ (legacy format).
 * Returns [{ slug, yamlPath, format }]
 */
function discoverTracks() {
  // New format: content/tracks/
  if (existsSync(TRACKS_DIR)) {
    const slugs = readdirSync(TRACKS_DIR)
      .filter(f => f.endsWith('.yaml'))
      .map(f => f.replace('.yaml', ''))
      .filter(f => !EXCLUDE.has(f));

    if (slugs.length > 0) {
      return slugs.map(slug => ({
        slug,
        yamlPath: join(TRACKS_DIR, `${slug}.yaml`),
        format: 'library',
      }));
    }
  }

  // Legacy fallback: content/
  console.log('  ℹ️  No content/tracks/ found — using legacy content/ directory\n');
  const slugs = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''))
    .filter(f => !EXCLUDE.has(f));

  return slugs.map(slug => ({
    slug,
    yamlPath: join(CONTENT_DIR, `${slug}.yaml`),
    format: 'legacy',
  }));
}

function buildData() {
  console.log('🔄 Converting YAML to JSON...\n');

  // Ensure output directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load concept library (null if not available)
  const library = loadConceptLibrary();
  if (library) {
    console.log(`  📚 Concept library loaded  (${library.size} concepts)\n`);
  }

  const tracks  = discoverTracks();
  let converted = 0;

  for (const { slug, yamlPath, format } of tracks) {
    const jsonPath = join(DATA_DIR, `${slug}.json`);

    if (!existsSync(yamlPath)) {
      console.log(`  ⚠️  Skipping ${slug}.yaml (not found)`);
      continue;
    }

    const yamlContent = readFileSync(yamlPath, 'utf-8');
    const data = YAML.parse(yamlContent);

    // Apply meta defaults
    const meta = {
      ...META_DEFAULTS,
      title: filenameToTitle(slug), // Default title from filename
      ...data.meta                   // Override with provided values
    };

    // Resolve concept refs in all topics (no-op for legacy inline concepts)
    const sections = (data.sections ?? []).map(section => ({
      ...section,
      items: (section.items ?? []).map(item => ({
        ...item,
        concepts: resolveConceptRefs(
          item.concepts,
          library,
          `${slug}/${item.id}`
        ),
      })),
    }));

    // Output structure — identical shape to previous output
    const output = { meta, sections };

    writeFileSync(jsonPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ ${slug}.yaml → ${slug}.json  [${format}]`);
    converted++;
  }

  console.log(`\n✨ Converted ${converted} file(s)`);
}

buildData();
