import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { execSync } from 'child_process';

const PDFJS_VERSION = '5.4.449';
const PDFJS_DIR = 'public/pdfjs';

if (existsSync(PDFJS_DIR)) {
  console.log('PDF.js already installed, skipping...');
  process.exit(0);
}

console.log(`Downloading PDF.js v${PDFJS_VERSION}...`);

await mkdir('public', { recursive: true });

execSync(`curl -fL https://github.com/mozilla/pdf.js/releases/download/v${PDFJS_VERSION}/pdfjs-${PDFJS_VERSION}-dist.zip -o /tmp/pdfjs.zip`, { stdio: 'inherit' });

if (!existsSync('/tmp/pdfjs.zip')) {
  console.error('Download failed: /tmp/pdfjs.zip does not exist');
  process.exit(1);
}

execSync(`unzip -q /tmp/pdfjs.zip -d ${PDFJS_DIR}`, { stdio: 'inherit' });
execSync(`rm /tmp/pdfjs.zip`, { stdio: 'inherit' });

console.log('PDF.js installed successfully!');