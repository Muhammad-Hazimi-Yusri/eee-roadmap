// src/components/tools/registry.ts
// Maps a JsTool's `componentKey` to the React component that renders it.
// Adding a new JS tool: implement the React component, register it here, and
// reference its componentKey in the tool's JSON.

import type { ComponentType } from 'react';
import PFCsvCleaner    from './js/PFCsvCleaner';
import BulkPerUnit     from './js/BulkPerUnit';
import HarmonicFFT     from './js/HarmonicFFT';
import NetworkAnonymiser from './js/NetworkAnonymiser';
import GridCodeViewer    from './js/GridCodeViewer';

export const JS_TOOL_REGISTRY: Record<string, ComponentType<Record<string, never>>> = {
  'pf-csv-cleaner':     PFCsvCleaner,
  'bulk-per-unit':      BulkPerUnit,
  'harmonic-fft':       HarmonicFFT,
  'network-anonymiser': NetworkAnonymiser,
  'grid-code-viewer':   GridCodeViewer,
};
