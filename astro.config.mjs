import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), sitemap()],
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
