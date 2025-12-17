
// src/utils/trail.ts

export interface TrailConfig {
  colors: Record<string, string>;
  widths: Record<string, number>;
}

export const defaultTrailConfig: TrailConfig = {
  colors: {
    pen: '#1a1a1a',
    highlighter: 'rgba(255, 220, 100, 0.6)',
    eraser: '#cccccc',
  },
  widths: {
    pen: 2,
    highlighter: 16,
    eraser: 12,
  },
};

export interface TrailState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  lastPos: { x: number; y: number } | null;
}

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

export function clearTrail(state: TrailState): void {
  if (!state.ctx || !state.canvas) return;
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
}

export function fadeOutTrail(state: TrailState, duration: number = 300): void {
  if (!state.canvas || !state.ctx) return;

  // Simple approach: clear after delay
  setTimeout(() => {
    clearTrail(state);
  }, duration);
}