import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/pages/**/*.astro',
    'src/components/**/*.astro',
  ],
  project: ['src/**/*.{ts,js,astro}', 'scripts/**/*.mjs'],
  ignore: ['src/env.d.ts'],
  ignoreDependencies: [
    '@types/cytoscape',
  ],
  astro: true,
};

export default config;