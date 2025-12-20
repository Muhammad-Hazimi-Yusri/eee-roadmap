// src/types/roadmap.ts

/**
 * Core data types for roadmap content structure.
 * Used by fundamentals.ts, core.ts, and advanced.ts data files.
 * 
 * @module roadmap
 */

/** External learning resource link */
export interface Resource {
  /** Display text for the link */
  label: string;
  /** URL to external resource (MIT OCW, Khan Academy, etc.) */
  url: string;
}

/** Individual concept within a topic */
export interface Concept {
  /** Display name of the concept */
  name: string;
  /** Markdown explanation (optional) */
  notes?: string;
  /** URL to PDF file - local ("/notes/topic.pdf") or external (optional) */
  pdf?: string;
}

/**
 * Prerequisite format:
 * - Linkable: "track/topic-id/Display Name" (navigates to that topic)
 *   Example: "fundamentals/dc-circuits/DC Circuits"
 * - Static: plain text (non-clickable, external knowledge)
 *   Example: "Basic programming", "Complex numbers"
 */

/** Individual learning topic within a section */
export interface Topic {
  /** Unique identifier (used in URLs and localStorage keys) */
  id: string;
  /** Display title */
  title: string;
  /** Brief explanation of what this topic covers and why it matters */
  description: string;
  /** 
   * Prerequisites - either linkable ("track/id/Name") or static ("Plain text")
   * @see Prerequisite format comment above
   */
  prerequisites?: string[];
  /** Learning outcomes - what the learner will be able to do */
  outcomes?: string[];
  /** Key concepts covered (displayed as interactive pills) */
  concepts?: Concept[];
  /** Curated external learning resources */
  resources?: Resource[];
  /** If true, topic is optional/supplementary (styled differently) */
  optional?: boolean;
}

/** Section grouping related topics (e.g., "Math Foundations", "Circuit Fundamentals") */
export interface RoadmapSection {
  /** Unique identifier for the section */
  id: string;
  /** Section heading */
  title: string;
  /** Topics within this section */
  items: Topic[];
}