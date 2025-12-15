// src/types/roadmap.ts

export interface Resource {
  label: string;
  url: string;
}

/**
 * Prerequisite format:
 * - Linkable: "track/topic-id/Display Name" (navigates to that topic)
 *   Example: "fundamentals/dc-circuits/DC Circuits"
 * - Static: plain text (non-clickable, external knowledge)
 *   Example: "Basic programming", "Complex numbers"
 */
export interface Topic {
  id: string;
  title: string;
  description: string;
  prerequisites?: string[];
  outcomes?: string[];
  concepts?: string[];
  resources?: Resource[];
  optional?: boolean;
}
export interface RoadmapSection {
  id: string;
  title: string;
  items: Topic[];
}