/**
 * Validates YAML roadmap files against the JSON schema.
 * Run via: npm run validate
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const SCHEMA_PATH = join(ROOT, 'roadmap.schema.json');

// Files to skip (templates, examples)
const EXCLUDE = ['sample'];

function validate() {
  console.log('🔍 Validating YAML files against schema...\n');

  // Load schema
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  
  // Setup validator
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  // Find YAML files
  const files = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''))
    .filter(f => !EXCLUDE.includes(f));

  let hasErrors = false;

  for (const name of files) {
    const yamlPath = join(CONTENT_DIR, `${name}.yaml`);
    
    try {
      const yamlContent = readFileSync(yamlPath, 'utf-8');
      const data = YAML.parse(yamlContent);
      
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
  } else {
    console.log(`✨ All ${files.length} file(s) valid`);
  }
}

validate();