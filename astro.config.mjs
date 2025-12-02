import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  // site: 'https://Muhammad-Hazimi-Yusri.github.io',
  // base: '/eee-roadmap',
  // When using a custom subdomain like eee-roadmap.muhammadhazimiyusri.uk,
  // the base path should be set to the root (/) or an empty string.
  base: '/', 
  // ... other configs like adapter, etc.
});
