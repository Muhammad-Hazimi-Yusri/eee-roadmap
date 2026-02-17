/**
 * Shared print mode utilities.
 * Used by both PrintRoadmap.astro (official tracks) and custom/print.astro (custom tracks).
 */
import { PDFDocument } from 'pdf-lib';

/**
 * Initialise cascading checkbox logic for the print sidebar tree.
 * Handles select-all, section → topic → concept cascading,
 * and shows/hides preview elements based on checked state.
 */
export function initPrintCheckboxes(): void {
  const selectAll = document.querySelector<HTMLInputElement>('[data-select-all]');
  const sectionChecks = document.querySelectorAll<HTMLInputElement>('[data-section-check]');
  const topicChecks = document.querySelectorAll<HTMLInputElement>('[data-topic-check]');
  const conceptChecks = document.querySelectorAll<HTMLInputElement>('[data-concept-check]');
  const printBtn = document.getElementById('print-btn');
  const emptyMsg = document.getElementById('print-empty-msg');

  function updatePreview() {
    // Show/hide sections
    document.querySelectorAll<HTMLElement>('[data-print-section]').forEach(el => {
      const id = el.dataset.printSection!;
      const hasCheckedTopic = document.querySelector<HTMLInputElement>(
        `[data-topic-check][data-parent-section="${id}"]:checked`
      );
      const hasCheckedConcept = document.querySelector<HTMLInputElement>(
        `[data-concept-check][data-parent-section="${id}"]:checked`
      );
      el.hidden = !hasCheckedTopic && !hasCheckedConcept;
    });

    // Show/hide topics
    document.querySelectorAll<HTMLElement>('[data-print-topic]').forEach(el => {
      const id = el.dataset.printTopic!;
      const topicCheck = document.querySelector<HTMLInputElement>(`[data-topic-check="${id}"]`);
      const hasCheckedConcept = document.querySelector<HTMLInputElement>(
        `[data-concept-check][data-parent-topic="${id}"]:checked`
      );
      el.hidden = !topicCheck?.checked && !hasCheckedConcept;
    });

    // Show/hide concepts
    document.querySelectorAll<HTMLElement>('[data-print-concept]').forEach(el => {
      const key = el.dataset.printConcept!;
      const check = document.querySelector<HTMLInputElement>(`[data-concept-check="${CSS.escape(key)}"]`);
      el.hidden = !check?.checked;
    });

    // Empty message
    const anyChecked = document.querySelector<HTMLInputElement>(
      '[data-concept-check]:checked, [data-topic-check]:checked'
    );
    if (emptyMsg) emptyMsg.hidden = !!anyChecked;
  }

  function updateParentStates() {
    // Update topic checkboxes based on their concept children
    topicChecks.forEach(tc => {
      const topicId = tc.dataset.topicCheck!;
      const children = document.querySelectorAll<HTMLInputElement>(
        `[data-concept-check][data-parent-topic="${topicId}"]`
      );
      if (children.length === 0) return;
      const checkedCount = Array.from(children).filter(c => c.checked).length;
      tc.checked = checkedCount === children.length;
      tc.indeterminate = checkedCount > 0 && checkedCount < children.length;
    });

    // Update section checkboxes based on their topic children
    sectionChecks.forEach(sc => {
      const sectionId = sc.dataset.sectionCheck!;
      const children = document.querySelectorAll<HTMLInputElement>(
        `[data-topic-check][data-parent-section="${sectionId}"]`
      );
      if (children.length === 0) return;
      const allChecked = Array.from(children).every(c => c.checked && !c.indeterminate);
      const someChecked = Array.from(children).some(c => c.checked || c.indeterminate);
      sc.checked = allChecked;
      sc.indeterminate = someChecked && !allChecked;
    });

    // Update select-all
    if (selectAll) {
      const allChecked = Array.from(sectionChecks).every(c => c.checked && !c.indeterminate);
      const someChecked = Array.from(sectionChecks).some(c => c.checked || c.indeterminate);
      selectAll.checked = allChecked;
      selectAll.indeterminate = someChecked && !allChecked;
    }
  }

  // Select all
  selectAll?.addEventListener('change', () => {
    const checked = selectAll.checked;
    sectionChecks.forEach(c => { c.checked = checked; c.indeterminate = false; });
    topicChecks.forEach(c => { c.checked = checked; c.indeterminate = false; });
    conceptChecks.forEach(c => { c.checked = checked; });
    updatePreview();
  });

  // Section checkbox
  sectionChecks.forEach(sc => {
    sc.addEventListener('change', () => {
      const sectionId = sc.dataset.sectionCheck!;
      const checked = sc.checked;
      sc.indeterminate = false;
      document.querySelectorAll<HTMLInputElement>(
        `[data-topic-check][data-parent-section="${sectionId}"]`
      ).forEach(tc => { tc.checked = checked; tc.indeterminate = false; });
      document.querySelectorAll<HTMLInputElement>(
        `[data-concept-check][data-parent-section="${sectionId}"]`
      ).forEach(cc => { cc.checked = checked; });
      updateParentStates();
      updatePreview();
    });
  });

  // Topic checkbox
  topicChecks.forEach(tc => {
    tc.addEventListener('change', () => {
      const topicId = tc.dataset.topicCheck!;
      const checked = tc.checked;
      tc.indeterminate = false;
      document.querySelectorAll<HTMLInputElement>(
        `[data-concept-check][data-parent-topic="${topicId}"]`
      ).forEach(cc => { cc.checked = checked; });
      updateParentStates();
      updatePreview();
    });
  });

  // Concept checkbox
  conceptChecks.forEach(cc => {
    cc.addEventListener('change', () => {
      updateParentStates();
      updatePreview();
    });
  });

  // Print button
  printBtn?.addEventListener('click', () => window.print());
}

