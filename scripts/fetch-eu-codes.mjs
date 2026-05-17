/**
 * fetch-eu-codes.mjs
 *
 * Downloads the EU Network Code PDFs (hostable under Decision 2011/833/EU) into
 * public/eu-codes/. Reads URLs from content/standards/_catalogue.yaml entries
 * where `license: hostable-eu` and `pdfUrl` is non-empty.
 *
 * Outputs:
 *   public/eu-codes/<docId>.pdf         — the downloaded PDFs
 *   public/eu-codes/manifest.json       — { docId: { url, sha256, sizeBytes, fetchedAt } }
 *   public/eu-codes/LICENSE.md          — re-use attribution
 *
 * Skips files that already exist with a matching SHA-256.
 *
 * Run via: node scripts/fetch-eu-codes.mjs
 * Called automatically as part of: npm run download:pdfs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT          = join(__dirname, '..');
const CATALOGUE     = join(ROOT, 'content', 'standards', '_catalogue.yaml');
const OUT_DIR       = join(ROOT, 'public', 'eu-codes');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');
const LICENSE_PATH  = join(OUT_DIR, 'LICENSE.md');

const LICENSE_BODY = `# EU Network Code PDFs — Re-use Notice

This directory hosts copies of EU Network Code regulations sourced from EUR-Lex.

Files here are © European Union, 1998-${new Date().getFullYear()}, re-used under
**Commission Decision 2011/833/EU on the re-use of Commission documents**.

UK retained EU law versions sourced from legislation.gov.uk are licensed under
the **Open Government Licence v3.0** (Contains public sector information
licensed under the Open Government Licence v3.0).

The European Union and UK Government are not responsible for the accuracy of
this copy. For the authoritative text, see the source URLs in
\`content/standards/_catalogue.yaml\`.

Last updated: ${new Date().toISOString()}
`;

async function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function downloadOne(doc, manifest) {
  const url = doc.pdfUrl;
  if (!url) {
    console.log(`  ⏭️  ${doc.id} has no pdfUrl — skipping`);
    return { downloaded: false, skipped: true };
  }

  const localName = `${doc.id}.pdf`;
  const localPath = join(OUT_DIR, localName);
  const cached    = manifest[doc.id];

  if (cached && existsSync(localPath)) {
    const buf  = readFileSync(localPath);
    const hash = await sha256(buf);
    if (hash === cached.sha256 && cached.url === url) {
      console.log(`  ⏭️  ${doc.id} cached (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
      return { downloaded: false, skipped: true };
    }
  }

  console.log(`  ⬇️  ${doc.id}: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/pdf',
        'User-Agent': 'eee-roadmap-grid-code-viewer/1.0 (+https://eee-roadmap.muhammadhazimiyusri.uk)',
      },
    });
    if (!response.ok) {
      console.error(`  ❌ ${doc.id}: HTTP ${response.status}`);
      return { downloaded: false, skipped: false, failed: true };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const hash   = await sha256(buffer);
    writeFileSync(localPath, buffer);
    manifest[doc.id] = {
      url,
      sha256:    hash,
      sizeBytes: buffer.length,
      fetchedAt: new Date().toISOString(),
    };
    console.log(`  ✅ ${doc.id} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
    return { downloaded: true, skipped: false };
  } catch (err) {
    console.error(`  ❌ ${doc.id}: ${err.message}`);
    return { downloaded: false, skipped: false, failed: true };
  }
}

async function main() {
  if (!existsSync(CATALOGUE)) {
    console.log('⚠️  content/standards/_catalogue.yaml not found — skipping EU codes fetch');
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  console.log('📄 Fetching EU Network Code PDFs (hostable)\n');

  const catalogue = YAML.parse(readFileSync(CATALOGUE, 'utf-8'));
  const targets   = (catalogue?.documents ?? []).filter(
    d => d.license === 'hostable-eu' && d.pdfUrl,
  );

  if (targets.length === 0) {
    console.log('  ⚠️  No hostable-eu entries with pdfUrl in catalogue\n');
    writeFileSync(LICENSE_PATH, LICENSE_BODY);
    return;
  }

  let manifest = {};
  if (existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
      manifest = {};
    }
  }

  let downloaded = 0;
  let skipped    = 0;
  let failed     = 0;

  for (const doc of targets) {
    const r = await downloadOne(doc, manifest);
    if (r.downloaded) downloaded++;
    else if (r.failed) failed++;
    else if (r.skipped) skipped++;
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  writeFileSync(LICENSE_PATH, LICENSE_BODY, 'utf-8');

  console.log(`\n  ✅ done. Downloaded: ${downloaded}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`  📁 ${OUT_DIR}/\n`);

  if (failed > 0) {
    console.log('⚠️  Some downloads failed. Re-run when network is available.');
  }
}

main().catch(err => {
  console.error('❌ fetch-eu-codes failed:', err);
  process.exitCode = 1;
});
