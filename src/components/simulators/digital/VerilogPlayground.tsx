// src/components/simulators/digital/VerilogPlayground.tsx
// Verilog synthesis playground — synthesises Verilog via Yosys WASM and
// renders an interactive gate-level simulation with DigitalJS.
//
// The heavy WASM deps (@yowasp/yosys, digitaljs, yosys2digitaljs) are ONLY
// loaded on button click via dynamic import() — never at module load time.
// Hydration: client:visible

import { useState, useRef, useEffect } from 'react';

const EXAMPLE_VERILOG = `// 4-bit ripple-carry adder
module adder4(
  input  [3:0] a,
  input  [3:0] b,
  input        cin,
  output [3:0] sum,
  output       cout
);
  assign {cout, sum} = a + b + cin;
endmodule`;

type Status = 'idle' | 'loading' | 'synthesising' | 'running' | 'error';

export default function VerilogPlayground() {
  const [code, setCode] = useState(EXAMPLE_VERILOG);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  // DigitalJS circuit instance (kept in ref to avoid re-render on change)
  const circuitRef = useRef<unknown>(null);

  // Cleanup DigitalJS on unmount
  useEffect(() => {
    return () => {
      if (circuitRef.current && typeof circuitRef.current === 'object') {
        const c = circuitRef.current as Record<string, unknown>;
        if (typeof c['stop'] === 'function') (c['stop'] as () => void)();
      }
    };
  }, []);

  async function handleLoad() {
    setStatus('loading');
    setErrorMsg('');

    try {
      // Dynamically import WASM pipeline — only happens when user clicks.
      // @vite-ignore prevents Rollup static analysis; failures are caught below.
      const [{ default: YosysModule }, yosys2digitaljs, DigitalJS] = await Promise.all([
        import(/* @vite-ignore */ '@yowasp/yosys'),
        import(/* @vite-ignore */ 'yosys2digitaljs'),
        import(/* @vite-ignore */ 'digitaljs'),
      ]);

      setStatus('synthesising');

      // Run Yosys synthesis: Verilog → JSON netlist
      const yosys = await YosysModule();
      const result = await yosys.run([
        'read_verilog /input.v',
        'synth -top ' + extractTopModule(code),
        'write_json /output.json',
      ], { '/input.v': code });

      if (result.returncode !== 0) {
        throw new Error(result.stderr || 'Synthesis failed');
      }

      const netlist = JSON.parse(result.files['/output.json'] as string);

      // Convert Yosys netlist → DigitalJS circuit JSON
      const circuitData = await yosys2digitaljs.default(netlist);

      // Mount DigitalJS simulation into DOM container
      if (circuitRef.current && typeof circuitRef.current === 'object') {
        const c = circuitRef.current as Record<string, unknown>;
        if (typeof c['stop'] === 'function') (c['stop'] as () => void)();
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const circuit = new (DigitalJS as Record<string, unknown>)['Circuit'](circuitData) as Record<string, unknown>;
        circuitRef.current = circuit;
        if (typeof circuit['display'] === 'function') {
          (circuit['display'] as (el: HTMLElement) => void)(containerRef.current);
        }
        if (typeof circuit['start'] === 'function') {
          (circuit['start'] as () => void)();
        }
      }

      setStatus('running');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  function extractTopModule(src: string): string {
    const m = /module\s+(\w+)/.exec(src);
    return m ? m[1] : 'top';
  }

  const btnLabel: Record<Status, string> = {
    idle: 'Load Verilog Playground',
    loading: 'Loading Yosys WASM…',
    synthesising: 'Synthesising…',
    running: 'Re-synthesise',
    error: 'Retry',
  };

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Info banner — shown before WASM is loaded */}
      {status === 'idle' && (
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
          The Verilog playground synthesises your code using <strong style={{ color: 'var(--color-text)' }}>Yosys WASM</strong> (~40 MB) and renders a live gate-level simulation.
          Click the button below to load it.
        </div>
      )}

      {/* Code editor */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="verilog-src" style={{ display: 'block', fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Verilog source
        </label>
        <textarea
          id="verilog-src"
          value={code}
          onChange={e => setCode(e.target.value)}
          rows={14}
          spellCheck={false}
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            padding: '0.6rem 0.75rem',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '3px',
            resize: 'vertical',
            lineHeight: 1.55,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Action button */}
      <button
        onClick={handleLoad}
        disabled={status === 'loading' || status === 'synthesising'}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          padding: '0.45rem 1.1rem',
          borderRadius: '3px',
          border: '1px solid var(--color-copper)',
          background: 'color-mix(in srgb, var(--color-copper) 12%, transparent)',
          color: 'var(--color-copper)',
          cursor: status === 'loading' || status === 'synthesising' ? 'wait' : 'pointer',
          opacity: status === 'loading' || status === 'synthesising' ? 0.7 : 1,
          marginBottom: '0.75rem',
        }}
      >
        {btnLabel[status]}
      </button>

      {/* Error panel */}
      {status === 'error' && (
        <div style={{ padding: '0.65rem 0.85rem', background: 'color-mix(in srgb, #e84040 10%, transparent)', border: '1px solid #c04040', borderRadius: '3px', fontSize: '0.75rem', color: '#e84040', marginBottom: '0.75rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <strong>Synthesis error:</strong> {errorMsg}
        </div>
      )}

      {/* DigitalJS simulation container */}
      <div
        ref={containerRef}
        style={{
          display: status === 'running' ? 'block' : 'none',
          border: '1px solid var(--color-border)',
          borderRadius: '3px',
          padding: '0.75rem',
          background: 'var(--color-bg-grid)',
          minHeight: '200px',
          overflow: 'auto',
        }}
      />

      {/* Step hint while loading */}
      {(status === 'loading' || status === 'synthesising') && (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {status === 'loading' ? 'Downloading Yosys WebAssembly module…' : 'Running synthesis pass — this may take a few seconds…'}
        </div>
      )}
    </div>
  );
}
