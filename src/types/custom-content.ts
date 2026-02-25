// src/types/custom-content.ts

/**
 * Types for user-created custom content stored in Supabase.
 * Custom tracks and concepts added to existing tracks.
 */

import type { Roadmap } from './roadmap';

/**
 * Custom concept with pre-parsed HTML (parsed at save time in editor).
 * Used in CustomConceptsMap (concepts added to official track topics).
 */
export interface CustomConcept {
  /** Display name of the concept */
  name: string;
  /** Pre-parsed HTML from markdown (parsed in editor before saving) */
  notesHtml?: string;
  /** Always true for user-created concepts */
  isCustom: true;
}

// ---------------------------------------------------------------------------
// Concept entries stored inside custom track topics (sections[].items[].concepts[])
// ---------------------------------------------------------------------------

/** Reference to an official library concept (resolved client-side from concept-library.json) */
export interface OfficialConceptRef {
  type: 'official';
  /** Concept ID in concept-library.json */
  ref: string;
  /** Cached display name (from library at time of picking) */
  name: string;
  /** Optional user-written markdown notes (override library notes in the concept window) */
  notes?: string;
}

/** Fully inline custom concept created by the user in the editor */
export interface CustomConceptInline {
  type: 'custom';
  name: string;
  notes?: string;
}

/**
 * Legacy inline concept (pre-Phase 5 format — existing Supabase data).
 * Has name but no `type` field. Treated as custom inline.
 */
export interface LegacyConceptEntry {
  name: string;
  notes?: string;
  notesHtml?: string;
  isCustom?: true;
}

/** Union of all concept formats stored in custom track topics */
export type ConceptEntry = OfficialConceptRef | CustomConceptInline | LegacyConceptEntry;

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