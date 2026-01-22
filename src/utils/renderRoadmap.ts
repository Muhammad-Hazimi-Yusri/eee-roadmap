// src/utils/renderRoadmap.ts

import type { RoadmapSection } from '../types/roadmap';

/**
 * Generates HTML string for roadmap sections.
 * Used for client-side rendering of custom tracks.
 * 
 * Note: Does NOT wrap glossary terms (custom content skips this).
 * Expects concept.notesHtml to be pre-parsed.
 */
export function renderRoadmapHtml(sections: RoadmapSection[]): string {
  return sections.map(section => `
    <div class="roadmap-section" id="${section.id}">
      <h3 class="section-title">${section.title}</h3>
      <div class="roadmap-track">
        ${section.items.map(item => renderTopicHtml(item)).join('')}
      </div>
    </div>
  `).join('');
}

function renderTopicHtml(item: RoadmapSection['items'][0]): string {
  const optionalClass = item.optional ? 'roadmap-node--optional' : '';
  
  return `
    <div class="roadmap-node ${optionalClass}" id="${item.id}" data-node-id="${item.id}">
      <button class="node-button" aria-expanded="false">
        <span class="node-dot"></span>
        <span class="node-title">${item.title}</span>
      </button>
      <div class="node-content" hidden>
        <p class="node-description">${item.description}</p>
        ${renderPrerequisites(item.prerequisites)}
        ${renderOutcomes(item.outcomes)}
        ${renderConcepts(item.id, item.concepts)}
        ${renderResources(item.resources)}
      </div>
    </div>
  `;
}

function renderPrerequisites(prerequisites?: string[]): string {
  if (!prerequisites?.length) return '';
  
  const tags = prerequisites.map(prereq => {
    const parts = prereq.split('/');
    if (parts.length >= 2) {
      let track = parts[0];
      let id = parts[1];
      const displayParts = parts.slice(2);
      const displayName = displayParts.length > 0 
        ? displayParts.join('/') 
        : id.replace(/-/g, ' ');
      
      // Check if custom track (prefix: "custom:")
      let href: string;
      if (track.startsWith('custom:')) {
        const customSlug = track.replace('custom:', '');
        href = `/roadmaps/custom/?track=${customSlug}#${id}`;
      } else {
        href = `/roadmaps/${track}/#${id}`;
      }
      
      return `<a href="${href}" class="prereq prereq--link prereq-tag prereq-tag--link" data-prereq-topic="${id}">${displayName}</a>`;
    }
    return `<span class="prereq prereq--static prereq-tag prereq-tag--static" data-static-prereq="${prereq}">${prereq}</span>`;
  }).join('');
  
  return `
    <div class="node-prereqs">
      <span class="prereqs-label">Prerequisites:</span>
      ${tags}
    </div>
  `;
}

function renderOutcomes(outcomes?: string[]): string {
  if (!outcomes?.length) return '';
  
  return `
    <div class="node-outcomes">
      <span class="outcomes-label">You'll learn to:</span>
      <ul class="outcomes-list">
        ${outcomes.map(o => `<li>${o}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderConcepts(topicId: string, concepts?: { name: string }[]): string {
  if (!concepts?.length) return '';
  
  return `
    <ul class="node-concepts">
      ${concepts.map(c => `
        <li data-topic-id="${topicId}" data-concept="${c.name}" class="pill concept-pill">${c.name}</li>
      `).join('')}
    </ul>
  `;
}

function renderResources(resources?: { label: string; url: string }[]): string {
  if (!resources?.length) return '';
  
  return `
    <div class="node-resources">
      <span class="resources-label">Resources:</span>
      ${resources.map(r => `
        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-link">${r.label}</a>
      `).join('')}
    </div>
  `;
}