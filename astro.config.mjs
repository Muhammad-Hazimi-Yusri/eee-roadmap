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
        // These WASM-heavy packages are lazy-loaded on demand in VerilogPlayground.
        // Marking them external prevents Rollup from failing when they aren't installed;
        // the dynamic import() is guarded by a try/catch so failures are shown gracefully.
        external: ['@yowasp/yosys', 'yosys2digitaljs', 'digitaljs'],
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
});
