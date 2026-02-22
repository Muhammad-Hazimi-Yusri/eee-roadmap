/**
 * Validates YAML roadmap files against the JSON schema.
 * Also validates concept domain files and track ref integrity when present.
 * Run via: npm run validate
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const __dirname    = dirname(fileURLToPath(import.meta.url));
const ROOT         = join(__dirname, '..');
const CONTENT_DIR  = join(ROOT, 'content');
const TRACKS_DIR   = join(CONTENT_DIR, 'tracks');
const CONCEPTS_DIR = join(CONTENT_DIR, 'concepts');
const SCHEMA_PATH  = join(ROOT, 'roadmap.schema.json');

// Files to skip (templates, examples)
const EXCLUDE = new Set(['sample', '_glossary']);

// Find YAML files in content/ (legacy format — still validated)
const legacyFiles = readdirSync(CONTENT_DIR)
  .filter(f => f.endsWith('.yaml'))
  .map(f => f.replace('.yaml', ''))
  .filter(f => !EXCLUDE.has(f));

// ─── Inline concept domain schema ────────────────────────────────────────────
// Canonical schema lives at content/concepts/concept.schema.json (for editors)

const CONCEPT_DOMAIN_SCHEMA = {
  type: 'object',
  required: ['concepts'],
  properties: {
    _meta: {
      type: 'object',
      properties: {
        domain:      { type: 'string' },
        description: { type: 'string' },
      },
    },
    concepts: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['name'],
        properties: {
          name:          { type: 'string', minLength: 1 },
          notes:         { type: 'string' },
          tags:          { type: 'array', items: { type: 'string' } },
          prerequisites: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkDuplicateTopicIds(files, sourceDir) {
  console.log('\n🔍 Checking for duplicate topic IDs across tracks...\n');

  const topicIdMap = new Map(); // topicId → [trackNames]

  for (const name of files) {
    const yamlPath = join(sourceDir, `${name}.yaml`);

    try {
      const data = YAML.parse(readFileSync(yamlPath, 'utf-8'));

      for (const section of data.sections || []) {
        for (const item of section.items || []) {
          if (!item.id) continue;
          if (!topicIdMap.has(item.id)) topicIdMap.set(item.id, []);
          topicIdMap.get(item.id).push(name);
        }
      }
    } catch {
      // Parse errors already reported in schema validation
    }
  }

  const duplicates = [...topicIdMap.entries()].filter(([, tracks]) => tracks.length > 1);

  if (duplicates.length > 0) {
    console.log('  ❌ Duplicate topic IDs found:\n');
    for (const [topicId, tracks] of duplicates) {
      console.log(`     "${topicId}" appears in: ${tracks.join(', ')}`);
    }
    console.log('');
    return false;
  }

  console.log(`  ✅ All ${topicIdMap.size} topic IDs are unique\n`);
  return true;
}

// ─── Validate legacy content/*.yaml ──────────────────────────────────────────

function validate() {
  console.log('🔍 Validating YAML files against schema...\n');

  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv    = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  let hasErrors = false;

  for (const name of legacyFiles) {
    const yamlPath = join(CONTENT_DIR, `${name}.yaml`);

    try {
      const data  = YAML.parse(readFileSync(yamlPath, 'utf-8'));
      const valid = validateSchema(data);

      if (valid) {
        console.log(`  ✅ ${name}.yaml`);
      } else {
        hasErrors = true;
        console.log(`  ❌ ${name}.yaml`);
        for (const err of validateSchema.errors || []) {
          console.log(`     - ${err.instancePath || '/'}: ${err.message}`);
        }
      }
    } catch (err) {
      hasErrors = true;
      console.log(`  ❌ ${name}.yaml`);
      console.log(`     - Parse error: ${err.message}`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.log('❌ Validation failed');
    process.exit(1);
  }

  console.log(`✅ All ${legacyFiles.length} file(s) valid`);

  const noDuplicates = checkDuplicateTopicIds(legacyFiles, CONTENT_DIR);

  if (!noDuplicates) {
    console.log('❌ Duplicate check failed');
    process.exit(1);
  }
}

// ─── Validate concept domain files ───────────────────────────────────────────

function validateConceptLibrary() {
  if (!existsSync(CONCEPTS_DIR)) return true;

  const SKIP_CONCEPTS = new Set(['sample.yaml']);
  const domainFiles = readdirSync(CONCEPTS_DIR)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_') && !SKIP_CONCEPTS.has(f));

  if (domainFiles.length === 0) return true;

  console.log('\n🔍 Validating concept domain files...\n');

  const ajv = new Ajv({ allErrors: true });
  const validateConcept = ajv.compile(CONCEPT_DOMAIN_SCHEMA);

  let hasErrors = false;
  const allIds  = new Map(); // conceptId → filename (for duplicate check)

  for (const filename of domainFiles.sort()) {
    const filePath = join(CONCEPTS_DIR, filename);

    try {
      const data  = YAML.parse(readFileSync(filePath, 'utf-8'));
      const valid = validateConcept(data);

      if (!valid) {
        hasErrors = true;
        console.log(`  ❌ concepts/${filename}`);
        for (const err of validateConcept.errors || []) {
          console.log(`     - ${err.instancePath || '/'}: ${err.message}`);
        }
        continue;
      }

      // Check for duplicate concept IDs across files
      let fileDupe = false;
      for (const id of Object.keys(data.concepts ?? {})) {
        if (allIds.has(id)) {
          if (!fileDupe) {
            hasErrors = true;
            console.log(`  ❌ concepts/${filename}`);
            fileDupe = true;
          }
          console.log(`     - Duplicate concept ID "${id}" (also in ${allIds.get(id)})`);
        } else {
          allIds.set(id, filename);
        }
      }

      if (!fileDupe) {
        const count = Object.keys(data.concepts ?? {}).length;
        console.log(`  ✅ concepts/${filename}  (${count} concepts)`);
      }
    } catch (err) {
      hasErrors = true;
      console.log(`  ❌ concepts/${filename}`);
      console.log(`     - Parse error: ${err.message}`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Concept library validation failed');
    return false;
  }

  console.log(`\n  ✅ ${allIds.size} concept IDs unique across ${domainFiles.length} domain files`);
  return true;
}

// ─── Validate track ref integrity ────────────────────────────────────────────

function validateTrackRefs() {
  if (!existsSync(TRACKS_DIR)) return true;

  const trackFiles = readdirSync(TRACKS_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''))
    .filter(f => !EXCLUDE.has(f));

  if (trackFiles.length === 0) return true;

  // Build concept ID set from library
  if (!existsSync(CONCEPTS_DIR)) {
    console.log('\n⚠️  content/tracks/ found but content/concepts/ missing — skipping ref check');
    return true;
  }

  const knownIds = new Set();
  for (const filename of readdirSync(CONCEPTS_DIR).filter(f => f.endsWith('.yaml') && !f.startsWith('_'))) {
    const data = YAML.parse(readFileSync(join(CONCEPTS_DIR, filename), 'utf-8'));
    for (const id of Object.keys(data.concepts ?? {})) knownIds.add(id);
  }

  console.log('\n🔍 Validating track ref integrity...\n');

  let hasErrors = false;

  for (const slug of trackFiles.sort()) {
    const filePath = join(TRACKS_DIR, `${slug}.yaml`);
    const badRefs  = [];

    try {
      const data = YAML.parse(readFileSync(filePath, 'utf-8'));

      for (const section of (data.sections ?? [])) {
        for (const item of (section.items ?? [])) {
          for (const concept of (item.concepts ?? [])) {
            if (concept.ref !== undefined && !knownIds.has(concept.ref)) {
              badRefs.push(`${item.id}: ref "${concept.ref}" not found in library`);
            }
          }
        }
      }
    } catch (err) {
      hasErrors = true;
      console.log(`  ❌ tracks/${slug}.yaml — Parse error: ${err.message}`);
      continue;
    }

    if (badRefs.length > 0) {
      hasErrors = true;
      console.log(`  ❌ tracks/${slug}.yaml`);
      for (const msg of badRefs) console.log(`     - ${msg}`);
    } else {
      console.log(`  ✅ tracks/${slug}.yaml`);
    }
  }

  // Also check duplicate topic IDs in track files
  const noDuplicates = checkDuplicateTopicIds(trackFiles, TRACKS_DIR);
  if (!noDuplicates) hasErrors = true;

  if (hasErrors) {
    console.log('\n❌ Track ref validation failed');
    return false;
  }

  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

validate();

const conceptsOk = validateConceptLibrary();
const refsOk     = validateTrackRefs();

if (!conceptsOk || !refsOk) {
  process.exit(1);
}

console.log('\n✨ All validations passed');
