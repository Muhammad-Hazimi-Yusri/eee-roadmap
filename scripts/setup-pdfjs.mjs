import { existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const PDFJS_VERSION = '5.4.449';
const PDFJS_DIR = 'public/pdfjs';
const TEMP_ZIP = join(tmpdir(), 'pdfjs.zip');
const isWindows = process.platform === 'win32';

if (existsSync(PDFJS_DIR)) {
  console.log('PDF.js already installed, skipping...');
  process.exit(0);
}

console.log(`Downloading PDF.js v${PDFJS_VERSION}...`);

await mkdir('public', { recursive: true });

// Download
execSync(`curl -fL https://github.com/mozilla/pdf.js/releases/download/v${PDFJS_VERSION}/pdfjs-${PDFJS_VERSION}-dist.zip -o "${TEMP_ZIP}"`, { stdio: 'inherit' });

if (!existsSync(TEMP_ZIP)) {
  console.error(`Download failed: ${TEMP_ZIP} does not exist`);
  process.exit(1);
}

// Extract - Windows tar supports zip, Linux/macOS use unzip
await mkdir(PDFJS_DIR, { recursive: true });
if (isWindows) {
  execSync(`tar -xf "${TEMP_ZIP}" -C "${PDFJS_DIR}"`, { stdio: 'inherit' });
} else {
  execSync(`unzip -q "${TEMP_ZIP}" -d "${PDFJS_DIR}"`, { stdio: 'inherit' });
}

// Cleanup
await rm(TEMP_ZIP);

console.log('PDF.js installed successfully!');