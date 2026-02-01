import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/data/**',
      '.astro/**',
      'public/pdfjs/**',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Astro rules
  ...eslintPluginAstro.configs.recommended,

  // Project-specific overrides
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.astro'],
    rules: {
      // Align with your existing tsconfig strictness
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      // Allow any for now (can tighten later)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Scripts are Node.js (need globals)
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
    },
  },

  // Astro env.d.ts uses triple-slash (intentional)
  {
    files: ['src/env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Type definition files - imports are used for types
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Test files - Vitest globals
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
  },

  // Allow empty catch blocks (common pattern)
  {
    files: ['**/*.astro', '**/*.ts'],
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];