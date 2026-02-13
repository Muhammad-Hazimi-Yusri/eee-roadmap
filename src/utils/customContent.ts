// src/utils/customContent.ts

import type { CustomConcept } from '../types/custom-content';
import { loadCustomContent } from '../lib/sync';

/**
 * Injects custom concepts into existing topics on the current roadmap page.
 * Call this after page load and auth state is resolved.
 */
export async function injectCustomConcepts(trackSlug: string): Promise<void> {
  const content = await loadCustomContent();
  if (!content.concepts) return;

  // Find concepts for this track
  Object.entries(content.concepts).forEach(([key, concepts]) => {
    // Key format: "track-slug/topic-id"
    const [track, topicId] = key.split('/');
    if (track !== trackSlug) return;

    // Find the topic's concept list
    const topicNode = document.querySelector(`[data-node-id="${topicId}"]`);
    if (!topicNode) return;

    const conceptList = topicNode.querySelector('.node-concepts');
    if (!conceptList) return;

    // Inject each custom concept
    concepts.forEach((concept: CustomConcept) => {
      // Skip if already exists
      const existing = conceptList.querySelector(`[data-concept="${concept.name}"]`);
      if (existing) return;

      const pill = document.createElement('li');
      pill.className = 'pill concept-pill concept-pill--custom';
      pill.setAttribute('data-topic-id', topicId);
      pill.setAttribute('data-concept', concept.name);
      pill.setAttribute('data-custom', 'true');
      pill.textContent = concept.name;

      conceptList.appendChild(pill);

      // Add to conceptData for ConceptWindows
      addToConceptData(topicId, concept);
    });
  });
}

/**
 * Adds "+" buttons to concept lists for adding custom concepts.
 * Only shows for signed-in users.
 */
export async function addCustomConceptButtons(trackSlug: string): Promise<void> {
  const { getCurrentUserId } = await import('../lib/sync');
  const userId = await getCurrentUserId();
  
  // Only for signed-in users
  if (!userId) return;

  // Find all concept lists
  document.querySelectorAll('.node-concepts').forEach((conceptList) => {
    // Skip if already has add button
    if (conceptList.querySelector('.add-custom-concept-btn')) return;
    
    const topicNode = conceptList.closest('[data-node-id]');
    const topicId = topicNode?.getAttribute('data-node-id');
    if (!topicId) return;

    // Create add button
    const addBtn = document.createElement('button');
    addBtn.className = 'add-custom-concept-btn';
    addBtn.setAttribute('type', 'button');
    addBtn.setAttribute('title', 'Add custom concept');
    addBtn.setAttribute('aria-label', 'Add custom concept');
    addBtn.innerHTML = '+';
    
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddConceptModal(trackSlug, topicId);
    });

    conceptList.appendChild(addBtn);
  });
}

/**
 * Opens modal to add a new custom concept
 */
