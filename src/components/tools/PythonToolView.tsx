// PythonToolView.tsx — runs a PythonTool: dropzone + params + Pyodide runner + outputs.

import { useEffect, useState, useCallback } from 'react';
import type { PythonTool } from '../../lib/tools/types';
import {
  runPythonTool, subscribeStatus,
  type PyodideStatus,
} from '../../lib/tools/pyodide';
import ToolDropzone from './ToolDropzone';
import ParamForm from './ParamForm';
import OutputPanel, { type ToolOutput } from './OutputPanel';

interface Props {
  tool: PythonTool;
}

interface RunState {
  kind: 'idle' | 'loading' | 'running' | 'done' | 'error';
  message?: string;
}

export default function PythonToolView({ tool }: Props) {
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [params, setParams] = useState<Record<string, string | number>>(() =>
    Object.fromEntries((tool.params ?? []).map(p => [p.name, p.default])),
  );
  const [runState, setRunState] = useState<RunState>({ kind: 'idle' });
  const [pyStatus, setPyStatus] = useState<PyodideStatus>({ kind: 'idle' });
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);
  const [stdout, setStdout] = useState<string>('');

  useEffect(() => {
    subscribeStatus(setPyStatus);
    return () => subscribeStatus(null);
  }, []);

  const requiredOk = tool.inputs.every(i => !i.required || files[i.name]);

  const run = useCallback(async () => {
    if (!requiredOk) return;
    setRunState({ kind: 'loading' });
    setOutputs([]);
    setStdout('');
    try {
      const inputs = await Promise.all(
        Object.entries(files)
          .filter(([, f]) => !!f)
          .map(async ([name, f]) => ({
            name,
            bytes: new Uint8Array(await (f as File).arrayBuffer()),
          })),
      );
      setRunState({ kind: 'running' });
      const result = await runPythonTool({
        packages: tool.packages,
        inputs,
        outputNames: tool.outputs.map(o => o.name),
        params,
        script: tool.script,
      });
      setStdout(result.stdout);
      const mimeFor = Object.fromEntries(tool.outputs.map(o => [o.name, o.mime]));
      setOutputs(result.outputs.map(o => ({
        name: o.name,
        mime: mimeFor[o.name] ?? 'application/octet-stream',
        data: o.data,
      })));
      setRunState({ kind: 'done' });
    } catch (e) {
      setRunState({
        kind: 'error',
        message: e instanceof Error ? (e.message + (e.stack ? '\n' + e.stack : '')) : String(e),
      });
    }
  }, [files, params, tool, requiredOk]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <ToolDropzone
        slots={tool.inputs.map(i => ({
          name: i.name, accept: i.accept, required: i.required, description: i.description,
        }))}
        files={files}
        onChange={setFiles}
      />

      {tool.params && tool.params.length > 0 && (
        <ParamForm params={tool.params} values={params} onChange={setParams} />
      )}

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          onClick={run}
          disabled={!requiredOk || runState.kind === 'loading' || runState.kind === 'running'}
          style={runBtn(requiredOk && runState.kind !== 'loading' && runState.kind !== 'running')}
        >
          {runState.kind === 'loading' || runState.kind === 'running' ? '⏳ working…' : '▶ Run'}
        </button>
        <RuntimeBadge />
        <PyStatusLine status={pyStatus} />
        <RunStatusLine state={runState} />
      </div>

      {pyStatus.kind === 'idle' && (
        <div style={{
          marginTop: 10, padding: '6px 10px',
          fontSize: '0.7rem', color: 'var(--color-text-muted)',
          border: '1px dashed var(--color-border)', borderRadius: 4,
        }}>
          First run downloads the Python runtime (~10 MB). It's cached after that — subsequent runs and other Python tools start instantly.
        </div>
      )}

      <OutputPanel outputs={outputs} />

      {stdout && (
        <details style={{ marginTop: 10, fontSize: '0.74rem' }}>
          <summary style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            stdout ({stdout.split('\n').length - 1} lines)
          </summary>
          <pre style={{
            marginTop: 6, padding: '8px 10px',
            background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)',
            borderRadius: 3, overflowX: 'auto',
          }}>{stdout}</pre>
        </details>
      )}

      {runState.kind === 'error' && (
        <pre style={{
          marginTop: 10, padding: '10px 12px',
          color: '#ef4444', background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid #ef4444', borderRadius: 4, fontSize: '0.74rem',
          overflowX: 'auto', whiteSpace: 'pre-wrap',
        }}>{runState.message}</pre>
      )}
    </div>
  );
}

function RuntimeBadge() {
  return (
    <span style={{
      fontSize: '0.62rem',
      padding: '0.12rem 0.45rem',
      border: '1px solid rgb(22 163 74 / 35%)',
      background: 'rgb(22 163 74 / 8%)',
      color: '#16a34a',
      borderRadius: 2,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>python · pyodide</span>
  );
}

function PyStatusLine({ status }: { status: PyodideStatus }) {
  if (status.kind === 'idle' || status.kind === 'ready') return null;
  let text = '';
  if (status.kind === 'loading-runtime') text = status.message;
  else if (status.kind === 'installing-packages') text = `installing ${status.packages.join(', ')}…`;
  else if (status.kind === 'error') text = `runtime error: ${status.message}`;
  return (
    <span style={{
      fontSize: '0.7rem',
      color: status.kind === 'error' ? '#ef4444' : 'var(--color-copper, #c87533)',
    }}>{text}</span>
  );
}

function RunStatusLine({ state }: { state: RunState }) {
  if (state.kind === 'idle' || state.kind === 'error') return null;
  if (state.kind === 'running') {
    return <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>running script…</span>;
  }
  if (state.kind === 'done') {
    return <span style={{ fontSize: '0.7rem', color: '#22c55e' }}>✓ done</span>;
  }
  return null;
}

function runBtn(enabled: boolean): React.CSSProperties {
  return {
    background: enabled ? '#2563eb' : 'var(--color-bg-grid)',
    color: enabled ? '#fff' : 'var(--color-text-muted)',
    border: 'none', borderRadius: 4,
    padding: '5px 14px', cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600,
  };
}
