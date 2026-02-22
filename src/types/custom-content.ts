// src/types/custom-content.ts

/**
 * Types for user-created custom content stored in Supabase.
 * Custom tracks and concepts added to existing tracks.
 */

import type { Roadmap } from './roadmap';

/**
 * Custom concept with pre-parsed HTML (parsed at save time in editor).
 *
 * Phase 5 (planned, not yet implemented): will also support
 * `{ ref: string, type: 'official' }` to embed official library concepts
 * by reference into custom tracks, resolved client-side from concept-library.json.
 */
export interface CustomConcept {
  /** Display name of the concept */
  name: string;
  /** Pre-parsed HTML from markdown (parsed in editor before saving) */
  notesHtml?: string;
  /** Always true for user-created concepts */
  isCustom: true;
}

/** Custom concepts keyed by "track-slug/topic-id" */
export interface CustomConceptsMap {
  [trackTopicKey: string]: CustomConcept[];
}

/** Custom tracks keyed by slug */
export interface CustomTracksMap {
  [slug: string]: Roadmap;
}

/** User notes for any concept, keyed by "track-slug/topic-id/concept-name" */
export interface ConceptNotesMap {
  [conceptKey: string]: string; // value is markdown (parsed on display)
}

/** Root structure for custom_content column in Supabase */
export interface CustomContent {
  /** User-created tracks (full roadmap format) */
  tracks: CustomTracksMap;
  /** Custom concepts added to existing tracks */
  concepts: CustomConceptsMap;
  /** User notes added to any concept (official or custom) */
  conceptNotes?: ConceptNotesMap;
}

/** Empty default for new users */
export const emptyCustomContent: CustomContent = {
  tracks: {},
  concepts: {},
  conceptNotes: {},
};