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
const EXCLUDE = ['sample', '_glossary'];

// Find YAML files (shared between functions)
const files = readdirSync(CONTENT_DIR)
  .filter(f => f.endsWith('.yaml'))
  .map(f => f.replace('.yaml', ''))
  .filter(f => !EXCLUDE.includes(f));

function checkDuplicateTopicIds() {
  console.log('\n🔍 Checking for duplicate topic IDs across tracks...\n');
  
  const topicIdMap = new Map(); // topicId -> [trackNames]
  
  for (const name of files) {
    const yamlPath = join(CONTENT_DIR, `${name}.yaml`);
    
    try {
      const yamlContent = readFileSync(yamlPath, 'utf-8');
      const data = YAML.parse(yamlContent);
      
      for (const section of data.sections || []) {
        for (const item of section.items || []) {
          const topicId = item.id;
          if (!topicId) continue;
          
          if (!topicIdMap.has(topicId)) {
            topicIdMap.set(topicId, []);
          }
          topicIdMap.get(topicId).push(name);
        }
      }
    } catch {
      // Parse errors already reported in schema validation
    }
  }
  
  // Find duplicates
  const duplicates = [...topicIdMap.entries()]
    .filter(([_, tracks]) => tracks.length > 1);
  
  if (duplicates.length > 0) {
    console.log('  ❌ Duplicate topic IDs found:\n');
    for (const [topicId, tracks] of duplicates) {
      console.log(`     "${topicId}" appears in: ${tracks.join(', ')}`);
    }
    console.log('');
    return false;
  }
  
  const totalTopics = [...topicIdMap.keys()].length;
  console.log(`  ✅ All ${totalTopics} topic IDs are unique\n`);
  return true;
}

function validate() {
  console.log('🔍 Validating YAML files against schema...\n');

  // Load schema
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  
  // Setup validator
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

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
  }
  
  console.log(`✅ All ${files.length} file(s) valid`);
  
  // Check for duplicate topic IDs
  const noDuplicates = checkDuplicateTopicIds();
  
  if (!noDuplicates) {
    console.log('❌ Duplicate check failed');
    process.exit(1);
  }
  
  console.log('✨ All validations passed');
}

validate();