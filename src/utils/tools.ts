// src/utils/tools.ts

export type ToolName = 'cursor' | 'pen' | 'highlighter' | 'eraser';
export type ModeName = 'simple' | 'tools';

export interface ToolCallbacks {
  setComplete: (key: string) => boolean;
  setImportant: (key: string) => boolean;
  resetState: (key: string) => void;
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
 * Check if tool can modify state (not cursor)
 */
export function isStatefulTool(tool: ToolName): boolean {
  return tool !== 'cursor';
}

/**
 * Check if tool can be used on static prereqs
 * (highlighter doesn't apply to prereqs)
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