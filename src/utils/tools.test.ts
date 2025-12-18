// src/utils/tools.test.ts

import { describe, it, expect, vi } from 'vitest';
import {
  applyToolAction,
  isStatefulTool,
  canApplyToPrereq,
  toolIconPaths,
  type ToolCallbacks,
} from './tools';

function createMockCallbacks(): ToolCallbacks & { 
  setCompleteCalls: string[];
  setImportantCalls: string[];
  resetStateCalls: string[];
} {
  const callbacks = {
    setCompleteCalls: [] as string[],
    setImportantCalls: [] as string[],
    resetStateCalls: [] as string[],
    setComplete: vi.fn((key: string) => {
      callbacks.setCompleteCalls.push(key);
      return true;
    }),
    setImportant: vi.fn((key: string) => {
      callbacks.setImportantCalls.push(key);
      return true;
    }),
    resetState: vi.fn((key: string) => {
      callbacks.resetStateCalls.push(key);
    }),
    onStateChange: vi.fn(),
  };
  return callbacks;
}

describe('tools utilities', () => {
  describe('applyToolAction', () => {
    it('calls setComplete for pen tool', () => {
      const callbacks = createMockCallbacks();
      
      const result = applyToolAction('pen', 'topic:concept', callbacks);
      
      expect(result).toBe(true);
      expect(callbacks.setComplete).toHaveBeenCalledWith('topic:concept');
      expect(callbacks.setImportant).not.toHaveBeenCalled();
      expect(callbacks.resetState).not.toHaveBeenCalled();
    });

    it('calls setImportant for highlighter tool', () => {
      const callbacks = createMockCallbacks();
      
      const result = applyToolAction('highlighter', 'topic:concept', callbacks);
      
      expect(result).toBe(true);
      expect(callbacks.setImportant).toHaveBeenCalledWith('topic:concept');
      expect(callbacks.setComplete).not.toHaveBeenCalled();
      expect(callbacks.resetState).not.toHaveBeenCalled();
    });

    it('calls resetState for eraser tool', () => {
      const callbacks = createMockCallbacks();
      
      const result = applyToolAction('eraser', 'topic:concept', callbacks);
      
      expect(result).toBe(true);
      expect(callbacks.resetState).toHaveBeenCalledWith('topic:concept');
      expect(callbacks.setComplete).not.toHaveBeenCalled();
      expect(callbacks.setImportant).not.toHaveBeenCalled();
    });

    it('does nothing for cursor tool', () => {
      const callbacks = createMockCallbacks();
      
      const result = applyToolAction('cursor', 'topic:concept', callbacks);
      
      expect(result).toBe(false);
      expect(callbacks.setComplete).not.toHaveBeenCalled();
      expect(callbacks.setImportant).not.toHaveBeenCalled();
      expect(callbacks.resetState).not.toHaveBeenCalled();
    });

    it('calls onStateChange when state changes', () => {
      const callbacks = createMockCallbacks();
      
      applyToolAction('pen', 'topic:concept', callbacks);
      
      expect(callbacks.onStateChange).toHaveBeenCalledWith('topic:concept');
    });

    it('does not call onStateChange for cursor', () => {
      const callbacks = createMockCallbacks();
      
      applyToolAction('cursor', 'topic:concept', callbacks);
      
      expect(callbacks.onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('isStatefulTool', () => {
    it('returns false for cursor', () => {
      expect(isStatefulTool('cursor')).toBe(false);
    });

    it('returns true for pen', () => {
      expect(isStatefulTool('pen')).toBe(true);
    });

    it('returns true for highlighter', () => {
      expect(isStatefulTool('highlighter')).toBe(true);
    });

    it('returns true for eraser', () => {
      expect(isStatefulTool('eraser')).toBe(true);
    });
  });

  describe('canApplyToPrereq', () => {
    it('returns true for pen', () => {
      expect(canApplyToPrereq('pen')).toBe(true);
    });

    it('returns true for eraser', () => {
      expect(canApplyToPrereq('eraser')).toBe(true);
    });

    it('returns false for highlighter', () => {
      expect(canApplyToPrereq('highlighter')).toBe(false);
    });

    it('returns false for cursor', () => {
      expect(canApplyToPrereq('cursor')).toBe(false);
    });
  });

  describe('toolIconPaths', () => {
    it('has paths for all tools', () => {
      expect(toolIconPaths.cursor).toContain('path');
      expect(toolIconPaths.pen).toContain('path');
      expect(toolIconPaths.highlighter).toContain('path');
      expect(toolIconPaths.eraser).toContain('path');
    });
  });
});