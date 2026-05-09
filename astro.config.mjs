import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), sitemap(), react()],
  vite: {
    build: {
      rollupOptions: {
        // These WASM-heavy / CDN-only packages are lazy-loaded on demand
        // (Yosys in VerilogPlayground, Pyodide in PythonToolView).  Marking
        // them external prevents Rollup from trying to bundle them; the
        // dynamic import() is guarded by a try/catch and a `@vite-ignore`
        // pragma so failures degrade gracefully.
        external: ['@yowasp/yosys', 'yosys2digitaljs', 'digitaljs', 'pyodide'],
      },
    },
  },
  site: 'https://eee-roadmap.muhammadhazimiyusri.uk',
  // base: '/eee-roadmap',
  // When using a custom subdomain like eee-roadmap.muhammadhazimiyusri.uk,
  // the base path should be set to the root (/) or an empty string.
  base: '/',
  trailingSlash: 'always',  // To fix first time roadmap track prereq link cause page to refresh  due to lack of this
  compressHTML: true,
  prefetch: {
    defaultStrategy: 'viewport',
  },
  redirects: {
    '/learn/circuits':       '/labs/#circuits',
    '/learn/pcb':            '/labs/#pcb',
    '/learn/digital':        '/labs/#digital',
    '/learn/semiconductor':  '/labs/#semiconductor',
    '/learn/power-systems':  '/labs/#power-systems',
    // /toolkit/ was renamed to /tools/. Old links keep working.
    '/toolkit':                              '/tools/',
    '/toolkit/matplotlib-voltage-profile':   '/tools/voltage-profile-plot/',
    '/toolkit/matplotlib-harmonic-spectrum': '/tools/harmonic-spectrum-plot/',
    '/toolkit/openpyxl-fault-table':         '/tools/fault-level-xlsx/',
    '/toolkit/python-docx-study-report':     '/tools/study-report-docx/',
    '/toolkit/vba-format-results-table':     '/tools/vba-format-results-table/',
    '/toolkit/vba-csv-cleanup':              '/tools/vba-csv-cleanup/',
  },
});
