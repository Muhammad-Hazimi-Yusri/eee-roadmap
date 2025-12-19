/**
 * Canvas trail utilities for drawing swipe gesture visual feedback.
 * Used in Tools mode to show pen/highlighter/eraser strokes.
 * 
 * @module trail
 */
export interface TrailConfig {
  colors: Record<string, string>;
  widths: Record<string, number>;
}

/** Default trail colors and widths per tool */
export const defaultTrailConfig = {
  /** Stroke colors by tool name */
  colors: {
    pen: '#1a1a1a',
    highlighter: 'rgba(255, 220, 100, 0.6)',
    eraser: '#cccccc',
  } as Record<string, string>,
  /** Stroke widths by tool name */
  widths: {
    pen: 2,
    highlighter: 16,
    eraser: 12,
  } as Record<string, number>,
};

/** Canvas state for trail drawing */
export interface TrailState {
  /** Canvas element reference */
  canvas: HTMLCanvasElement | null;
  /** 2D rendering context */
  ctx: CanvasRenderingContext2D | null;
  /** Last cursor/touch position for line drawing */
  lastPos: { x: number; y: number } | null;
}

/**
 * Initialize trail canvas with auto-resize on window resize.
 * 
 * @param canvasId - ID of the canvas element
 * @returns TrailState object for use with other trail functions
 * 
 * @example
 * const trailState = initTrailCanvas('swipe-trail-canvas');
 */
export function initTrailCanvas(canvasId: string): TrailState {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) {
    return { canvas: null, ctx: null, lastPos: null };
  }

  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  return { canvas, ctx, lastPos: null };
}

/**
 * Initialize trail canvas with auto-resize on window resize.
 * 
 * @param canvasId - ID of the canvas element
 * @returns TrailState object for use with other trail functions
 * 
 * @example
 * const trailState = initTrailCanvas('swipe-trail-canvas');
 */
export function drawTrailLine(
  state: TrailState,
  from: { x: number; y: number },
  to: { x: number; y: number },
  tool: string,
  config: TrailConfig = defaultTrailConfig
): void {
  if (!state.ctx) return;

  state.ctx.beginPath();
  state.ctx.moveTo(from.x, from.y);
  state.ctx.lineTo(to.x, to.y);
  state.ctx.strokeStyle = config.colors[tool] || config.colors.pen;
  state.ctx.lineWidth = config.widths[tool] || 2;
  state.ctx.lineCap = 'round';
  state.ctx.lineJoin = 'round';
  state.ctx.stroke();
}

/**
 * Clear all trail marks from canvas immediately.
 * 
 * @param state - TrailState from initTrailCanvas
 */
export function clearTrail(state: TrailState): void {
  if (!state.ctx || !state.canvas) return;
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
}

/**
 * Clear trail with a short delay (visual feedback on mouse up).
 * 
 * @param state - TrailState from initTrailCanvas
 * @param delay - Milliseconds before clearing (default: 300)
 */
export function fadeOutTrail(state: TrailState, duration: number = 300): void {
  if (!state.canvas || !state.ctx) return;

  // Simple approach: clear after delay
  setTimeout(() => {
    clearTrail(state);
  }, duration);
}