/**
 * Initialise field toggle checkboxes.
 * Each checkbox with [data-field-toggle="X"] controls visibility
 * of all elements with [data-print-field="X"].
 */
export function initFieldToggles(): void {
  document.querySelectorAll<HTMLInputElement>('[data-field-toggle]').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const field = toggle.dataset.fieldToggle!;
      document.querySelectorAll<HTMLElement>(`[data-print-field="${field}"]`).forEach(el => {
        el.hidden = !toggle.checked;
      });
    });
  });
}

/**
 * Initialise high-contrast (no gray) toggle.
 * Toggles the .print-high-contrast class on .print-page.
 */
export function initHighContrastToggle(): void {
  document.getElementById('high-contrast-toggle')?.addEventListener('change', (e) => {
    document.querySelector('.print-page')?.classList.toggle(
      'print-high-contrast', (e.target as HTMLInputElement).checked
    );
  });
}

/**
 * Initialise section page-break toggle.
 * Toggles the .print-section-breaks class on #print-content.
 */
export function initSectionBreaksToggle(): void {
  document.getElementById('section-breaks-toggle')?.addEventListener('change', (e) => {
    document.getElementById('print-content')?.classList.toggle(
      'print-section-breaks', (e.target as HTMLInputElement).checked
    );
  });
}

/* ========================================
   BOOKLET: A5 page style + pdf-lib converter
   ======================================== */

/** Inject a <style> element that overrides @page for A5 booklet printing. */
function injectBookletPageStyle(): void {
  if (document.getElementById('booklet-page-style')) return;
  const style = document.createElement('style');
  style.id = 'booklet-page-style';
  style.textContent = '@media print { @page { size: A5; margin: 10mm; } }';
  document.head.appendChild(style);
}

/** Remove the dynamic @page style for booklet. */
function removeBookletPageStyle(): void {
  document.getElementById('booklet-page-style')?.remove();
}

/**
 * Convert an A5-paged PDF into a booklet-imposed A4-landscape PDF.
 *
 * Imposition for N pages (padded to multiple of 4), 1-based:
 *   Sheet s (0-indexed):
 *     Front: left = page[N - 2s],     right = page[2s + 1]
 *     Back:  left = page[2s + 2],     right = page[N - 2s - 1]
 *
 * Duplex mode: front, back, front, back, ...  (print double-sided)
 * Single mode: all fronts, then all backs reversed (print, flip, print again)
 */
