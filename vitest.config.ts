import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/__tests__/**/*.test.mjs'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/utils/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});