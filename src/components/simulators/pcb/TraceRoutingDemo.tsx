// src/components/simulators/pcb/TraceRoutingDemo.tsx
// Canvas-based interactive PCB trace routing tutorial.
// Shows good vs bad routing patterns with explanations.
// Hydration: client:visible

import { useState, useEffect, useRef } from 'react';

type Mode = '45deg' | 'diffpair' | 'returnpath';

interface Pattern {
  label: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

const PCB_GREEN = '#1a3a1a';
const COPPER = '#b87333';
const COPPER_GOOD = '#4a9e4a';
const COPPER_BAD = '#c04040';
const TEXT_COLOR = '#d0c8b8';
const LABEL_BG = 'rgba(0,0,0,0.65)';

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = '10px monospace';
  const m = ctx.measureText(text);
  ctx.fillStyle = LABEL_BG;
  ctx.fillRect(x - 2, y - 12, m.width + 6, 16);
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(text, x + 1, y);
}

const modes: Record<Mode, { title: string; steps: Array<{ title: string; description: string; patterns: Pattern[] }> }> = {
  '45deg': {
    title: '45° Trace Routing',
    steps: [
      {
        title: 'The 90° Problem',
        description: 'Sharp 90° corners create acid-traps during etching and increase EMI radiation. Modern DRC tools flag them as errors.',
        patterns: [
          {
            label: 'Bad: 90° corner',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_BAD;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(w * 0.15, h * 0.5);
              ctx.lineTo(w * 0.5, h * 0.5);
              ctx.lineTo(w * 0.5, h * 0.2);
              ctx.stroke();
              drawLabel(ctx, '90° — AVOID', w * 0.35, h * 0.44);
            },
          },
          {
            label: 'Good: 45° chamfer',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_GOOD;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(w * 0.15, h * 0.5);
              ctx.lineTo(w * 0.42, h * 0.5);
              ctx.lineTo(w * 0.5, h * 0.42);
              ctx.lineTo(w * 0.5, h * 0.2);
              ctx.stroke();
              drawLabel(ctx, '45° chamfer — GOOD', w * 0.18, h * 0.44);
            },
          },
        ],
      },
      {
        title: '45° vs Arc Routing',
        description: 'Both 45° chamfers and smooth arcs are acceptable. Arcs reduce impedance discontinuities at high frequencies.',
        patterns: [
          {
            label: '45° routing',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_GOOD;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.6);
              ctx.lineTo(w * 0.35, h * 0.6);
              ctx.lineTo(w * 0.55, h * 0.4);
              ctx.lineTo(w * 0.8, h * 0.4);
              ctx.stroke();
              drawLabel(ctx, '45°', w * 0.37, h * 0.54);
            },
          },
          {
            label: 'Arc routing',
            draw(ctx, w, h) {
              ctx.strokeStyle = '#5a9edf';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.7);
              ctx.lineTo(w * 0.38, h * 0.7);
              ctx.arcTo(w * 0.55, h * 0.7, w * 0.55, h * 0.5, 28);
              ctx.lineTo(w * 0.55, h * 0.35);
              ctx.stroke();
              drawLabel(ctx, 'Arc', w * 0.4, h * 0.74);
            },
          },
        ],
      },
      {
        title: 'Stub Traces',
        description: 'Stub traces (dead-ends) create resonant structures that cause signal reflections. Always route traces to a destination.',
        patterns: [
          {
            label: 'Bad: stub trace',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_BAD;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.5);
              ctx.lineTo(w * 0.6, h * 0.5);
              ctx.stroke();
              // stub
              ctx.beginPath();
              ctx.moveTo(w * 0.4, h * 0.5);
              ctx.lineTo(w * 0.4, h * 0.25);
              ctx.stroke();
              drawLabel(ctx, 'Stub — remove!', w * 0.3, h * 0.3);
            },
          },
          {
            label: 'Good: no stubs',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_GOOD;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.5);
              ctx.lineTo(w * 0.82, h * 0.5);
              ctx.stroke();
              drawLabel(ctx, 'Clean — no stub', w * 0.35, h * 0.44);
            },
          },
        ],
      },
    ],
  },
  'diffpair': {
    title: 'Differential Pairs',
    steps: [
      {
        title: 'Tight Coupling',
        description: 'Differential traces must run together at consistent spacing. Tight coupling maximises common-mode noise rejection.',
        patterns: [
          {
            label: 'Bad: mismatched spacing',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_BAD;
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.4);
              ctx.lineTo(w * 0.5, h * 0.4);
              ctx.lineTo(w * 0.8, h * 0.3);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.6);
              ctx.lineTo(w * 0.5, h * 0.6);
              ctx.lineTo(w * 0.8, h * 0.7);
              ctx.stroke();
              drawLabel(ctx, 'Widening gap!', w * 0.52, h * 0.52);
            },
          },
          {
            label: 'Good: consistent spacing',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_GOOD;
              ctx.lineWidth = 5;
              // P trace
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.42);
              ctx.lineTo(w * 0.82, h * 0.42);
              ctx.stroke();
              // N trace
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.58);
              ctx.lineTo(w * 0.82, h * 0.58);
              ctx.stroke();
              // spacing annotation
              ctx.setLineDash([2, 2]);
              ctx.strokeStyle = '#666';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(w * 0.5, h * 0.42);
              ctx.lineTo(w * 0.5, h * 0.58);
              ctx.stroke();
              ctx.setLineDash([]);
              drawLabel(ctx, 'Uniform spacing ✓', w * 0.3, h * 0.35);
            },
          },
        ],
      },
      {
        title: 'Length Matching',
        description: 'Both traces in a differential pair must be the same length to ensure the signals arrive at the same time (skew = 0).',
        patterns: [
          {
            label: 'Length-matched pair',
            draw(ctx, w, h) {
              ctx.strokeStyle = COPPER_GOOD;
              ctx.lineWidth = 5;
              // P trace — direct
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.42);
              ctx.lineTo(w * 0.82, h * 0.42);
              ctx.stroke();
              // N trace — with meandering to match length
              ctx.beginPath();
              ctx.moveTo(w * 0.1, h * 0.58);
              ctx.lineTo(w * 0.45, h * 0.58);
              ctx.lineTo(w * 0.45, h * 0.72);
              ctx.lineTo(w * 0.55, h * 0.72);
              ctx.lineTo(w * 0.55, h * 0.58);
              ctx.lineTo(w * 0.82, h * 0.58);
              ctx.stroke();
              drawLabel(ctx, 'Meander = length match', w * 0.38, h * 0.77);
            },
          },
        ],
      },
    ],
  },
  'returnpath': {
    title: 'Return Current Path',
    steps: [
      {
        title: 'Return Path Basics',
        description: 'At high frequencies, return current flows directly below the signal trace on the reference plane — the path of lowest inductance.',
        patterns: [
          {
            label: 'Return current under trace',
            draw(ctx, w, h) {
              // Reference plane
              ctx.fillStyle = COPPER;
              ctx.fillRect(w * 0.1, h * 0.6, w * 0.8, 8);
              drawLabel(ctx, 'GND plane', w * 0.14, h * 0.74);
              // Signal trace
              ctx.fillStyle = COPPER_GOOD;
              ctx.fillRect(w * 0.1, h * 0.35, w * 0.8, 6);
              drawLabel(ctx, 'Signal trace', w * 0.14, h * 0.31);
              // Return current arrow
              ctx.strokeStyle = '#5a9edf';
              ctx.lineWidth = 2;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(w * 0.8, h * 0.64);
              ctx.lineTo(w * 0.2, h * 0.64);
              ctx.stroke();
              ctx.setLineDash([]);
              // arrowhead
              ctx.fillStyle = '#5a9edf';
              ctx.beginPath();
              ctx.moveTo(w * 0.2, h * 0.64);
              ctx.lineTo(w * 0.25, h * 0.59);
              ctx.lineTo(w * 0.25, h * 0.69);
              ctx.fill();
              drawLabel(ctx, 'Return I (opposite dir)', w * 0.3, h * 0.56);
            },
          },
        ],
      },
      {
        title: 'Split Plane Problem',
        description: 'A gap in the reference plane forces return current to detour around the split, creating a large EMI-radiating loop.',
        patterns: [
          {
            label: 'Bad: split plane',
            draw(ctx, w, h) {
              // Left half of plane
              ctx.fillStyle = COPPER_BAD;
              ctx.fillRect(w * 0.1, h * 0.6, w * 0.35, 8);
              // Right half of plane
              ctx.fillStyle = COPPER_BAD;
              ctx.fillRect(w * 0.55, h * 0.6, w * 0.35, 8);
              // Gap
              drawLabel(ctx, 'Gap / split!', w * 0.38, h * 0.74);
              // Signal trace crossing the gap
              ctx.fillStyle = COPPER_GOOD;
              ctx.fillRect(w * 0.1, h * 0.35, w * 0.8, 6);
              // Large current loop
              ctx.strokeStyle = '#c04040';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(w * 0.8, h * 0.38);
              ctx.lineTo(w * 0.8, h * 0.64);
              ctx.lineTo(w * 0.55, h * 0.64);
              ctx.lineTo(w * 0.45, h * 0.64);
              ctx.lineTo(w * 0.1, h * 0.64);
              ctx.lineTo(w * 0.1, h * 0.38);
              ctx.stroke();
              ctx.setLineDash([]);
              drawLabel(ctx, 'Large EMI loop!', w * 0.25, h * 0.52);
            },
          },
          {
            label: 'Good: solid plane',
            draw(ctx, w, h) {
              ctx.fillStyle = COPPER_GOOD;
              ctx.fillRect(w * 0.1, h * 0.6, w * 0.8, 8);
              drawLabel(ctx, 'Solid GND plane', w * 0.14, h * 0.74);
              ctx.fillStyle = COPPER_GOOD;
              ctx.fillRect(w * 0.1, h * 0.35, w * 0.8, 6);
              drawLabel(ctx, 'Signal trace', w * 0.14, h * 0.31);
              drawLabel(ctx, 'Small loop ✓', w * 0.35, h * 0.52);
            },
          },
        ],
      },
    ],
  },
};

