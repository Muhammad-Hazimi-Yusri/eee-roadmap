/**
 * Shared print mode utilities.
 * Used by both PrintRoadmap.astro (official tracks) and custom/print.astro (custom tracks).
 */

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
 * Initialise 2-column layout toggle.
 * Toggles the .print-two-col class on .print-page.
 */
export function initColumnToggle(): void {
  document.getElementById('two-col-toggle')?.addEventListener('change', (e) => {
    document.querySelector('.print-page')?.classList.toggle(
      'print-two-col', (e.target as HTMLInputElement).checked
    );
  });
}
