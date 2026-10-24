// CapabilityChart.tsx — reactive capability envelopes drawn from the codes:
// the Irish/NI PPM P–Q shape and the synchronous condenser U–Q rectangles.
// Only corner points stated in the clauses are drawn solid; anything the
// code leaves to its own figure is dashed and labelled.

import { useState } from 'react';
import { qOverPAtPf } from '../../lib/field-guide/curves';
import { Axes, ChartBox, Toggle, polyline, scales, panelStyle, type Frame } from './chart-kit';

const PQ: Frame = { W: 640, H: 300, L: 58, R: 12, T: 14, B: 32, x0: -0.5, x1: 0.5, y0: 0, y1: 1.1 };
const UQ: Frame = { W: 640, H: 300, L: 64, R: 12, T: 14, B: 32, x0: -0.6, x1: 1.0, y0: 0.85, y1: 1.15 };

const SCU_BOXES = [
  { id: 'ie110', label: 'IE 110 kV', tone: 'var(--fg-ie)', q0: -0.4, q1: 0.8, u0: 0.9, u1: 1.118, ref: 'SCU1.4.6 / SCU1.4.1(f)' },
  { id: 'ie220', label: 'IE 220 kV', tone: 'var(--fg-ie)', q0: -0.4, q1: 0.8, u0: 0.9, u1: 1.114, ref: 'SCU1.4.6 / SCU1.4.1(f)' },
  { id: 'ie400', label: 'IE 400 kV', tone: 'var(--fg-ie)', q0: -0.4, q1: 0.8, u0: 0.9, u1: 1.05, ref: 'SCU1.4.6 / SCU1.4.1(f)' },
  { id: 'ni110', label: 'NI 110/275 kV', tone: 'var(--fg-ni)', q0: -0.4, q1: 0.8, u0: 0.9, u1: 1.1, ref: 'CC.S4.1.3.2 chart' },
  { id: 'ni400', label: 'NI 400 kV', tone: 'var(--fg-ni)', q0: -0.4, q1: 0.8, u0: 0.875, u1: 1.05, ref: 'CC.S4.1.3.2 chart' },
];

export default function CapabilityChart() {
  const [tab, setTab] = useState('pq');
  const [box, setBox] = useState('ie110');

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 8 }}>
        <Toggle label="Envelope" value={tab} onChange={setTab} options={[
          { id: 'pq', label: 'PPM P–Q (IE / NI shape)' },
          { id: 'uq', label: 'SynCon U–Q' },
        ]} />
      </div>
      {tab === 'pq' ? <PqChart /> : (
        <>
          <UqChart selected={box} />
          <div style={{ marginTop: 8 }}>
            <Toggle label="Voltage level" value={box} onChange={setBox}
              options={SCU_BOXES.map(b => ({ id: b.id, label: b.label }))} />
          </div>
        </>
      )}
    </div>
  );
}

