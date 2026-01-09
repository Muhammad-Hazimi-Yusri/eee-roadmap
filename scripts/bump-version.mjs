#!/usr/bin/env node
/**
 * Bumps version in package.json and README.md
 * Usage: npm run version:bump
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PKG_PATH = join(ROOT, 'package.json');
const README_PATH = join(ROOT, 'README.md');

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));
const currentVersion = pkg.version;

const [major, minor, patch] = currentVersion.split('.').map(Number);

const suggestions = {
  patch: `${major}.${minor}.${patch + 1}`,
  minor: `${major}.${minor + 1}.0`,
  major: `${major + 1}.0.0`
};

console.log(`\n📦 Current version: ${currentVersion}\n`);
console.log('Suggestions:');
console.log(`  patch → ${suggestions.patch}`);
console.log(`  minor → ${suggestions.minor}`);
console.log(`  major → ${suggestions.major}\n`);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter new version (or patch/minor/major): ', (answer) => {
  const newVersion = suggestions[answer] || answer;
  
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.log('❌ Invalid version format. Use x.y.z');
    rl.close();
    process.exit(1);
  }
  
  if (newVersion === currentVersion) {
    console.log('❌ Version unchanged.');
    rl.close();
    process.exit(1);
  }
  
  // Update package.json
  pkg.version = newVersion;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ package.json → ${newVersion}`);
  
  // Update README.md
  let readme = readFileSync(README_PATH, 'utf-8');

  // Update features heading
  readme = readme.replace(
    /## Current Features \(v[\d.]+\)/,
    `## Current Features (v${newVersion})`
  );

  // Update version badge
  readme = readme.replace(
    /version-[\d.]+-blue/,
    `version-${newVersion}-blue`
  );

  writeFileSync(README_PATH, readme);
  console.log(`✅ README.md → v${newVersion} (features heading + badge)`);
  
  console.log(`\n✨ Version bumped to ${newVersion}`);
  console.log('   Run: git add package.json README.md\n');
  
  rl.close();
});