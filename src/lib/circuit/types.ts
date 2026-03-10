// src/lib/circuit/types.ts

type ComponentType =
  | 'resistor'
  | 'voltage_source'
  | 'current_source'
  | 'capacitor'
  | 'inductor'
  | 'ground'
  | 'diode'
  | 'wire';

export type SimulatorType = 'falstad' | 'mna' | 'ngspice';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CircuitComponent {
  type: ComponentType;
  id: string;
  /** Node names connected to this component (order is significant: [+, -] for sources). */
  nodes: string[];
  value?: number;
  unit?: string;
}

export interface ProbeDefinition {
  type: 'voltage' | 'current' | 'power';
  /** Node to measure voltage at (for type='voltage'). */
  node?: string;
  /** Component ID to measure current through (for type='current'). */
  component?: string;
  label: string;
}

export interface ExpectedValue {
  value: number;
  tolerance: number;
  unit: string;
}

type ValidationType = 'probe_check' | 'component_changed' | 'manual';

export interface ValidationRule {
  type: ValidationType;
  probe?: string;
  component?: string;
  expected?: number;
  tolerance?: number;
}

export interface TutorialStep {
  instruction: string;
  hint?: string;
  /** Component IDs unlocked for interactive control at this step. */
  unlocks?: string[];
  validation?: ValidationRule;
}

export interface TutorialData {
  steps: TutorialStep[];
}

export interface RelatedConcept {
  id: string;
  trackSlug: string;
  topicId: string;
  label: string;
}

export interface CircuitLesson {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
  simulator: SimulatorType;
  components: CircuitComponent[];
  probes: ProbeDefinition[];
  expected: Record<string, ExpectedValue>;
  tutorial: TutorialData;
  /** Falstad CircuitJS circuit text (used when simulator='falstad'). */
  falstadCircuit?: string;
  /** SPICE netlist (used when simulator='ngspice'). */
  spiceNetlist?: string;
  /** Links back to related roadmap track topics */
  relatedConcepts?: RelatedConcept[];
}

// ─── MNA Solver types ────────────────────────────────────────────────────────

export interface SolverResult {
  /** Node voltages keyed by node name. Ground node is always 0. */
  nodeVoltages: Record<string, number>;
  /** Branch currents keyed by voltage-source component ID. */
  branchCurrents: Record<string, number>;
  /** Computed values for each probe defined in the lesson. */
  probeValues: Record<string, number>;
}