async function convertToBookletPdf(
  file: File,
  mode: 'duplex' | 'single'
): Promise<Uint8Array> {
  const srcBytes = await file.arrayBuffer();
  // ignoreEncryption: browser-generated PDFs may have minimal encryption markers
  const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const pageCount = srcDoc.getPageCount();

  if (pageCount === 0) throw new Error('PDF has no pages.');

  // Pad to multiple of 4
  const n = Math.ceil(pageCount / 4) * 4;

  // Copy pages into destination (copyPages is more reliable than embedPdf
  // for browser-generated PDFs that may use features embedPdf can't handle)
  const dstDoc = await PDFDocument.create();
  const allIndices = Array.from({ length: pageCount }, (_, i) => i);
  const copiedPages = await dstDoc.copyPages(srcDoc, allIndices);

  // Get source page dimensions from the first page
  const srcPage0 = copiedPages[0];
  const srcW = srcPage0.getWidth();
  const srcH = srcPage0.getHeight();

  // A4 landscape in points: 297mm × 210mm  (1mm ≈ 2.83465pt)
  const A4_W = 841.89;
  const A4_H = 595.28;
  const HALF_W = A4_W / 2;

  // Scale to fit each source page into half of A4 landscape
  const scaleX = HALF_W / srcW;
  const scaleY = A4_H / srcH;
  const scale = Math.min(scaleX, scaleY);
  const drawW = srcW * scale;
  const drawH = srcH * scale;

  // Now embed pages (needed for drawPage — copyPages gives full pages,
  // embedPdf gives embeddable references we can draw at arbitrary positions)
  const embedded = await dstDoc.embedPdf(srcDoc, allIndices);

  // Build sheet list
  const sheets: Array<{ front: [number, number]; back: [number, number] }> = [];
  for (let s = 0; s < n / 4; s++) {
    sheets.push({
      front: [n - 2 * s - 1, 2 * s],         // 0-based: left, right
      back: [2 * s + 1, n - 2 * s - 2],       // 0-based: left, right
    });
  }

  // Determine output order of sheet sides
  type SheetSide = [number, number];
  const sides: SheetSide[] = [];

  if (mode === 'duplex') {
    for (const sheet of sheets) {
      sides.push(sheet.front);
      sides.push(sheet.back);
    }
  } else {
    // Fronts first, then backs reversed
    for (const sheet of sheets) {
      sides.push(sheet.front);
    }
    for (let i = sheets.length - 1; i >= 0; i--) {
      sides.push(sheets[i].back);
    }
  }

  // Render each side as an A4 landscape page with 2 embedded A5 pages
  for (const [leftIdx, rightIdx] of sides) {
    const page = dstDoc.addPage([A4_W, A4_H]);

    // Draw left A5 page (centered in left half)
    if (leftIdx >= 0 && leftIdx < pageCount) {
      const x = (HALF_W - drawW) / 2;
      const y = (A4_H - drawH) / 2;
      page.drawPage(embedded[leftIdx], { x, y, width: drawW, height: drawH });
    }

    // Draw right A5 page (centered in right half)
    if (rightIdx >= 0 && rightIdx < pageCount) {
      const x = HALF_W + (HALF_W - drawW) / 2;
      const y = (A4_H - drawH) / 2;
      page.drawPage(embedded[rightIdx], { x, y, width: drawW, height: drawH });
    }
  }

  return dstDoc.save();
}

/**
 * Initialise layout mode radio buttons.
 * Handles normal, 2-col, and booklet modes.
 * For booklet: sets @page to A5, wires up the two-step PDF workflow.
 */
export function initLayoutMode(): void {
  const radios = document.querySelectorAll<HTMLInputElement>('[data-layout-radio]');
  const printPage = document.querySelector<HTMLElement>('.print-page');
  const normalPrintBtn = document.getElementById('print-btn');
  const bookletWorkflow = document.getElementById('booklet-workflow');
  const bookletSaveBtn = document.getElementById('booklet-save-btn');
  const bookletFileInput = document.getElementById('booklet-file-input') as HTMLInputElement | null;
  const bookletStatus = document.getElementById('booklet-status');

  let currentBookletMode: 'duplex' | 'single' = 'duplex';

  // Step 1: save as A5 PDF
  bookletSaveBtn?.addEventListener('click', () => window.print());

  // Step 2: convert uploaded PDF to booklet
  bookletFileInput?.addEventListener('change', async () => {
    const file = bookletFileInput.files?.[0];
    if (!file) return;

    if (bookletStatus) {
      bookletStatus.textContent = 'Converting...';
      bookletStatus.className = 'booklet-status';
    }

    try {
      const bookletBytes = await convertToBookletPdf(file, currentBookletMode);

      // Trigger download
      const blob = new Blob([bookletBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '') + '-booklet.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (bookletStatus) {
        bookletStatus.textContent = 'Done! Booklet PDF downloaded.';
        bookletStatus.className = 'booklet-status booklet-status--success';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Booklet conversion failed:', err);
      if (bookletStatus) {
        bookletStatus.textContent = `Error: ${msg}`;
        bookletStatus.className = 'booklet-status booklet-status--error';
      }
    }

    // Reset file input so re-selecting the same file triggers change
    bookletFileInput.value = '';
  });

  function applyLayout(value: string) {
    // Remove all layout classes
    printPage?.classList.remove('print-two-col', 'print-booklet');
    removeBookletPageStyle();

    // Toggle button visibility
    const isBooklet = value === 'booklet-duplex' || value === 'booklet-single';
    if (normalPrintBtn) normalPrintBtn.hidden = isBooklet;
    if (bookletWorkflow) bookletWorkflow.hidden = !isBooklet;

    // Clear status
    if (bookletStatus) {
      bookletStatus.textContent = '';
      bookletStatus.className = 'booklet-status';
    }

    switch (value) {
      case 'two-col':
        printPage?.classList.add('print-two-col');
        break;
      case 'booklet-duplex':
        printPage?.classList.add('print-booklet');
        injectBookletPageStyle();
        currentBookletMode = 'duplex';
        break;
      case 'booklet-single':
        printPage?.classList.add('print-booklet');
        injectBookletPageStyle();
        currentBookletMode = 'single';
        break;
    }
  }

  radios.forEach(radio => {
    radio.addEventListener('change', () => applyLayout(radio.value));
  });
}

/**
 * @deprecated Use initLayoutMode instead. Kept for backwards compatibility.
 */
export function initColumnToggle(): void {
  // No-op: replaced by initLayoutMode
}
