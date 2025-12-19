/**
 * Tool action utilities for handling pen/highlighter/eraser interactions.
 * Abstracts the logic for applying tools to concept pills and prereqs.
 * 
 * @module tools
 */

/** Available tool names */
export type ToolName = 'cursor' | 'pen' | 'highlighter' | 'eraser';

/** Available interaction modes */
export type ModeName = 'simple' | 'tools';


/** Callbacks for tool state changes */
export interface ToolCallbacks {
  /** Called when pen tool marks item complete */
  setComplete: (key: string) => boolean;
  /** Called when highlighter tool marks item important */
  setImportant: (key: string) => boolean;
  /** Called when eraser tool resets item state */
  resetState: (key: string) => void;
  /** Optional callback after any state change */
  onStateChange?: (key: string) => void;
}

/**
 * Apply tool action to a concept/pill
 * Returns true if state was changed
 */
export function applyToolAction(
  tool: ToolName,
  key: string,
  callbacks: ToolCallbacks
): boolean {
  let changed = false;

  switch (tool) {
    case 'pen':
      changed = callbacks.setComplete(key);
      break;
    case 'highlighter':
      changed = callbacks.setImportant(key);
      break;
    case 'eraser':
      callbacks.resetState(key);
      changed = true;
      break;
    case 'cursor':
      // Cursor doesn't modify state
      break;
  }

  if (changed && callbacks.onStateChange) {
    callbacks.onStateChange(key);
  }

  return changed;
}

/**
 * Check if tool modifies state (not cursor).
 * 
 * @param tool - Tool name to check
 * @returns true if tool changes completion/importance state
 */
export function isStatefulTool(tool: ToolName): boolean {
  return tool !== 'cursor';
}

/**
 * Check if tool can be applied to prerequisite tags.
 * Highlighter doesn't apply to prereqs (they can't be "important").
 * 
 * @param tool - Tool name to check
 * @returns true if tool works on prereq tags
 */
export function canApplyToPrereq(tool: ToolName): boolean {
  return tool === 'pen' || tool === 'eraser';
}

/**
 * Cursor icon SVG paths for each tool
 */
export const toolIconPaths: Record<ToolName, string> = {
  cursor: '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>',
  pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>',
  highlighter: '<path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/>',
  eraser: '<path d="M20 20H7L3 16l9-9 8 8-4 4"/><path d="M6.5 13.5l5 5"/>',
};