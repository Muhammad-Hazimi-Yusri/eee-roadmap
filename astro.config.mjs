import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://Muhammad-Hazimi-Yusri.github.io',
  base: '/eee-roadmap',
});
