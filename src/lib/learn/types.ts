// src/lib/learn/types.ts
// Shared types for PCB, Digital, and Semiconductor lesson data files.

export interface TutorialStep {
  instruction: string;
  hint?: string;
}

export interface LessonBase {
  id: string;
  title: string;
  domain: 'pcb' | 'digital' | 'semiconductor';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  /** Identifies which simulator component to render. */
  simulator: string;
  /** Props passed to the simulator component. */
  simulatorProps: Record<string, unknown>;
  tutorial: {
    steps: TutorialStep[];
  };
}
