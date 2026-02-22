/**
 * Generates search index from roadmap JSON files and glossary.
 * Run via: npm run build:search
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE       = join(DATA_DIR, 'search-index.json');
const GLOSSARY_FILE     = join(DATA_DIR, '_glossary.json');
const CONCEPT_LIB_FILE  = join(DATA_DIR, 'concept-library.json');

// Files to exclude from roadmap track indexing (handled separately below)
const EXCLUDE = ['sample.json', 'pdf-manifest.json', 'search-index.json', '_glossary.json', 'graph-data.json', 'concept-library.json'];

function buildSearchIndex() {
  console.log('🔍 Building search index...\n');

  const index = [];

  // ─────────────────────────────────────────────────────────────
  // 1. Index glossary terms (first, so they appear at top)
  // ─────────────────────────────────────────────────────────────
  if (existsSync(GLOSSARY_FILE)) {
    const glossary = JSON.parse(readFileSync(GLOSSARY_FILE, 'utf-8'));

    for (const entry of glossary.terms || []) {
      index.push({
        type: 'glossary',
        id: entry.id,
        name: entry.term,
        acronyms: entry.acronyms || [],
        definition: entry.definition || '',
        categories: entry.categories || [],
        see_also: entry.see_also || [],
        appears_in: entry.appears_in || []
      });
    }

    console.log(`  📖 Indexed ${glossary.terms?.length || 0} glossary terms`);
  } else {
    console.log('  ⚠️  No glossary found, skipping');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Index concept library (domain-grouped, first-class entries)
  //    These are canonical entries independent of track context.
  // ─────────────────────────────────────────────────────────────
  let libraryConceptCount = 0;
  if (existsSync(CONCEPT_LIB_FILE)) {
    const library = JSON.parse(readFileSync(CONCEPT_LIB_FILE, 'utf-8'));
    libraryConceptCount = library.length;

    for (const concept of library) {
      index.push({
        type: 'concept',
        id: concept.id,
        name: concept.name,
        domain: concept.domain,
        tags: concept.tags ?? [],
        content: concept.notes ?? '',
      });
    }

    console.log(`  📚 Indexed ${library.length} concept library entries`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Index roadmap content (tracks, topics, per-track concepts)
  // ─────────────────────────────────────────────────────────────
  const files = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !EXCLUDE.includes(f));

  for (const file of files) {
    const slug = file.replace('.json', '');
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
    const meta = data.meta;

    // Add track
    index.push({
      type: 'track',
      name: meta.title,
      description: meta.description,
      slug,
      path: `/roadmaps/${slug}/`
    });

    // Add topics and concepts
    for (const section of data.sections || []) {
      for (const item of section.items || []) {
        // Add topic
        index.push({
          type: 'topic',
          name: item.title,
          description: item.description || '',
          track: meta.title,
          trackSlug: slug,
          path: `/roadmaps/${slug}/#${item.id}`
        });

        // Add per-track concept entries (with navigation context)
        for (const concept of item.concepts || []) {
          index.push({
            type: 'concept',
            name: concept.name,
            topic: item.title,
            topicId: item.id,
            track: meta.title,
            trackSlug: slug,
            path: `/roadmaps/${slug}/?concept=${encodeURIComponent(concept.name)}#${item.id}`,
            content: concept.notes || ''
          });
        }
      }
    }
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));

  const glossaryCount       = index.filter(i => i.type === 'glossary').length;
  const trackCount          = index.filter(i => i.type === 'track').length;
  const topicCount          = index.filter(i => i.type === 'topic').length;
  const allConceptCount     = index.filter(i => i.type === 'concept').length;
  const perTrackConceptCount = allConceptCount - libraryConceptCount;

  console.log(`  ✅ Generated ${index.length} entries`);
  console.log(`     - Glossary: ${glossaryCount}`);
  console.log(`     - Library concepts: ${libraryConceptCount}`);
  console.log(`     - Tracks: ${trackCount}`);
  console.log(`     - Topics: ${topicCount}`);
  console.log(`     - Per-track concepts: ${perTrackConceptCount}`);
  console.log(`\n  → ${OUTPUT_FILE}\n`);
}

buildSearchIndex();