// PowerFlowSimulator.tsx — main power systems analysis island.
// client:visible hydration.
import { useState, useCallback, useMemo } from 'react';
import type {
  PowerNetwork, PowerFlowResults, FaultResult, FaultType,
} from '../../../lib/power/types.js';
import { solveNewtonRaphson } from '../../../lib/power/newton-raphson.js';
import { computeFault } from '../../../lib/power/fault-analysis.js';
import {
  resultsToBusCSV, resultsToLineCSV, faultToCSV, downloadText,
} from '../../../lib/power/export.js';
import SingleLineDiagram from './SingleLineDiagram.js';
import BusInspector from './BusInspector.js';
import VoltageProfileChart from './VoltageProfileChart.js';

interface Props {
  network: PowerNetwork;
  mode?: 'normal' | 'fault' | 'contingency';
  faultBus?: number;
}

type RunState = 'idle' | 'running' | 'converged' | 'diverged' | 'error';

const FAULT_TYPES: { value: FaultType; label: string }[] = [
  { value: '3-phase', label: '3-phase (3φ)' },
  { value: 'L-G',     label: 'Line-to-Ground (L-G)' },
  { value: 'L-L',     label: 'Line-to-Line (L-L)' },
  { value: 'L-L-G',   label: 'Double L-G (L-L-G)' },
];

