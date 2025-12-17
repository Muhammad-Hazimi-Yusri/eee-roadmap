// src/utils/trail.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defaultTrailConfig,
  drawTrailLine,
  clearTrail,
  type TrailState,
} from './trail';

// Mock canvas context
function createMockState(): TrailState {
  const mockCtx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
  };

  const mockCanvas = {
    width: 1920,
    height: 1080,
    getContext: () => mockCtx,
  };

  return {
    canvas: mockCanvas as unknown as HTMLCanvasElement,
    ctx: mockCtx as unknown as CanvasRenderingContext2D,
    lastPos: null,
  };
}

describe('trail utilities', () => {
  describe('defaultTrailConfig', () => {
    it('has colors for all tools', () => {
      expect(defaultTrailConfig.colors.pen).toBeDefined();
      expect(defaultTrailConfig.colors.highlighter).toBeDefined();
      expect(defaultTrailConfig.colors.eraser).toBeDefined();
    });

    it('has widths for all tools', () => {
      expect(defaultTrailConfig.widths.pen).toBe(2);
      expect(defaultTrailConfig.widths.highlighter).toBe(16);
      expect(defaultTrailConfig.widths.eraser).toBe(12);
    });
  });

  describe('drawTrailLine', () => {
    it('draws line between two points', () => {
      const state = createMockState();
      const from = { x: 10, y: 20 };
      const to = { x: 30, y: 40 };

      drawTrailLine(state, from, to, 'pen');

      const ctx = state.ctx as any;
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
      expect(ctx.lineTo).toHaveBeenCalledWith(30, 40);
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('uses correct color for tool', () => {
      const state = createMockState();
      
      drawTrailLine(state, { x: 0, y: 0 }, { x: 1, y: 1 }, 'highlighter');

      expect(state.ctx!.strokeStyle).toBe('rgba(255, 220, 100, 0.6)');
    });

    it('uses correct width for tool', () => {
      const state = createMockState();
      
      drawTrailLine(state, { x: 0, y: 0 }, { x: 1, y: 1 }, 'eraser');

      expect(state.ctx!.lineWidth).toBe(12);
    });

    it('handles null ctx gracefully', () => {
      const state: TrailState = { canvas: null, ctx: null, lastPos: null };
      
      // Should not throw
      expect(() => {
        drawTrailLine(state, { x: 0, y: 0 }, { x: 1, y: 1 }, 'pen');
      }).not.toThrow();
    });
  });

  describe('clearTrail', () => {
    it('clears the canvas', () => {
      const state = createMockState();

      clearTrail(state);

      const ctx = state.ctx as any;
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1920, 1080);
    });

    it('handles null ctx gracefully', () => {
      const state: TrailState = { canvas: null, ctx: null, lastPos: null };
      
      expect(() => {
        clearTrail(state);
      }).not.toThrow();
    });
  });
});