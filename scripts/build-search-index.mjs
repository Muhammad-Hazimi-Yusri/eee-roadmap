/**
 * Generates search index from roadmap JSON files.
 * Run via: npm run build:search
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = join(DATA_DIR, 'search-index.json');

// Files to exclude
const EXCLUDE = ['sample.json', 'pdf-manifest.json', 'search-index.json'];

function buildSearchIndex() {
  console.log('🔍 Building search index...\n');

  const index = [];

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

        // Add concepts
        for (const concept of item.concepts || []) {
          index.push({
            type: 'concept',
            name: concept.name,
            topic: item.title,
            track: meta.title,
            trackSlug: slug,
            path: `/roadmaps/${slug}/#${item.id}`,
            content: concept.notes || ''
          });
        }
      }
    }
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`  ✅ Generated ${index.length} entries`);
  console.log(`     - Tracks: ${index.filter(i => i.type === 'track').length}`);
  console.log(`     - Topics: ${index.filter(i => i.type === 'topic').length}`);
  console.log(`     - Concepts: ${index.filter(i => i.type === 'concept').length}`);
  console.log(`\n  → ${OUTPUT_FILE}\n`);
}

buildSearchIndex();