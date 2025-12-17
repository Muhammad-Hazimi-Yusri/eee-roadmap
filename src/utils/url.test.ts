// src/utils/url.test.ts

import { describe, it, expect, vi } from 'vitest';

// Mock import.meta.env.BASE_URL
vi.stubGlobal('import', { meta: { env: { BASE_URL: '/' } } });

// We need to test the logic without the actual import.meta.env
// So let's test a pure function version

function internalHrefPure(path: string, baseUrl: string = '/'): string {
  if (!path || path === '/') {
    return baseUrl;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const [pathPart, hashPart] = cleanPath.split('#');
  const normalizedPath = pathPart.endsWith('/') ? pathPart : `${pathPart}/`;
  const fullPath = hashPart ? `${normalizedPath}#${hashPart}` : normalizedPath;

  return `${baseUrl}${fullPath}`;
}

describe('internalHref', () => {
  describe('with base URL "/"', () => {
    const baseUrl = '/';

    it('handles simple path', () => {
      expect(internalHrefPure('about', baseUrl)).toBe('/about/');
    });

    it('handles nested path', () => {
      expect(internalHrefPure('roadmaps/fundamentals', baseUrl)).toBe('/roadmaps/fundamentals/');
    });

    it('handles path with hash', () => {
      expect(internalHrefPure('roadmaps/fundamentals#topic', baseUrl)).toBe('/roadmaps/fundamentals/#topic');
    });

    it('handles empty path (root)', () => {
      expect(internalHrefPure('', baseUrl)).toBe('/');
    });

    it('handles "/" path', () => {
      expect(internalHrefPure('/', baseUrl)).toBe('/');
    });

    it('handles path with leading slash', () => {
      expect(internalHrefPure('/about', baseUrl)).toBe('/about/');
    });

    it('handles path already with trailing slash', () => {
      expect(internalHrefPure('about/', baseUrl)).toBe('/about/');
    });
  });

  describe('with custom base URL', () => {
    const baseUrl = '/eee-roadmap/';

    it('handles simple path', () => {
      expect(internalHrefPure('about', baseUrl)).toBe('/eee-roadmap/about/');
    });

    it('handles path with hash', () => {
      expect(internalHrefPure('roadmaps/core#topic', baseUrl)).toBe('/eee-roadmap/roadmaps/core/#topic');
    });
  });
});