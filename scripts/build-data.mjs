/**
 * Converts YAML roadmap files to JSON for the app to consume.
 * Run via: npm run build:data
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const DATA_DIR = join(ROOT, 'src/data');

// Files to exclude from conversion (templates, examples)
const EXCLUDE = ['sample'];

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

// Dynamically find all YAML files
const FILES = readdirSync(CONTENT_DIR)
  .filter(f => f.endsWith('.yaml'))
  .map(f => f.replace('.yaml', ''))
  .filter(f => !EXCLUDE.includes(f));

function buildData() {
  console.log('🔄 Converting YAML to JSON...\n');

  // Ensure output directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  let converted = 0;

  for (const name of FILES) {
    const yamlPath = join(CONTENT_DIR, `${name}.yaml`);
    const jsonPath = join(DATA_DIR, `${name}.json`);

    if (!existsSync(yamlPath)) {
      console.log(`  ⚠️  Skipping ${name}.yaml (not found)`);
      continue;
    }

    const yamlContent = readFileSync(yamlPath, 'utf-8');
    const data = YAML.parse(yamlContent);
    
    // Apply meta defaults
    const meta = {
      ...META_DEFAULTS,
      title: filenameToTitle(name), // Default title from filename
      ...data.meta                   // Override with provided values
    };
    
    // Output structure with meta and sections
    const output = {
      meta,
      sections: data.sections || []
    };
    
    writeFileSync(jsonPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ ${name}.yaml → ${name}.json`);
    converted++;
  }

  console.log(`\n✨ Converted ${converted} file(s)`);
}

buildData();