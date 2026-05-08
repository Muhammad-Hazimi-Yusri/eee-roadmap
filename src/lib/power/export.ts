// src/lib/power/export.ts
// CSV / JSON export helpers for power-flow and fault-analysis results.

import type { PowerNetwork, PowerFlowResults, FaultResult } from './types.js';

const CSV_HEADER_BUS  = 'BusID,BusName,Type,Vmag_pu,Vmag_kV,Theta_deg,P_inj_MW,Q_inj_MVAr';
const CSV_HEADER_LINE = 'BranchID,FromBus,ToBus,P_MW,Q_MVAr,LoadingPercent,Loss_MW';
const CSV_HEADER_FAULT =
  'BusID,FaultType,V_prefault_pu,Z1_mag_pu,Z2_mag_pu,Z0_mag_pu,Zf_pu,'
  + 'Ia_pu,Ia_kA,Ib_pu,Ib_kA,Ic_pu,Ic_kA,Imax_pu,Imax_kA';

/** Bus results in CSV (one row per bus). */
export function resultsToBusCSV(net: PowerNetwork, r: PowerFlowResults): string {
  const rows = r.buses.map(b => {
    const bus = net.buses.find(x => x.id === b.busId)!;
    const vKV = (b.Vmag * bus.baseKV).toFixed(3);
    const tDeg = (b.theta * 180 / Math.PI).toFixed(4);
    const pMW = (b.Pinj * net.baseMVA).toFixed(3);
    const qMVAr = (b.Qinj * net.baseMVA).toFixed(3);
    return [
      bus.id, escape(bus.name), bus.type,
      b.Vmag.toFixed(5), vKV, tDeg, pMW, qMVAr,
    ].join(',');
  });
  return [CSV_HEADER_BUS, ...rows].join('\n');
}

/** Branch (line + transformer) results in CSV. */
export function resultsToLineCSV(net: PowerNetwork, r: PowerFlowResults): string {
  const rows = r.lines.map(l => {
    const pMW   = (l.Pij * net.baseMVA).toFixed(3);
    const qMVAr = (l.Qij * net.baseMVA).toFixed(3);
    const lossMW = (l.lossP * net.baseMVA).toFixed(4);
    const loadPct = (l.loadingFraction * 100).toFixed(2);
    return [
      escape(l.lineId), l.fromBus, l.toBus,
      pMW, qMVAr, loadPct, lossMW,
    ].join(',');
  });
  return [CSV_HEADER_LINE, ...rows].join('\n');
}

/** Single-row fault summary (suitable for appending to a study log). */
export function faultToCSV(_net: PowerNetwork, f: FaultResult): string {
  const row = [
    f.faultBusId,
    f.faultType,
    f.Vprefault.toFixed(4),
    f.Z1mag.toFixed(5),
    f.Z2mag.toFixed(5),
    f.Z0mag.toFixed(5),
    f.ZfMag.toFixed(5),
    f.Ia.pu.toFixed(4), f.Ia.kA.toFixed(4),
    f.Ib.pu.toFixed(4), f.Ib.kA.toFixed(4),
    f.Ic.pu.toFixed(4), f.Ic.kA.toFixed(4),
    f.Imax.pu.toFixed(4), f.Imax.kA.toFixed(4),
  ].join(',');
  return [CSV_HEADER_FAULT, row].join('\n');
}

/** Trigger a browser download of the supplied text as the named file. */
export function downloadText(filename: string, text: string, mime = 'text/csv'): void {
  if (typeof window === 'undefined') return; // SSR guard
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
