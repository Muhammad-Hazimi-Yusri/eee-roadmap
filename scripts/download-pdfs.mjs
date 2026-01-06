/**
 * Downloads external PDFs at build time to avoid CORS issues.
 * Run via: npm run download:pdfs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src/data');
const PDF_DIR = join(ROOT, 'public/pdfs');
const PUBLIC_MANIFEST_PATH = join(ROOT, 'public/pdf-manifest.json');

// Dynamically find all JSON files except sample.json
const DATA_FILES = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && f !== 'sample.json')
  .map(f => join(DATA_DIR, f));

async function downloadPdf(url, filename) {
  console.log(`  Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filepath = join(PDF_DIR, filename);
  writeFileSync(filepath, buffer);
  console.log(`  Saved: ${filename}`);
  return buffer.length;
}

function extractPdfUrls(content) {
  const urls = [];
  
  // Match URLs ending in .pdf (works for both JSON strings and markdown)
  const pdfUrlRegex = /https?:\/\/[^\s"')\]]+\.pdf/gi;
  let match;
  while ((match = pdfUrlRegex.exec(content)) !== null) {
    urls.push(match[0]);
  }
  
  return [...new Set(urls)]; // dedupe
}

function urlToFilename(url) {
  const hash = createHash('md5').update(url).digest('hex').slice(0, 8);
  const urlPath = new URL(url).pathname;
  const originalName = urlPath.split('/').pop().replace('.pdf', '');
  // Sanitize filename
  const safeName = originalName.replace(/[^a-z0-9-_]/gi, '-').slice(0, 40);
  return `${safeName}-${hash}.pdf`;
}

async function main() {
  console.log('📄 PDF Download Script\n');

  // Ensure directories exist
  mkdirSync(PDF_DIR, { recursive: true });
  mkdirSync(dirname(PUBLIC_MANIFEST_PATH), { recursive: true });

  // Load existing manifest or start fresh
  let manifest = {};
  if (existsSync(PUBLIC_MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(PUBLIC_MANIFEST_PATH, 'utf-8'));
  }

  // Collect all external PDF URLs from data files
  const allUrls = new Set();
  
  for (const file of DATA_FILES) {
    if (!existsSync(file)) {
      console.log(`⚠️  Skipping missing file: ${file}`);
      continue;
    }
    const content = readFileSync(file, 'utf-8');
    const urls = extractPdfUrls(content);
    urls.forEach(url => allUrls.add(url));
  }

  console.log(`Found ${allUrls.size} external PDF(s)\n`);

  // Download each PDF
  let downloaded = 0;
  let skipped = 0;

  for (const url of allUrls) {
    const filename = urlToFilename(url);
    const localPath = `/pdfs/${filename}`;

    // Skip if already downloaded
    if (manifest[url] && existsSync(join(PDF_DIR, filename))) {
      console.log(`⏭️  Already exists: ${filename}`);
      skipped++;
      continue;
    }

    try {
      await downloadPdf(url, filename);
      manifest[url] = localPath;
      downloaded++;
    } catch (err) {
      console.error(`❌ Failed: ${url}\n   ${err.message}`);
    }
  }

  // Save to public manifest for client-side access
  writeFileSync(PUBLIC_MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Done! Downloaded: ${downloaded}, Skipped: ${skipped}`);
  console.log(`📁 Manifest saved to: src/data/pdf-manifest.json`);
}

main().catch(console.error);