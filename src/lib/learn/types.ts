// src/lib/learn/types.ts
// Shared types for PCB, Digital, and Semiconductor lesson data files.

export interface TutorialStep {
  instruction: string;
  hint?: string;
}

export interface RelatedConcept {
  /** Concept ID in the shared library (e.g. 'per-unit-system') */
  id: string;
  /** Track slug to link back to (e.g. 'power-system-fundamentals') */
  trackSlug: string;
  /** Topic ID within the track (e.g. 'per-unit-system') */
  topicId: string;
  /** Display label for the link */
  label: string;
}

export interface LessonBase {
  id: string;
  title: string;
  domain: 'pcb' | 'digital' | 'semiconductor' | 'power-systems';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  /** Identifies which simulator component to render. */
  simulator: string;
  /** Props passed to the simulator component. */
  simulatorProps: Record<string, unknown>;
  tutorial: {
    steps: TutorialStep[];
  };
  /** Links back to related roadmap track topics */
  relatedConcepts?: RelatedConcept[];
}
