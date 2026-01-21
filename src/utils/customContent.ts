// src/utils/customContent.ts

import type { CustomContent, CustomConcept } from '../types/custom-content';
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

/** Adds custom concept to window.conceptData for ConceptWindows */
function addToConceptData(topicId: string, concept: CustomConcept): void {
  const conceptData = (window as any).conceptData || {};
  if (!conceptData[topicId]) {
    conceptData[topicId] = {};
  }
  
  conceptData[topicId][concept.name] = {
    notesHtml: concept.notesHtml || '',
  };
  
  (window as any).conceptData = conceptData;
}

/**
 * Loads custom tracks and renders them in the custom tracks section.
 * Call this on /roadmaps/ page after auth state resolves.
 */
export async function injectCustomTracks(): Promise<void> {
  const content = await loadCustomContent();
  if (!content.tracks || Object.keys(content.tracks).length === 0) return;

  const section = document.getElementById('custom-tracks-section');
  const grid = document.getElementById('custom-tracks-grid');
  if (!section || !grid) return;

  // Show the section
  section.removeAttribute('hidden');

  // Render each custom track
  Object.entries(content.tracks).forEach(([slug, track]) => {
    const card = document.createElement('a');
    card.href = `/roadmaps/custom/?track=${slug}`;
    card.className = 'custom-track-card';
    card.innerHTML = `
      <span class="custom-badge">Custom</span>
      <div class="custom-track-card__icon">✎</div>
      <h3 class="custom-track-card__title">${track.meta.title}</h3>
      <p class="custom-track-card__desc">${track.meta.description}</p>
      <div class="custom-track-card__stats">
        ${track.sections.length} section${track.sections.length !== 1 ? 's' : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}