// VoltageProfileChart.tsx — SVG bar chart showing per-bus voltage magnitudes.
// No chart library — pure React SVG.
import type { BusResult, Bus } from '../../../lib/power/types.js';

interface Props {
  buses: Bus[];
  results: BusResult[];
  baseMVA: number;
}

const CHART_W = 520;
const CHART_H = 180;
const PAD_LEFT = 44;
const PAD_BOT  = 28;
const PAD_TOP  = 14;
const PAD_RIGHT = 10;

const VMIN = 0.90;
const VMAX = 1.12;
const LIM_LO = 0.95;
const LIM_HI = 1.05;

function voltColor(v: number): string {
  if (v < 0.90 || v > 1.10) return '#ef4444';
  if (v < 0.95 || v > 1.05) return '#f97316';
  return '#22c55e';
}

export default function VoltageProfileChart({ buses, results, baseMVA: _baseMVA }: Props) {
  if (!results.length) return null;

  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_BOT - PAD_TOP;
  const n = results.length;
  const barW = Math.min(32, plotW / n - 4);

  const yScale = (v: number) =>
    PAD_TOP + plotH * (1 - (v - VMIN) / (VMAX - VMIN));

  const xForIdx = (i: number) =>
    PAD_LEFT + (i + 0.5) * (plotW / n);

  // Y-axis ticks
  const ticks = [0.90, 0.95, 1.00, 1.05, 1.10];

  // Limit lines
  const yLo = yScale(LIM_LO);
  const yHi = yScale(LIM_HI);

  return (
    <div style={{ fontFamily: 'var(--font-mono)' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        Voltage Profile (pu)
      </div>
      <svg
        width={CHART_W}
        height={CHART_H}
        style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      >
        {/* Limit bands */}
        <rect
          x={PAD_LEFT} y={PAD_TOP}
          width={plotW} height={Math.max(0, yLo - PAD_TOP)}
          fill="#f9731620" stroke="none"
        />
        <rect
          x={PAD_LEFT} y={yHi}
          width={plotW} height={Math.max(0, PAD_TOP + plotH - yHi)}
          fill="#f9731620" stroke="none"
        />

        {/* Limit lines */}
        <line x1={PAD_LEFT} x2={PAD_LEFT + plotW} y1={yLo} y2={yLo}
          stroke="#f97316" strokeWidth={1} strokeDasharray="4 2" />
        <line x1={PAD_LEFT} x2={PAD_LEFT + plotW} y1={yHi} y2={yHi}
          stroke="#f97316" strokeWidth={1} strokeDasharray="4 2" />
        <text x={PAD_LEFT + plotW + 2} y={yLo + 4} fontSize={8}
          fill="#f97316">0.95</text>
        <text x={PAD_LEFT + plotW + 2} y={yHi + 4} fontSize={8}
          fill="#f97316">1.05</text>

        {/* Y-axis ticks and labels */}
        {ticks.map(v => {
          const y = yScale(v);
          return (
            <g key={v}>
              <line x1={PAD_LEFT - 4} x2={PAD_LEFT} y1={y} y2={y}
                stroke="var(--color-border)" strokeWidth={1} />
              <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end"
                fontSize={9} fill="var(--color-text-muted)">{v.toFixed(2)}</text>
              <line x1={PAD_LEFT} x2={PAD_LEFT + plotW} y1={y} y2={y}
                stroke="var(--color-border)" strokeWidth={0.5} strokeOpacity={0.4} />
            </g>
          );
        })}

        {/* Axes */}
        <line x1={PAD_LEFT} x2={PAD_LEFT} y1={PAD_TOP} y2={PAD_TOP + plotH}
          stroke="var(--color-border)" strokeWidth={1} />
        <line x1={PAD_LEFT} x2={PAD_LEFT + plotW} y1={PAD_TOP + plotH} y2={PAD_TOP + plotH}
          stroke="var(--color-border)" strokeWidth={1} />

        {/* Bars */}
        {results.map((r, i) => {
          const cx = xForIdx(i);
          const barTop = yScale(Math.max(VMIN, Math.min(VMAX, r.Vmag)));
          const barBot = yScale(1.0); // reference at 1.0 pu
          const barH = Math.abs(barBot - barTop);
          const color = voltColor(r.Vmag);
          const busName = buses.find(b => b.id === r.busId)?.name ?? `Bus ${r.busId}`;

          return (
            <g key={r.busId}>
              <rect
                x={cx - barW / 2}
                y={r.Vmag >= 1.0 ? barTop : barBot}
                width={barW}
                height={Math.max(1, barH)}
                fill={color}
                fillOpacity={0.8}
                rx={2}
              >
                <title>{busName}: {r.Vmag.toFixed(4)} pu</title>
              </rect>
              {/* Bus ID label */}
              <text x={cx} y={PAD_TOP + plotH + 14} textAnchor="middle"
                fontSize={8} fill="var(--color-text-muted)">
                {r.busId}
              </text>
              {/* Value label on bar */}
              {barW > 14 && (
                <text
                  x={cx}
                  y={r.Vmag >= 1.0 ? barTop - 2 : barTop + 10}
                  textAnchor="middle"
                  fontSize={7}
                  fill={color}
                >
                  {r.Vmag.toFixed(3)}
                </text>
              )}
            </g>
          );
        })}

        {/* 1.0 pu reference line */}
        <line x1={PAD_LEFT} x2={PAD_LEFT + plotW} y1={yScale(1.0)} y2={yScale(1.0)}
          stroke="var(--color-text-muted)" strokeWidth={1} strokeDasharray="2 2" />
        <text x={PAD_LEFT - 6} y={yScale(1.0) + 4} textAnchor="end"
          fontSize={9} fontWeight="600" fill="var(--color-text-muted)">1.00</text>

        {/* X-axis label */}
        <text x={PAD_LEFT + plotW / 2} y={CHART_H} textAnchor="middle"
          fontSize={9} fill="var(--color-text-muted)">Bus number</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
        <span><span style={{ color: '#22c55e' }}>■</span> Normal (0.95–1.05 pu)</span>
        <span><span style={{ color: '#f97316' }}>■</span> Warning (±10%)</span>
        <span><span style={{ color: '#ef4444' }}>■</span> Violation (&gt;±10%)</span>
      </div>
    </div>
  );
}
