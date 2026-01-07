// src/types/roadmap.ts

/**
 * Core data types for roadmap content structure.
 * Used to type roadmap JSON data loaded from content/*.yaml files.
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
  /** 
   * Markdown explanation (optional).
   * 
   * IMPORTANT: When using template literals, avoid leading whitespace on lines.
   * Markdown treats 4+ spaces as code blocks, breaking embeds.
   * 
   * @example
   * // ❌ Bad - indented lines become code blocks
   * notes: `
   *   Some text
   *   ![PDF](/file.pdf)
   * `
   * 
   * // ✅ Good - no leading whitespace
   * notes: `Some text
   * 
   * ![PDF](/file.pdf)
   * `
   */
  notes?: string;
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

/** Track metadata for display in track listings */
export interface TrackMeta {
  /** Display title (defaults to filename in title case) */
  title: string;
  /** Brief description of the track */
  description: string;
  /** Lucide icon name (defaults to 'grid-3x3') */
  icon: string;
  /** Show on homepage featured section (defaults to false) */
  featured: boolean;
  /** Category for filtering: 'core', 'specialization', 'misc', etc. */
  category: string;
  /** Display order, lower = first (defaults to 999) */
  order: number;
}

/** Complete roadmap data structure */
export interface Roadmap {
  /** Track metadata */
  meta: TrackMeta;
  /** Roadmap sections */
  sections: RoadmapSection[];
}