// src/lib/tools/pyodide.ts
// Lazy-loaded Pyodide singleton.
//
// Pyodide is loaded from the jsDelivr CDN on first call to `getPyodide()` and
// cached for the rest of the session.  Same lazy-load + try/catch pattern as
// the Yosys / DigitalJS Verilog playground.
//
// Status updates are emitted to a single subscriber so PyodideRunner can show a
// loading indicator covering the (~5–15 s, ~10 MB) cold start.

const PYODIDE_VERSION = '0.28.0';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_ENTRY = `${PYODIDE_INDEX_URL}pyodide.mjs`;

export type PyodideStatus =
  | { kind: 'idle' }
  | { kind: 'loading-runtime'; message: string }
  | { kind: 'installing-packages'; packages: string[] }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

// Minimal subset of the Pyodide API we use.
interface PyProxy {
  toJs?: (opts?: { dict_converter?: unknown }) => unknown;
  destroy?: () => void;
}
export interface PyodideAPI {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (names: string[]) => Promise<void>;
  globals: { set: (k: string, v: unknown) => void; get: (k: string) => unknown };
  FS: {
    writeFile: (path: string, data: Uint8Array | string, opts?: unknown) => void;
    readFile: (path: string, opts?: { encoding?: 'binary' | 'utf8' }) => Uint8Array | string;
    readdir: (path: string) => string[];
    mkdir: (path: string) => void;
    analyzePath: (path: string) => { exists: boolean };
    unlink: (path: string) => void;
  };
  toPy: (v: unknown) => PyProxy;
}

interface PyodideLoader {
  loadPyodide: (opts: { indexURL: string }) => Promise<PyodideAPI>;
}

let pyodidePromise: Promise<PyodideAPI> | null = null;
const installedPackages: Set<string> = new Set();
let statusSubscriber: ((s: PyodideStatus) => void) | null = null;

export function subscribeStatus(fn: ((s: PyodideStatus) => void) | null) {
  statusSubscriber = fn;
}

function emit(s: PyodideStatus) {
  if (statusSubscriber) statusSubscriber(s);
}

/** Load (or return the cached) Pyodide runtime. */
export async function getPyodide(): Promise<PyodideAPI> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    emit({ kind: 'loading-runtime', message: 'Downloading Pyodide runtime (~10 MB)…' });
    const mod = (await import(/* @vite-ignore */ PYODIDE_ENTRY)) as unknown as PyodideLoader;
    emit({ kind: 'loading-runtime', message: 'Initialising Python interpreter…' });
    const py = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    // Make /input and /output directories for tool I/O.
    if (!py.FS.analyzePath('/input').exists) py.FS.mkdir('/input');
    if (!py.FS.analyzePath('/output').exists) py.FS.mkdir('/output');
    emit({ kind: 'ready' });
    return py;
  })().catch(err => {
    pyodidePromise = null;
    emit({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    throw err;
  });
  return pyodidePromise;
}

/** Load any packages we haven't already loaded. Pyodide keeps an internal cache,
 *  but we also dedupe locally to avoid spurious repeat calls. */
export async function ensurePackages(packages: string[]): Promise<void> {
  if (!packages.length) return;
  const py = await getPyodide();
  const missing = packages.filter(p => !installedPackages.has(p));
  if (!missing.length) return;
  emit({ kind: 'installing-packages', packages: missing });
  // Pyodide's loadPackage is idempotent and silently skips unknown names —
  // pure-Python wheels need micropip.install() instead.
  const native: string[] = [];
  const pure: string[] = [];
  for (const p of missing) {
    if (NATIVE_PACKAGES.has(p)) native.push(p);
    else pure.push(p);
  }
  if (native.length) await py.loadPackage(native);
  if (pure.length) {
    await py.loadPackage(['micropip']);
    py.globals.set('__pure_pkgs', py.toPy(pure));
    await py.runPythonAsync(`
import micropip
await micropip.install([str(p) for p in __pure_pkgs])
`);
  }
  for (const p of missing) installedPackages.add(p);
  emit({ kind: 'ready' });
}

/** Packages bundled with Pyodide (loadable via loadPackage). The full list lives
 *  in https://pyodide.org/en/stable/usage/packages-in-pyodide.html — these are
 *  the ones we'll plausibly use. Anything else routes through micropip. */
const NATIVE_PACKAGES = new Set([
  'numpy', 'scipy', 'pandas', 'matplotlib',
  'sympy', 'lxml', 'pillow',
  'micropip',
]);

export interface RunRequest {
  packages: string[];
  /** Files to drop at /input/<name>. */
  inputs: { name: string; bytes: Uint8Array }[];
  /** Names of files we expect at /output/<name> after the script runs. */
  outputNames: string[];
  /** Parameter values exposed to the script as a dict named `params`. */
  params: Record<string, string | number>;
  /** The Python script to execute. */
  script: string;
}

export interface RunResult {
  outputs: { name: string; data: Uint8Array }[];
  /** Anything the script printed to stdout (string). */
  stdout: string;
}

/** Run a Pyodide tool end-to-end: load packages, write inputs, execute script,
 *  collect outputs. Throws on script error. */
export async function runPythonTool(req: RunRequest): Promise<RunResult> {
  const py = await getPyodide();
  await ensurePackages(req.packages);

  // Reset I/O directories.
  for (const dir of ['/input', '/output']) {
    for (const name of py.FS.readdir(dir)) {
      if (name === '.' || name === '..') continue;
      try { py.FS.unlink(`${dir}/${name}`); } catch { /* ignore */ }
    }
  }
  for (const i of req.inputs) {
    py.FS.writeFile(`/input/${i.name}`, i.bytes);
  }

  // Capture stdout.
  await py.runPythonAsync(`
import sys, io
__stdout = io.StringIO()
sys.stdout = __stdout
sys.stderr = __stdout
`);

  py.globals.set('params', py.toPy(req.params));
  await py.runPythonAsync(req.script);

  const stdoutResult = py.runPython(`__stdout.getvalue()`);
  const stdout = typeof stdoutResult === 'string' ? stdoutResult : '';

  const outputs: { name: string; data: Uint8Array }[] = [];
  for (const name of req.outputNames) {
    const path = `/output/${name}`;
    if (py.FS.analyzePath(path).exists) {
      const bytes = py.FS.readFile(path, { encoding: 'binary' }) as Uint8Array;
      outputs.push({ name, data: bytes });
    }
  }
  return { outputs, stdout };
}