export default function PowerFlowSimulator({ network, mode = 'normal', faultBus }: Props) {
  const [runState, setRunState] = useState<RunState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults]   = useState<PowerFlowResults | null>(null);
  const [fault, setFault]       = useState<FaultResult | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [activeFaultBus, setActiveFaultBus] = useState<number | null>(null);

  // Fault controls
  const [faultType, setFaultType] = useState<FaultType>('3-phase');
  const [selectedFaultBus, setSelectedFaultBus] = useState<number>(
    faultBus ?? network.buses[network.buses.length - 1].id,
  );
  const [zfPU, setZfPU] = useState<number>(0);
  const [z0Ratio, setZ0Ratio] = useState<number>(3.0);

  // Contingency: line/transformer outage
  const [outageId, setOutageId] = useState<string>('');

  // Apply outage by zeroing the branch (very high impedance) for the analysis.
  const workingNetwork = useMemo(() => {
    if (mode !== 'contingency' || !outageId) return network;
    return {
      ...network,
      lines: network.lines.filter(l => l.id !== outageId),
      transformers: network.transformers.filter(t => t.id !== outageId),
    };
  }, [network, mode, outageId]);

  const runPowerFlow = useCallback(() => {
    setRunState('running');
    setErrorMsg(null);
    try {
      const r = solveNewtonRaphson(workingNetwork);
      setResults(r);
      setFault(null);
      setActiveFaultBus(null);
      setRunState(r.converged ? 'converged' : 'diverged');

      if (mode === 'fault' && r.converged) {
        const prefaultVmag = new Map(r.buses.map(b => [b.busId, b.Vmag]));
        const fr = computeFault(workingNetwork, selectedFaultBus, prefaultVmag, {
          faultType, zfPU, z0PerZ1Ratio: z0Ratio,
        });
        setFault(fr);
        setActiveFaultBus(selectedFaultBus);
      }
    } catch (e) {
      setRunState('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }, [workingNetwork, mode, selectedFaultBus, faultType, zfPU, z0Ratio]);

  const reset = useCallback(() => {
    setRunState('idle');
    setErrorMsg(null);
    setResults(null);
    setFault(null);
    setSelectedBusId(null);
    setActiveFaultBus(null);
  }, []);

  const exportBuses = useCallback(() => {
    if (!results) return;
    downloadText(
      `${network.id}-bus-results.csv`,
      resultsToBusCSV(network, results),
    );
  }, [results, network]);

  const exportLines = useCallback(() => {
    if (!results) return;
    downloadText(
      `${network.id}-line-results.csv`,
      resultsToLineCSV(network, results),
    );
  }, [results, network]);

  const exportFault = useCallback(() => {
    if (!fault) return;
    downloadText(
      `${network.id}-fault-bus${fault.faultBusId}.csv`,
      faultToCSV(network, fault),
    );
  }, [fault, network]);

  const exportJSON = useCallback(() => {
    if (!results) return;
    const payload = {
      network: network.id,
      timestamp: new Date().toISOString(),
      results,
      fault,
    };
    downloadText(
      `${network.id}-results.json`,
      JSON.stringify(payload, null, 2),
    );
  }, [results, fault, network]);

  const selectedBus    = selectedBusId !== null
    ? network.buses.find(b => b.id === selectedBusId) : null;
  const selectedResult = selectedBusId !== null
    ? results?.buses.find(b => b.busId === selectedBusId) : null;

  const statusColor = runState === 'converged' ? '#22c55e'
    : runState === 'diverged' ? '#ef4444'
    : runState === 'error'    ? '#ef4444'
    : 'var(--color-text-muted)';

  const statusText = runState === 'error'
    ? `Error: ${errorMsg}`
    : runState === 'converged'
    ? `Converged in ${results?.iterations} iterations (max mismatch: ${results?.maxMismatch.toExponential(2)} pu)`
    : runState === 'diverged'
    ? 'Did not converge — check network connectivity and loading.'
    : runState === 'running'
    ? 'Running…'
    : 'Press "Run Power Flow" to solve.';

  const allBranches = [
    ...network.lines.map(l => ({ id: l.id, label: l.id, kind: 'line' as const })),
    ...network.transformers.map(t => ({ id: t.id, label: `${t.id} (xfmr)`, kind: 'xfmr' as const })),
  ];

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Top toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={runPowerFlow}
          style={{
            background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 4, padding: '6px 16px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600,
          }}
        >
          {mode === 'fault' ? '⚡ Run Power Flow + Fault'
            : mode === 'contingency' ? '▶ Run Contingency'
            : '▶ Run Power Flow'}
        </button>
        <button
          onClick={reset}
          style={{
            background: 'none', color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)', borderRadius: 4,
            padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
          }}
        >Reset</button>
        <span style={{ color: statusColor, fontSize: '0.76rem' }}>{statusText}</span>
      </div>

      {/* Mode-specific controls */}
      {mode === 'fault' && (
        <div className="pf-controls">
          <label>
            Bus
            <select
              value={selectedFaultBus}
              onChange={e => setSelectedFaultBus(Number(e.target.value))}
            >
              {network.buses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={faultType} onChange={e => setFaultType(e.target.value as FaultType)}>
              {FAULT_TYPES.map(ft => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </label>
          <label>
            Zf (pu)
            <input
              type="number" step="0.001" min="0" value={zfPU}
              onChange={e => setZfPU(Math.max(0, Number(e.target.value)))}
            />
          </label>
          <label title="Zero-sequence to positive-sequence Thevenin impedance ratio">
            Z₀/Z₁
            <input
              type="number" step="0.1" min="0.1" value={z0Ratio}
              onChange={e => setZ0Ratio(Math.max(0.1, Number(e.target.value)))}
            />
          </label>
        </div>
      )}

      {mode === 'contingency' && (
        <div className="pf-controls">
          <label>
            Outage
            <select value={outageId} onChange={e => setOutageId(e.target.value)}>
              <option value="">(none — base case)</option>
              {allBranches.map(br => (
                <option key={br.id} value={br.id}>{br.label}</option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Removes the selected branch and re-solves the power flow (N-1 screening).
          </span>
        </div>
      )}

      {results && runState === 'converged' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <ExportBtn onClick={exportBuses}>⤓ Bus CSV</ExportBtn>
          <ExportBtn onClick={exportLines}>⤓ Line CSV</ExportBtn>
          {fault && <ExportBtn onClick={exportFault}>⤓ Fault CSV</ExportBtn>}
          <ExportBtn onClick={exportJSON}>⤓ JSON</ExportBtn>
        </div>
      )}

      {/* Main layout: diagram left, charts + inspector right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px,1fr) minmax(220px,340px)',
        gap: 14,
      }}>
        <div>
          <SingleLineDiagram
            network={workingNetwork}
            results={results}
            selectedBusId={selectedBusId}
            onBusClick={id => setSelectedBusId(prev => prev === id ? null : id)}
            faultBusId={activeFaultBus ?? undefined}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results && (
            <VoltageProfileChart
              buses={workingNetwork.buses}
              results={results.buses}
              baseMVA={workingNetwork.baseMVA}
            />
          )}

          {selectedBus && selectedResult && (
            <BusInspector
              bus={selectedBus}
              result={selectedResult}
              baseMVA={workingNetwork.baseMVA}
              onClose={() => setSelectedBusId(null)}
            />
          )}

          {fault && <FaultPanel fault={fault} />}

          {results?.converged && !selectedBus && !fault && (
            <SummaryPanel results={results} baseMVA={workingNetwork.baseMVA} />
          )}
        </div>
      </div>

      <style>{`
        .pf-controls {
          display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
          margin-bottom: 10px; padding: 8px 10px;
          border: 1px solid var(--color-border); border-radius: 4px;
          background: var(--color-bg-grid);
        }
        .pf-controls label {
          display: flex; flex-direction: column; gap: 2px;
          font-size: 0.7rem; color: var(--color-text-muted);
        }
        .pf-controls select, .pf-controls input {
          font-family: var(--font-mono); font-size: 0.78rem;
          background: var(--color-bg); color: var(--color-text);
          border: 1px solid var(--color-border); border-radius: 3px;
          padding: 3px 6px; min-width: 80px;
        }
      `}</style>
    </div>
  );
}

function ExportBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', color: 'var(--color-text-muted)',
        border: '1px solid var(--color-border)', borderRadius: 4,
        padding: '3px 9px', cursor: 'pointer',
        fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
      }}
    >{children}</button>
  );
}

// ── Sub-panels ─────────────────────────────────────────────────────────────────

function FaultPanel({ fault }: { fault: FaultResult }) {
  const phaseLabel: Record<FaultType, string> = {
    '3-phase': '3-phase symmetrical',
    'L-G':     'Single L-G (phase A)',
    'L-L':     'L-L (phases B-C)',
    'L-L-G':   'Double L-G (phases B-C-G)',
  };
  return (
    <div style={{
      border: '1px solid #ef4444', borderRadius: 6,
      padding: '10px 14px', background: 'rgba(239,68,68,0.06)',
    }}>
      <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>
        ⚡ {phaseLabel[fault.faultType]} at Bus {fault.faultBusId}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.78rem' }}>
        <tbody>
          <FRow label="Pre-fault V₀"   value={fault.Vprefault.toFixed(4)} unit="pu" />
          <FRow label="|Z₁| Thevenin"  value={fault.Z1mag.toFixed(4)} unit="pu" />
          <FRow label="|Z₂|"           value={fault.Z2mag.toFixed(4)} unit="pu" />
          <FRow label="|Z₀|"           value={fault.Z0mag.toFixed(4)} unit="pu" />
          {fault.ZfMag > 0 && (
            <FRow label="Zf (fault Z)" value={fault.ZfMag.toFixed(4)} unit="pu" />
          )}
        </tbody>
      </table>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 4 }}>
        Phase fault currents
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.78rem' }}>
        <tbody>
          <PhaseRow label="Iₐ" cur={fault.Ia} />
          <PhaseRow label="I_b" cur={fault.Ib} />
          <PhaseRow label="I_c" cur={fault.Ic} />
          <PhaseRow label="Iₘₐₓ" cur={fault.Imax} highlight />
        </tbody>
      </table>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: 6 }}>
        Sequence-component method (educational; assumes Z₂ ≈ Z₁ unless overridden).
      </div>
    </div>
  );
}

function PhaseRow({ label, cur, highlight }: {
  label: string;
  cur: { pu: number; kA: number };
  highlight?: boolean;
}) {
  const color = highlight ? '#ef4444' : 'var(--color-text)';
  return (
    <tr>
      <td style={{ color: 'var(--color-text-muted)', paddingRight: 8 }}>{label}</td>
      <td style={{ color, fontWeight: highlight ? 600 : 400 }}>{cur.pu.toFixed(3)}</td>
      <td style={{ color: 'var(--color-text-muted)', paddingLeft: 4, paddingRight: 8 }}>pu</td>
      <td style={{ color, fontWeight: highlight ? 600 : 400 }}>{cur.kA.toFixed(3)}</td>
      <td style={{ color: 'var(--color-text-muted)', paddingLeft: 4 }}>kA</td>
    </tr>
  );
}

function FRow({ label, value, unit, highlight }: {
  label: string; value: string; unit: string; highlight?: boolean;
}) {
  return (
    <tr>
      <td style={{ color: 'var(--color-text-muted)', paddingRight: 8, paddingBottom: 3 }}>{label}</td>
      <td style={{ color: highlight ? '#ef4444' : 'var(--color-text)', fontWeight: highlight ? 600 : 400 }}>
        {value}
      </td>
      <td style={{ color: 'var(--color-text-muted)', paddingLeft: 4 }}>{unit}</td>
    </tr>
  );
}

function SummaryPanel({ results, baseMVA }: { results: PowerFlowResults; baseMVA: number }) {
  const lossMW = (results.totalLossP * baseMVA).toFixed(2);
  const lossPercent = results.totalLoadP > 0
    ? ((results.totalLossP / results.totalLoadP) * 100).toFixed(1)
    : '—';

  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 6,
      padding: '10px 14px', fontSize: '0.78rem',
    }}>
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>System Summary</div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <FRow label="Total load P"  value={(results.totalLoadP  * baseMVA).toFixed(1)} unit="MW"  />
          <FRow label="Total load Q"  value={(results.totalLoadQ  * baseMVA).toFixed(1)} unit="MVAr" />
          <FRow label="System losses" value={lossMW} unit={`MW (${lossPercent}%)`} />
          <FRow label="Max bus V"
            value={Math.max(...results.buses.map(b => b.Vmag)).toFixed(4)} unit="pu" />
          <FRow label="Min bus V"
            value={Math.min(...results.buses.map(b => b.Vmag)).toFixed(4)} unit="pu" />
        </tbody>
      </table>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: 6 }}>
        Click a bus in the diagram to inspect its V, θ, P, Q.
      </div>
    </div>
  );
}
