// src/lib/tools/types.ts
// Schema for /tools/ — interactive, file-processing apps.
//
// Each tool runs in one of three modes:
//   - 'js'      Pure JavaScript inside a registered React island.
//   - 'python'  Pyodide-driven Python script with declared inputs/outputs.
//   - 'snippet' View-only copy-paste (e.g. VBA — can't run in a browser).

export type ToolRuntime = 'js' | 'python' | 'snippet';

export type ToolCategory =
  | 'power-flow'
  | 'fault'
  | 'harmonics'
  | 'reporting'
  | 'data'
  | 'macros';

export type ToolDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ToolBlock =
  | { type: 'prose'; text: string }
  | { type: 'code'; language: string; filename?: string; text: string }
  | { type: 'note'; kind?: 'tip' | 'warn' | 'gotcha'; text: string };

export interface ToolBase {
  id: string;
  title: string;
  category: ToolCategory;
  difficulty: ToolDifficulty;
  description: string;
  tags: string[];
  runtime: ToolRuntime;
  /** Long-form prose & notes shown below the tool itself. */
  blocks?: ToolBlock[];
  relatedLabs?: { id: string; label: string }[];
}

// ── JS-runtime tools ──────────────────────────────────────────────────────────

export interface JsTool extends ToolBase {
  runtime: 'js';
  /** Component key registered in src/components/tools/registry.ts. */
  componentKey: string;
}

// ── Python-runtime tools (Pyodide) ────────────────────────────────────────────

export interface ToolFileInput {
  /** Logical input name. The tool sees the file at /input/<name>. */
  name: string;
  /** HTML accept string ('.csv', '.json', 'text/*' …). */
  accept: string;
  required: boolean;
  description: string;
}

export interface ToolFileOutput {
  /** Filename the script writes to /output/<name>. */
  name: string;
  /** MIME type used to label and preview the output. */
  mime: string;
  description: string;
}

export type ToolParam =
  | { kind: 'number'; name: string; label: string; default: number; min?: number; max?: number; step?: number }
  | { kind: 'text';   name: string; label: string; default: string }
  | { kind: 'select'; name: string; label: string; default: string; options: { value: string; label: string }[] };

export interface PythonToolExample {
  /** Short label shown on the load button. */
  label: string;
  /** Optional tooltip describing the example. */
  description?: string;
  /** Inline file contents per input slot name (matches `ToolFileInput.name`). */
  files: Record<string, string>;
  /** Optional param overrides applied alongside the file contents. */
  params?: Record<string, string | number>;
}

export interface PythonTool extends ToolBase {
  runtime: 'python';
  /** Pyodide / micropip packages required (e.g. ['matplotlib', 'pandas']). */
  packages: string[];
  inputs: ToolFileInput[];
  outputs: ToolFileOutput[];
  /** Editable parameters surfaced as form fields, available to the script as
   *  `params['<name>']`. */
  params?: ToolParam[];
  /** The Python script. Runs after inputs are written to /input/<name>. */
  script: string;
  /** Optional pre-baked sample inputs surfaced as "load example" buttons. */
  examples?: PythonToolExample[];
}

// ── Snippet-runtime tools (view-only) ─────────────────────────────────────────

export interface SnippetTool extends ToolBase {
  runtime: 'snippet';
  language: 'vba' | 'powerquery' | 'shell';
}

export type Tool = JsTool | PythonTool | SnippetTool;
