// ConvergenceChart.tsx — SVG log-scale line chart comparing GS vs NR convergence.
import { useState } from 'react';
import { solveNewtonRaphson } from '../../../lib/power/newton-raphson.js';
import { solveGaussSeidel } from '../../../lib/power/gauss-seidel.js';
import type { PowerNetwork } from '../../../lib/power/types.js';

interface Props {
  network: PowerNetwork;
}

const W = 560, H = 280;
const PAD = { left: 52, right: 16, top: 14, bottom: 36 };

export default function ConvergenceChart({ network }: Props) {
  const [nrHist, setNrHist] = useState<number[]>([]);
  const [gsHist, setGsHist] = useState<number[]>([]);
  const [ran, setRan] = useState(false);
  const [nrIter, setNrIter] = useState(0);
  const [gsIter, setGsIter] = useState(0);

  function runBoth() {
    const nr = solveNewtonRaphson(network);
    const gs = solveGaussSeidel(network);
    setNrHist(nr.mismatchHistory);
    setGsHist(gs.mismatchHistory);
    setNrIter(nr.iterations);
    setGsIter(gs.iterations);
    setRan(true);
  }

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Log scale: clamp mismatch values to [1e-10, 10]
  const LOG_MIN = -8, LOG_MAX = 0; // log10 range
  const logScale = (v: number) => {
    const lv = Math.log10(Math.max(1e-12, v));
    return PAD.top + plotH * (1 - (lv - LOG_MIN) / (LOG_MAX - LOG_MIN));
  };

  const maxIter = Math.max(nrHist.length, gsHist.length, 1);
  const xScale = (i: number) => PAD.left + (i / Math.max(maxIter - 1, 1)) * plotW;

  function polyline(hist: number[]): string {
    if (!hist.length) return '';
    return hist.map((v, i) => `${xScale(i)},${logScale(v)}`).join(' ');
  }

  const yTicks = [0, -1, -2, -3, -4, -5, -6, -7, -8];

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={runBoth}
          style={{
            background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
          }}
        >
          Run Both Solvers
        </button>
        {ran && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
            NR: {nrIter} iterations · GS: {gsIter} iterations
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, display: 'block', overflow: 'visible' }}
      >
        {/* Grid */}
        {yTicks.map(log10 => {
          const y = logScale(Math.pow(10, log10));
          return (
            <g key={log10}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y} y2={y}
                stroke="var(--color-border)" strokeWidth={0.5} />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end"
                fontSize={8} fill="var(--color-text-muted)">
                10{superscript(log10)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + plotH}
          stroke="var(--color-border)" strokeWidth={1} />
        <line x1={PAD.left} x2={PAD.left + plotW} y1={PAD.top + plotH} y2={PAD.top + plotH}
          stroke="var(--color-border)" strokeWidth={1} />

        {/* Convergence tolerance line */}
        {(() => {
          const y = logScale(1e-4);
          return (
            <>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y} y2={y}
                stroke="#6b7280" strokeWidth={0.8} strokeDasharray="4 2" />
              <text x={PAD.left + plotW - 2} y={y - 3} textAnchor="end"
                fontSize={7} fill="#6b7280">GS tol</text>
            </>
          );
        })()}

        {/* NR curve (blue) */}
        {nrHist.length > 1 && (
          <polyline
            points={polyline(nrHist)}
            fill="none" stroke="#2563eb" strokeWidth={2}
          />
        )}
        {nrHist.map((v, i) => (
          <circle key={i} cx={xScale(i)} cy={logScale(v)} r={3}
            fill="#2563eb" />
        ))}

        {/* GS curve (orange) */}
        {gsHist.length > 1 && (
          <polyline
            points={polyline(gsHist)}
            fill="none" stroke="#f97316" strokeWidth={2}
          />
        )}
        {gsHist.length <= 40 && gsHist.map((v, i) => (
          <circle key={i} cx={xScale(i)} cy={logScale(v)} r={2.5}
            fill="#f97316" />
        ))}

        {/* X-axis labels (iteration numbers) */}
        {Array.from({ length: Math.min(maxIter, 8) }, (_, k) => {
          const i = Math.round((k / 7) * (maxIter - 1));
          return (
            <text key={k} x={xScale(i)} y={PAD.top + plotH + 14}
              textAnchor="middle" fontSize={8} fill="var(--color-text-muted)">
              {i}
            </text>
          );
        })}

        {/* Axis labels */}
        <text x={PAD.left + plotW / 2} y={H - 4} textAnchor="middle"
          fontSize={9} fill="var(--color-text-muted)">Iteration</text>
        <text
          transform={`rotate(-90) translate(${-(PAD.top + plotH / 2)},12)`}
          textAnchor="middle" fontSize={9} fill="var(--color-text-muted)">
          Max mismatch (pu)
        </text>

        {/* Legend */}
        <rect x={PAD.left + 10} y={PAD.top + 6} width={10} height={3} fill="#2563eb" />
        <text x={PAD.left + 24} y={PAD.top + 10} fontSize={8} fill="#2563eb">
          Newton-Raphson
        </text>
        <rect x={PAD.left + 10} y={PAD.top + 16} width={10} height={3} fill="#f97316" />
        <text x={PAD.left + 24} y={PAD.top + 20} fontSize={8} fill="#f97316">
          Gauss-Seidel
        </text>

        {!ran && (
          <text x={PAD.left + plotW / 2} y={PAD.top + plotH / 2}
            textAnchor="middle" fontSize={11} fill="var(--color-text-muted)">
            Click "Run Both Solvers" to compare convergence
          </text>
        )}
      </svg>
    </div>
  );
}

function superscript(n: number): string {
  const map: Record<string, string> = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴',
    '5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻',
  };
  return String(n).split('').map(c => map[c] ?? c).join('');
}
