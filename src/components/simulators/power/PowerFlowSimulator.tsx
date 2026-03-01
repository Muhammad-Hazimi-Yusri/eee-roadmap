// PowerFlowSimulator.tsx — main power systems analysis island.
// client:visible hydration.
import { useState, useCallback } from 'react';
import type { PowerNetwork, PowerFlowResults, FaultResult } from '../../../lib/power/types.js';
import { solveNewtonRaphson } from '../../../lib/power/newton-raphson.js';
import { computeFault } from '../../../lib/power/fault-analysis.js';
import SingleLineDiagram from './SingleLineDiagram.js';
import BusInspector from './BusInspector.js';
import VoltageProfileChart from './VoltageProfileChart.js';

interface Props {
  network: PowerNetwork;
  mode?: 'normal' | 'fault';
  faultBus?: number;
}

type RunState = 'idle' | 'converged' | 'diverged';

export default function PowerFlowSimulator({ network, mode = 'normal', faultBus }: Props) {
  const [runState, setRunState]       = useState<RunState>('idle');
  const [results, setResults]         = useState<PowerFlowResults | null>(null);
  const [fault, setFault]             = useState<FaultResult | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [activeFaultBus, setActiveFaultBus] = useState<number | null>(null);

  const runPowerFlow = useCallback(() => {
    const r = solveNewtonRaphson(network);
    setResults(r);
    setRunState(r.converged ? 'converged' : 'diverged');
    setFault(null);
    setActiveFaultBus(null);

    if (mode === 'fault' && faultBus !== undefined && r.converged) {
      try {
        const prefaultVmag = new Map(r.buses.map(b => [b.busId, b.Vmag]));
        const fr = computeFault(network, faultBus, prefaultVmag);
        setFault(fr);
        setActiveFaultBus(faultBus);
      } catch (e) {
        console.error('Fault analysis failed:', e);
      }
    }
  }, [network, mode, faultBus]);

  const reset = useCallback(() => {
    setRunState('idle');
    setResults(null);
    setFault(null);
    setSelectedBusId(null);
    setActiveFaultBus(null);
  }, []);

  const selectedBus    = selectedBusId !== null
    ? network.buses.find(b => b.id === selectedBusId) : null;
  const selectedResult = selectedBusId !== null
    ? results?.buses.find(b => b.busId === selectedBusId) : null;

  const statusColor = runState === 'converged' ? '#22c55e'
    : runState === 'diverged' ? '#ef4444'
    : 'var(--color-text-muted)';

  const statusText = runState === 'converged'
    ? `Converged in ${results?.iterations} iterations (max mismatch: ${results?.maxMismatch.toExponential(2)} pu)`
    : runState === 'diverged'
    ? 'Did not converge — check network connectivity and loading.'
    : 'Press "Run Power Flow" to solve.';

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
          {mode === 'fault' ? '⚡ Run Power Flow + Fault' : '▶ Run Power Flow'}
        </button>
        <button
          onClick={reset}
          style={{
            background: 'none', color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)', borderRadius: 4,
            padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
          }}
        >
          Reset
        </button>
        <span style={{ color: statusColor, fontSize: '0.76rem' }}>{statusText}</span>
      </div>

      {/* Main layout: diagram left, charts + inspector right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px,1fr) minmax(220px,340px)',
        gap: 14,
      }}>
        {/* Left: single-line diagram */}
        <div>
          <SingleLineDiagram
            network={network}
            results={results}
            selectedBusId={selectedBusId}
            onBusClick={id => setSelectedBusId(prev => prev === id ? null : id)}
            faultBusId={activeFaultBus ?? undefined}
          />
        </div>

        {/* Right: charts + inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Voltage profile chart */}
          {results && (
            <VoltageProfileChart
              buses={network.buses}
              results={results.buses}
              baseMVA={network.baseMVA}
            />
          )}

          {/* Bus inspector */}
          {selectedBus && selectedResult && (
            <BusInspector
              bus={selectedBus}
              result={selectedResult}
              baseMVA={network.baseMVA}
              onClose={() => setSelectedBusId(null)}
            />
          )}

          {/* Fault results */}
          {fault && (
            <FaultPanel fault={fault} baseMVA={network.baseMVA} />
          )}

          {/* Summary table */}
          {results?.converged && !selectedBus && !fault && (
            <SummaryPanel results={results} baseMVA={network.baseMVA} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-panels ─────────────────────────────────────────────────────────────────

function FaultPanel({ fault, baseMVA: _baseMVA }: { fault: FaultResult; baseMVA: number }) {
  return (
    <div style={{
      border: '1px solid #ef4444', borderRadius: 6,
      padding: '10px 14px', background: 'rgba(239,68,68,0.06)',
    }}>
      <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>
        ⚡ 3-Phase Fault at Bus {fault.faultBusId}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.78rem' }}>
        <tbody>
          <FRow label="Pre-fault V₀"  value={fault.Vprefault.toFixed(4)} unit="pu" />
          <FRow label="Z_Thevenin"    value={fault.ZtheveninMag.toFixed(4)} unit="pu" />
          <FRow label="I_fault"       value={fault.IfaultPU.toFixed(3)} unit="pu" />
          <FRow label="I_fault"       value={fault.IfaultKA.toFixed(3)} unit="kA" highlight />
        </tbody>
      </table>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: 6 }}>
        I_fault = V₀ / Z_kk (Z-bus method)
      </div>
    </div>
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
