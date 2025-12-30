/**
 * Downloads external PDFs at build time to avoid CORS issues.
 * Run via: npm run download:pdfs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PDF_DIR = join(ROOT, 'public/pdfs');
const PUBLIC_MANIFEST_PATH = join(ROOT, 'public/pdf-manifest.json');

// Find all data files with concepts
const DATA_FILES = [
  'src/data/fundamentals.ts',
  'src/data/core.ts', 
  'src/data/advanced.ts',
];

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
  
  // Match pdf: "https://..." or pdf: 'https://...'
  const pdfPropRegex = /pdf:\s*['"]((https?:\/\/[^'"]+\.pdf)[^'"]*)['"]?/gi;
  let match;
  while ((match = pdfPropRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  // Match markdown images: ![...](https://...pdf)
  const markdownRegex = /!\[[^\]]*\]\((https?:\/\/[^)]+\.pdf)\)/gi;
  while ((match = markdownRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
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
    const filepath = join(ROOT, file);
    if (!existsSync(filepath)) {
      console.log(`⚠️  Skipping missing file: ${file}`);
      continue;
    }
    const content = readFileSync(filepath, 'utf-8');
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