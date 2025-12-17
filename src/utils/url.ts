// src/utils/url.ts

/**
 * Generate internal href with proper trailing slash.
 * Handles hash anchors correctly.
 * 
 * @param path - Path without base URL (e.g., 'roadmaps/fundamentals')
 * @returns Full href with base URL and trailing slash
 * 
 * @example
 * internalHref('roadmaps/fundamentals') // '/roadmaps/fundamentals/'
 * internalHref('roadmaps/fundamentals#topic') // '/roadmaps/fundamentals/#topic'
 * internalHref('') // '/' (root)
 */
export function internalHref(path: string): string {
  // Handle empty path (root)
  if (!path || path === '/') {
    return import.meta.env.BASE_URL;
  }

  // Remove leading slash if present (we'll add it via BASE_URL)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Split path and hash
  const [pathPart, hashPart] = cleanPath.split('#');

  // Ensure trailing slash on path part
  const normalizedPath = pathPart.endsWith('/') ? pathPart : `${pathPart}/`;

  // Reconstruct with hash if present
  const fullPath = hashPart ? `${normalizedPath}#${hashPart}` : normalizedPath;

  return `${import.meta.env.BASE_URL}${fullPath}`;
}