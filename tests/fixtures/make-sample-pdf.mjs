// Generates tests/fixtures/grid-code-sample.pdf — a tiny but valid PDF used
// by the Grid Code Viewer upload e2e. Hand-rolled (no deps) so the fixture is
// reviewable and reproducible. Re-run with: node tests/fixtures/make-sample-pdf.mjs
//
// The headings use real grid-code clause IDs (from content/standards/_clauses.yaml)
// so the extractor's clausePages tier AND the outline heading tier both produce
// hits when this file is uploaded as the "grid-code" local copy.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'grid-code-sample.pdf');

// One array of text lines per page. ASCII only (keeps byte offsets == string
// indices, which the xref table below relies on).
const PAGES = [
  ['The Grid Code', 'Sample fixture for automated tests (not the real document).'],
  ['ECC.6.3.7 Frequency Response', 'The generator must provide frequency response as specified.'],
  ['ECC.6.3.15 Fault Ride Through', 'Generating units must remain connected during system faults.'],
  ['BC2.11 Operational Notification', 'Operational notification and metering requirements.'],
];

function escapePdfText(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// Each line gets its own baseline (distinct Td move) so PDF.js groups them as
// separate lines, matching how the heading regexes anchor.
function contentStream(lines) {
  let s = 'BT\n/F1 14 Tf\n72 720 Td\n';
  lines.forEach((line, i) => {
    if (i > 0) s += '0 -28 Td\n';
    s += `(${escapePdfText(line)}) Tj\n`;
  });
  return s + 'ET';
}

function buildPdf(pages) {
  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  const kids = [];
  pages.forEach((lines, p) => {
    const pageNum = 4 + p * 2;
    const contentNum = 5 + p * 2;
    kids.push(`${pageNum} 0 R`);
    objs[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNum} 0 R >>`;
    const cs = contentStream(lines);
    objs[contentNum] = `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`;
  });
  objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;

  const maxNum = objs.length - 1;
  let out = '%PDF-1.4\n';
  const offsets = [];
  for (let n = 1; n <= maxNum; n++) {
    offsets[n] = out.length;
    out += `${n} 0 obj\n${objs[n]}\nendobj\n`;
  }
  const xrefStart = out.length;
  const count = maxNum + 1;
  out += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n <= maxNum; n++) {
    out += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return out;
}

writeFileSync(OUT, buildPdf(PAGES), 'latin1');
