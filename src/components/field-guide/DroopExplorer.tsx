// DroopExplorer.tsx — what droop, thresholds and deadbands mean in MW.
// LFSM tab: GB vs IE vs NI emergency response. FSM tab: continuous droop with
// the "measure from the deadband edge or from 50 Hz" choice made visible.

import { useState } from 'react';
import { LFSM_SETTINGS, lfsmResponse, fsmResponse, droopResponse, type Jurisdiction } from '../../lib/field-guide/curves';
import { Axes, ChartBox, Slider, Toggle, TONE, polyline, scales, panelStyle, type Frame } from './chart-kit';

const F: Frame = { W: 640, H: 300, L: 48, R: 12, T: 14, B: 32, x0: 49, x1: 51, y0: -0.4, y1: 0.4 };
const clampY = (v: number) => Math.max(F.y0, Math.min(F.y1, v));
const pct = (v: number) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`;

export default function DroopExplorer() {
  const [tab, setTab] = useState('lfsm');
  const [shown, setShown] = useState<Jurisdiction[]>(['GB', 'IE', 'NI']);
  const [ieDroop, setIeDroop] = useState(4);
  const [fsmDroop, setFsmDroop] = useState(4);
  const [db, setDb] = useState(0.015);
  const [f, setF] = useState(50.35);
  const [mw, setMw] = useState(100);
  const { x, y } = scales(F);

  const freqs: number[] = [];
  for (let v = F.x0; v <= F.x1 + 1e-9; v += 0.0025) freqs.push(Math.round(v * 10000) / 10000);

  const lfsmSeries = (['GB', 'IE', 'NI'] as Jurisdiction[]).filter(j => shown.includes(j)).map(j => {
    const o = LFSM_SETTINGS.find(s => s.jurisdiction === j && s.mode === 'LFSM-O')!;
    const u = LFSM_SETTINGS.find(s => s.jurisdiction === j && s.mode === 'LFSM-U')!;
    const droop = j === 'GB' ? o.droopPct : ieDroop;
    const at = (fr: number) => lfsmResponse(fr, o, droop) + lfsmResponse(fr, u, droop);
    return { j, droop, o, u, at };
  });

  const fsmEdge = (fr: number) => fsmResponse(fr, fsmDroop, db, 'edge');
  const fsmNominal = (fr: number) => fsmResponse(fr, fsmDroop, db, 'nominal');

  const path = (fn: (fr: number) => number) =>
    polyline(freqs.map(fr => ({ x: x(fr), y: y(clampY(fn(fr))) })));

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 8 }}>
        <Toggle label="Mode" value={tab} onChange={setTab} options={[
          { id: 'lfsm', label: 'LFSM-O / LFSM-U (emergency)' },
          { id: 'fsm', label: 'FSM (continuous)' },
        ]} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <ChartBox label="Active power change against frequency">
            <svg viewBox={`0 0 ${F.W} ${F.H}`} className="fg-svg">
              <Axes f={F} xTicks={[49, 49.5, 50, 50.5, 51]} yTicks={[-0.4, -0.2, 0, 0.2, 0.4]}
                xLabel="frequency (Hz)" yLabel="ΔP (% of droop base)" xFmt={v => v.toFixed(1)} yFmt={pct} />
              <line x1={x(50)} x2={x(50)} y1={F.T} y2={F.H - F.B} stroke="var(--color-text-muted)" strokeDasharray="2 3" />
              {tab === 'lfsm' && lfsmSeries.map(s => (
                <g key={s.j}>
                  <path d={path(s.at)} fill="none" stroke={TONE[s.j]} strokeWidth={2.2} />
                  <line x1={x(s.o.thresholdHz)} x2={x(s.o.thresholdHz)} y1={y(0) - 4} y2={y(0) + 4} stroke={TONE[s.j]} />
                  <text x={x(s.o.thresholdHz)} y={y(0) - 8} fontSize={10} textAnchor="middle" fill={TONE[s.j]}>
                    {s.j} {s.o.thresholdHz}
                  </text>
                </g>
              ))}
              {tab === 'fsm' && (
                <g>
                  <rect x={x(50 - db)} y={F.T} width={Math.max(1, x(50 + db) - x(50 - db))} height={F.H - F.T - F.B}
                    fill="var(--color-copper)" opacity={0.12} />
                  <path d={path(fsmEdge)} fill="none" stroke="var(--color-text-muted)" strokeWidth={2} strokeDasharray="6 4" />
                  <path d={path(fsmNominal)} fill="none" stroke={TONE.IE} strokeWidth={2.2} />
                </g>
              )}
              <line x1={x(f)} x2={x(f)} y1={F.T} y2={F.H - F.B} stroke="var(--color-text)" strokeWidth={1} opacity={0.6} />
            </svg>
          </ChartBox>

          <div style={{ marginTop: 8, fontSize: '0.72rem', lineHeight: 1.6 }}>
            At <strong>{f.toFixed(3)} Hz</strong> on a {mw} MW droop base:
            {tab === 'lfsm' ? (
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {lfsmSeries.map(s => (
                  <li key={s.j} style={{ color: TONE[s.j] }}>
                    {s.j} ({s.droop}% droop): {(s.at(f) * mw).toFixed(1)} MW
                  </li>
                ))}
              </ul>
            ) : (
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                <li style={{ color: TONE.IE }}>Measured from 50 Hz (EirGrid rule): {(fsmNominal(f) * mw).toFixed(2)} MW</li>
                <li style={{ color: 'var(--color-text-muted)' }}>Measured from deadband edge: {(fsmEdge(f) * mw).toFixed(2)} MW</li>
                <li>Gap once outside the deadband: {(droopResponse(db, fsmDroop) * mw).toFixed(2)} MW</li>
              </ul>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Slider label="Frequency" value={f} min={49} max={51} step={0.005} onChange={setF} fmt={v => `${v.toFixed(3)} Hz`} />
          <Slider label="Droop base (RC or Pmax)" value={mw} min={10} max={500} step={10} onChange={setMw} fmt={v => `${v} MW`} />
          {tab === 'lfsm' ? (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(['GB', 'IE', 'NI'] as Jurisdiction[]).map(j => (
                  <label key={j} style={{ display: 'flex', gap: 4, alignItems: 'center', color: TONE[j], fontSize: '0.72rem' }}>
                    <input type="checkbox" checked={shown.includes(j)}
                      onChange={() => setShown(s => (s.includes(j) ? s.filter(v => v !== j) : [...s, j]))} />
                    {j}
                  </label>
                ))}
              </div>
              <Slider label="IE / NI droop" value={ieDroop} min={2} max={12} step={0.5} onChange={setIeDroop}
                fmt={v => `${v}%`} hint="Settable 2–12%, default 4%. GB is fixed at 10%." />
              <p style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                GB: LFSM-O above 50.4 Hz, LFSM-U below 49.5 Hz (Type C/D). IE &amp; NI: 50.2 Hz and 49.5 Hz —
                their lines coincide at the same droop. LFSM-U needs headroom — a plant at full output cannot add more.
              </p>
            </>
          ) : (
            <>
              <Slider label="FSM droop" value={fsmDroop} min={2} max={12} step={0.5} onChange={setFsmDroop}
                fmt={v => `${v}%`} hint="GB 3–5% · IE default 4% · RfG range 2–12%" />
              <Slider label="Deadband (each side)" value={db} min={0} max={0.2} step={0.005} onChange={setDb}
                fmt={v => `±${Math.round(v * 1000)} mHz`} hint="GB 0 mHz · IE non-RfG ±15 mHz · RfG 0–500 mHz" />
              <p style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                Solid: deviation counted from 50 Hz once outside the deadband (EirGrid PPM1.5.3.1 note).
                Dashed: counted from the deadband edge, a common generic-model default. The step at the
                edge is the MW you lose if the model uses the wrong rule.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
