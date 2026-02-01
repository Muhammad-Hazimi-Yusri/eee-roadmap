/**
 * Builds glossary JSON from YAML and generates reverse index.
 * Run via: npm run build:glossary
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const DATA_DIR = join(ROOT, 'src/data');
const GLOSSARY_PATH = join(CONTENT_DIR, '_glossary.yaml');
const OUTPUT_PATH = join(DATA_DIR, '_glossary.json');

/**
 * Slugify a term for use as ID
 * e.g., "Ohm's Law" → "ohms-law"
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')      // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '');      // Trim leading/trailing hyphens
}

/**
 * Build a lookup map from all terms and acronyms (lowercase) to term ID
 */
function buildLookupMap(terms) {
  const lookup = {};
  
  for (const entry of terms) {
    const id = entry.id;
    
    // Add main term (lowercase)
    lookup[entry.term.toLowerCase()] = id;
    
    // Add all acronyms (lowercase)
    for (const acronym of entry.acronyms || []) {
      lookup[acronym.toLowerCase()] = id;
    }
  }
  
  return lookup;
}

/**
 * Scan text for glossary term matches
 * Returns array of matched term IDs
 */
function findTermsInText(text, lookup) {
  if (!text) return [];
  
  const found = new Set();
  const lowerText = text.toLowerCase();
  
  for (const [key, id] of Object.entries(lookup)) {
    // Word boundary check to avoid partial matches
    // e.g., "AM" shouldn't match "program"
    const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'i');
    if (regex.test(lowerText)) {
      found.add(id);
    }
  }
  
  return Array.from(found);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scan all roadmap content and build reverse index
 */
function buildReverseIndex(terms, lookup) {
  // Initialize appears_in for each term
  const appearsIn = {};
  for (const entry of terms) {
    appearsIn[entry.id] = [];
  }
  
  // Find all roadmap JSON files
  const jsonFiles = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !['sample.json', '_glossary.json', 'pdf-manifest.json', 'search-index.json', 'graph-data.json'].includes(f));
  
  for (const file of jsonFiles) {
    const trackSlug = file.replace('.json', '');
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
    const trackTitle = data.meta?.title || trackSlug;
    
    for (const section of data.sections || []) {
      for (const topic of section.items || []) {
        // Collect all text to scan for this topic
        const textsToScan = [
          topic.description,
          ...(topic.outcomes || []),
          ...(topic.concepts || []).map(c => c.name),
          ...(topic.concepts || []).map(c => c.notes || '')
        ];
        
        const allText = textsToScan.join(' ');
        const foundTermIds = findTermsInText(allText, lookup);
        
        // Add to reverse index
        for (const termId of foundTermIds) {
          // Avoid duplicates for same topic
          const existing = appearsIn[termId];
          if (!existing.some(e => e.track === trackSlug && e.topicId === topic.id)) {
            existing.push({
              track: trackSlug,
              trackTitle,
              topicId: topic.id,
              topicTitle: topic.title,
              sectionId: section.id,
              sectionTitle: section.title
            });
          }
        }
      }
    }
  }
  
  return appearsIn;
}

function buildGlossary() {
  console.log('📖 Building glossary...\n');
  
  // Check if glossary file exists
  if (!existsSync(GLOSSARY_PATH)) {
    console.log('  ⚠️  No _glossary.yaml found, skipping');
    return;
  }
  
  // Parse YAML
  const yamlContent = readFileSync(GLOSSARY_PATH, 'utf-8');
  const data = YAML.parse(yamlContent);
  
  if (!data.terms || !Array.isArray(data.terms)) {
    console.log('  ❌ Invalid glossary format: missing "terms" array');
    process.exit(1);
  }
  
  // Process terms
  const terms = data.terms.map(entry => ({
    id: slugify(entry.term),
    term: entry.term,
    acronyms: entry.acronyms || [],
    categories: entry.categories || ['general'],
    definition: entry.definition || '',
    see_also: entry.see_also || []
  }));
  
  console.log(`  📝 Loaded ${terms.length} terms`);
  
  // Build lookup map
  const lookup = buildLookupMap(terms);
  console.log(`  🔑 Generated ${Object.keys(lookup).length} lookup keys`);
  
  // Build reverse index (scan roadmap content)
  const appearsIn = buildReverseIndex(terms, lookup);
  
  // Attach appears_in to each term
  for (const entry of terms) {
    entry.appears_in = appearsIn[entry.id] || [];
  }
  
  // Count appearances
  const totalAppearances = terms.reduce((sum, t) => sum + t.appears_in.length, 0);
  console.log(`  📍 Found ${totalAppearances} term appearances across roadmaps`);
  
  // Output structure
  const output = {
    terms,
    lookup
  };
  
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n  ✅ Written to ${OUTPUT_PATH}`);
  console.log(`\n✨ Glossary built successfully\n`);
}

buildGlossary();