export default function TraceRoutingDemo() {
  const [activeMode, setActiveMode] = useState<Mode>('45deg');
  const [stepIdx, setStepIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const modeData = modes[activeMode];
  const step = modeData.steps[Math.min(stepIdx, modeData.steps.length - 1)];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const halfW = step.patterns.length > 1 ? W / 2 : W;

    ctx.clearRect(0, 0, W, H);

    step.patterns.forEach((pattern, i) => {
      const x = i * halfW;
      const w = halfW;

      // Background
      ctx.fillStyle = PCB_GREEN;
      ctx.fillRect(x, 0, w, H);

      // Divider
      if (i > 0) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Pattern label
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(pattern.label, x + 8, 16);

      // Draw the pattern in its half-canvas context
      ctx.save();
      ctx.translate(x, 0);
      pattern.draw(ctx, w, H);
      ctx.restore();
    });
  }, [activeMode, stepIdx, step]);

  function changeMode(m: Mode) {
    setActiveMode(m);
    setStepIdx(0);
  }

  function changeStep(delta: number) {
    setStepIdx(prev => Math.max(0, Math.min(modeData.steps.length - 1, prev + delta)));
  }

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {(Object.keys(modes) as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '3px',
              border: activeMode === m ? '1px solid var(--color-copper)' : '1px solid var(--color-border)',
              background: activeMode === m ? 'color-mix(in srgb, var(--color-copper) 12%, transparent)' : 'var(--color-bg)',
              color: activeMode === m ? 'var(--color-copper)' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {modes[m].title}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={560}
        height={200}
        style={{ maxWidth: '100%', display: 'block', borderRadius: '4px', border: '1px solid var(--color-border)' }}
      />

      {/* Step info */}
      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-grid)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text)' }}>
          {step.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {step.description}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
        <button
          onClick={() => changeStep(-1)}
          disabled={stepIdx === 0}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '3px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: stepIdx === 0 ? 'var(--color-text-muted)' : 'var(--color-text)', cursor: stepIdx === 0 ? 'default' : 'pointer', opacity: stepIdx === 0 ? 0.4 : 1 }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          {stepIdx + 1} / {modeData.steps.length}
        </span>
        <button
          onClick={() => changeStep(1)}
          disabled={stepIdx === modeData.steps.length - 1}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '3px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: stepIdx === modeData.steps.length - 1 ? 'var(--color-text-muted)' : 'var(--color-text)', cursor: stepIdx === modeData.steps.length - 1 ? 'default' : 'pointer', opacity: stepIdx === modeData.steps.length - 1 ? 0.4 : 1 }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