function openAddConceptModal(trackSlug: string, topicId: string): void {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'add-concept-modal';
  modal.innerHTML = `
    <div class="add-concept-modal-backdrop"></div>
    <div class="add-concept-modal-content">
      <h3 class="add-concept-modal-title">Add Custom Concept</h3>
      <input 
        type="text" 
        class="add-concept-modal-input" 
        placeholder="Concept name..."
        autofocus
      />
      <div class="add-concept-modal-actions">
        <button class="btn btn--sm add-concept-cancel">Cancel</button>
        <button class="btn btn--sm btn--primary add-concept-save">Add</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector('.add-concept-modal-input') as HTMLInputElement;
  const backdrop = modal.querySelector('.add-concept-modal-backdrop');
  const cancelBtn = modal.querySelector('.add-concept-cancel');
  const saveBtn = modal.querySelector('.add-concept-save');

  // Focus input
  setTimeout(() => input?.focus(), 50);

  // Close modal
  const closeModal = () => modal.remove();

  backdrop?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Save concept
  const handleSave = async () => {
    const name = input?.value.trim();
    if (!name) {
      input?.focus();
      return;
    }

    saveBtn!.textContent = 'Adding...';
    (saveBtn as HTMLButtonElement).disabled = true;

    try {
      const { loadCustomContent, saveCustomContent } = await import('../lib/sync');
      const content = await loadCustomContent();

      // Initialize concepts map if needed
      if (!content.concepts) {
        content.concepts = {};
      }

      // Key format: "track-slug/topic-id"
      const key = `${trackSlug}/${topicId}`;
      if (!content.concepts[key]) {
        content.concepts[key] = [];
      }

      // Check for duplicate
      const exists = content.concepts[key].some(c => c.name === name);
      if (exists) {
        alert('A concept with this name already exists in this topic.');
        saveBtn!.textContent = 'Add';
        (saveBtn as HTMLButtonElement).disabled = false;
        return;
      }

      // Add new concept
      content.concepts[key].push({
        name,
        isCustom: true,
      });

      // Save to Supabase
      const success = await saveCustomContent(content);

      if (success) {
        closeModal();
        // Reload to show new concept
        window.location.reload();
      } else {
        alert('Failed to save. Are you signed in?');
        saveBtn!.textContent = 'Add';
        (saveBtn as HTMLButtonElement).disabled = false;
      }
    } catch (err) {
      console.error('Failed to add concept:', err);
      alert('Failed to add concept.');
      saveBtn!.textContent = 'Add';
      (saveBtn as HTMLButtonElement).disabled = false;
    }
  };

  saveBtn?.addEventListener('click', handleSave);
  
  // Enter key to save
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
}

/** Adds custom concept to window.conceptData for ConceptWindows */
function addToConceptData(topicId: string, concept: CustomConcept): void {
  const conceptData = (window as any).conceptData || {};
  if (!conceptData[topicId]) {
    conceptData[topicId] = {};
  }
  
  conceptData[topicId][concept.name] = {
    notesHtml: concept.notesHtml || '',
    isCustom: true,
  };
  
  (window as any).conceptData = conceptData;
}

/**
 * Loads custom tracks and renders them in the custom tracks section.
 * Call this on /roadmaps/ page after auth state resolves.
 */
export async function injectCustomTracks(): Promise<void> {
  const { getCurrentUserId } = await import('../lib/sync');
  const userId = await getCurrentUserId();
  
  // Only show section for signed-in users
  if (!userId) return;

  const section = document.getElementById('custom-tracks-section');
  const grid = document.getElementById('custom-tracks-grid');
  if (!section || !grid) return;

  // Show the section (for signed-in users)
  section.removeAttribute('hidden');

  // Load custom content
  const content = await loadCustomContent();
  const tracks = content.tracks || {};
  const trackEntries = Object.entries(tracks);

  // Always add "Create New Track" card first
  const createCard = document.createElement('div');
  createCard.className = 'custom-track-card custom-track-card--create';
  createCard.innerHTML = `
    <div class="custom-track-card__icon">+</div>
    <h3 class="custom-track-card__title">Create New Track</h3>
    <p class="custom-track-card__desc">Build your own learning roadmap</p>
    <div class="custom-track-card__actions">
      <a href="/roadmaps/custom/?new=true" class="btn btn--sm btn--primary">New</a>
      <button class="btn btn--sm btn--outline import-track-btn">↓ Import</button>
    </div>
  `;
  grid.appendChild(createCard);

  // Import button handler
  createCard.querySelector('.import-track-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openImportDialog();
  });

  // Render each custom track
  trackEntries.forEach(([slug, track]) => {
    const card = document.createElement('a');
    card.href = `/roadmaps/custom/?track=${slug}`;
    card.className = 'custom-track-card';
    card.innerHTML = `
      <button class="custom-track-card__delete" title="Delete track" aria-label="Delete track">&times;</button>
      <span class="custom-badge">${track.meta.category?.toUpperCase() || 'CUSTOM'}</span>
      <div class="custom-track-card__icon">✎</div>
      <h3 class="custom-track-card__title">${track.meta.title}</h3>
      <p class="custom-track-card__desc">${track.meta.description}</p>
      <div class="custom-track-card__stats">
        ${track.sections.length} section${track.sections.length !== 1 ? 's' : ''}
      </div>
    `;

    // Delete button handler
    card.querySelector('.custom-track-card__delete')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const confirmed = await confirmDeleteTrack(track.meta.title);
      if (!confirmed) return;
      const success = await deleteCustomTrack(slug);
      if (success) {
        card.remove();
      } else {
        alert('Failed to delete track. Are you signed in?');
      }
    });

    grid.appendChild(card);
  });
}

/**
 * Opens file dialog to import a track from JSON
 */
function openImportDialog(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  
  input.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate structure
      if (!data.meta || !data.sections) {
        alert('Invalid track file. Must contain "meta" and "sections".');
        return;
      }
      
      if (!data.meta.title) {
        alert('Invalid track file. Missing "meta.title".');
        return;
      }
      
      // Store in sessionStorage for editor to pick up
      sessionStorage.setItem('eee-import-track', JSON.stringify(data));
      
      // Redirect to editor in import mode
      window.location.href = '/roadmaps/custom/?import=true';
      
    } catch (err) {
      console.error('Failed to parse import file:', err);
      alert('Failed to parse file. Make sure it\'s valid JSON.');
    }
  });
  
  input.click();
}

/**
 * Loads user concept notes into window.conceptNotes.
 * Call this after page load and auth state is resolved.
 */
export async function loadConceptNotes(): Promise<void> {
  const content = await loadCustomContent();
  (window as any).conceptNotes = content.conceptNotes || {};
}

/**
 * Deletes a custom track and all associated data (concepts, conceptNotes).
 */
export async function deleteCustomTrack(slug: string): Promise<boolean> {
  const { loadCustomContent, saveCustomContent } = await import('../lib/sync');
  const content = await loadCustomContent();

  // Remove the track
  delete content.tracks[slug];

  // Remove associated custom concepts
  if (content.concepts) {
    const prefix = `${slug}/`;
    Object.keys(content.concepts).forEach(key => {
      if (key.startsWith(prefix)) {
        delete content.concepts![key];
      }
    });
  }

  // Remove associated concept notes
  if (content.conceptNotes) {
    const prefix = `${slug}/`;
    Object.keys(content.conceptNotes).forEach(key => {
      if (key.startsWith(prefix)) {
        delete content.conceptNotes![key];
      }
    });
  }

  return await saveCustomContent(content);
}

/**
 * Shows a confirmation modal for deleting a custom track.
 * Returns a promise that resolves to true if confirmed, false if cancelled.
 */
export function confirmDeleteTrack(trackTitle: string): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'add-concept-modal';
    modal.innerHTML = `
      <div class="add-concept-modal-backdrop"></div>
      <div class="add-concept-modal-content">
        <h3 class="add-concept-modal-title">Delete Track</h3>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin: 0 0 1rem;">
          Permanently delete <strong>${trackTitle}</strong>? This will remove the track and all its data. This cannot be undone.
        </p>
        <div class="add-concept-modal-actions">
          <button class="btn btn--sm delete-cancel">Cancel</button>
          <button class="btn btn--sm delete-confirm" style="background: #b91c1c; color: #fff; border-color: #b91c1c;">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const backdrop = modal.querySelector('.add-concept-modal-backdrop');
    const cancelBtn = modal.querySelector('.delete-cancel');
    const confirmBtn = modal.querySelector('.delete-confirm');

    const close = (result: boolean) => {
      modal.remove();
      resolve(result);
    };

    backdrop?.addEventListener('click', () => close(false));
    cancelBtn?.addEventListener('click', () => close(false));
    confirmBtn?.addEventListener('click', () => close(true));

    document.addEventListener('keydown', function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handler);
        close(false);
      }
    });
  });
}