function PqChart() {
  const { x, y } = scales(PQ);
  const q = 0.33;
  const gbQ = qOverPAtPf(0.95);
  const solid = [
    { x: x(-q), y: y(0.12) }, { x: x(-q), y: y(1) }, { x: x(q), y: y(1) }, { x: x(q), y: y(0.12) },
  ];
  return (
    <>
      <ChartBox label="Power park module reactive capability envelope">
        <svg viewBox={`0 0 ${PQ.W} ${PQ.H}`} className="fg-svg">
          <Axes f={PQ} xTicks={[-0.5, -0.33, 0, 0.33, 0.5]} yTicks={[0, 0.12, 0.5, 1]}
            xLabel="Q / Pmax  (− absorb · + export)" yLabel="P / Registered Capacity" xFmt={v => v.toFixed(2)} yFmt={v => v.toFixed(2)} />
          <path d={`${polyline(solid)}`} fill="var(--fg-ie)" fillOpacity={0.1} stroke="var(--fg-ie)" strokeWidth={2.2} />
          <path d={polyline([{ x: x(-q), y: y(0.12) }, { x: x(0), y: y(0.02) }, { x: x(q), y: y(0.12) }])}
            fill="none" stroke="var(--fg-ie)" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={x(0)} y={y(0.06)} textAnchor="middle" fontSize={10} fill="var(--color-text-muted)">to E/F at cut-in — see the code&apos;s figure</text>
          <text x={x(q) + 4} y={y(1) - 4} fontSize={11} fill="var(--fg-ie)">A</text>
          <text x={x(-q) - 12} y={y(1) - 4} fontSize={11} fill="var(--fg-ie)">B</text>
          <text x={x(q) + 4} y={y(0.12) - 4} fontSize={11} fill="var(--fg-ie)">C</text>
          <text x={x(-q) - 12} y={y(0.12) - 4} fontSize={11} fill="var(--fg-ie)">D</text>
          <circle cx={x(gbQ)} cy={y(1)} r={4} fill="var(--fg-gb)" />
          <circle cx={x(-gbQ)} cy={y(1)} r={4} fill="var(--fg-gb)" />
          <text x={x(0)} y={y(1) - 8} textAnchor="middle" fontSize={10} fill="var(--fg-gb)">GB Type B: 0.95 pf at Maximum Capacity</text>
        </svg>
      </ChartBox>
      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '8px 0 0' }}>
        Green: EirGrid PPM1.6.3 / SONI CC.S2.1.3.2 — ±0.33 Q/Pmax at Registered Capacity (A/B), the same MVAr down to 12% (C/D),
        measured at the connection point. Blue dots: GB Type B at full output (ECC.6.3.2.1–.2.2). GB Type C/D PPMs follow Figure
        ECC.6.3.2.4(a)/(b), not drawn here.
      </p>
    </>
  );
}

function UqChart({ selected }: { selected: string }) {
  const { x, y } = scales(UQ);
  return (
    <>
      <ChartBox label="Synchronous condenser voltage–reactive capability">
        <svg viewBox={`0 0 ${UQ.W} ${UQ.H}`} className="fg-svg">
          <Axes f={UQ} xTicks={[-0.4, 0, 0.4, 0.8]} yTicks={[0.875, 0.9, 1, 1.1]}
            xLabel="Q / MVA rating  (− absorb · + produce)" yLabel="voltage (pu)" xFmt={v => v.toFixed(1)} yFmt={v => v.toFixed(3)} />
          {SCU_BOXES.map(b => {
            const on = b.id === selected;
            return (
              <rect key={b.id} x={x(b.q0)} y={y(b.u1)} width={x(b.q1) - x(b.q0)} height={y(b.u0) - y(b.u1)}
                fill={on ? b.tone : 'none'} fillOpacity={on ? 0.12 : 0} stroke={b.tone}
                strokeWidth={on ? 2.4 : 1} strokeOpacity={on ? 1 : 0.35} />
            );
          })}
          {SCU_BOXES.filter(b => b.id === selected).map(b => (
            <g key="lab" fontSize={11}>
              <text x={x(b.q1) - 4} y={y(b.u1) - 4} textAnchor="end" fill={b.tone}>{b.label}: {b.u0}–{b.u1} pu</text>
              <text x={x(b.q0)} y={y(b.u0) + 12} fill={b.tone}>{b.q0}</text>
              <text x={x(b.q1)} y={y(b.u0) + 12} textAnchor="end" fill={b.tone}>+{b.q1}</text>
            </g>
          ))}
        </svg>
      </ChartBox>
      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '8px 0 0' }}>
        {SCU_BOXES.find(b => b.id === selected)?.ref}. Producing 0.8 × MVA, absorbing 0.4 × MVA, held across the whole
        continuous voltage range — so the machine and transformer must be sized for the corners, not the middle.
      </p>
    </>
  );
}
