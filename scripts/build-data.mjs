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

// Dynamically find all YAML files
const FILES = readdirSync(CONTENT_DIR)
  .filter(f => f.endsWith('.yaml'))
  .map(f => f.replace('.yaml', ''));
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
    
    writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`  ✅ ${name}.yaml → ${name}.json`);
    converted++;
  }

  console.log(`\n✨ Converted ${converted} file(s)`);
}

buildData();