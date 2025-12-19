/**
 * URL utilities for consistent internal link handling.
 * Ensures trailing slashes match Astro config to prevent page reloads.
 * 
 * @module url
 */

/**
 * Generate consistent internal href with proper trailing slash.
 * Prevents page reload issues when navigating between pages.
 * 
 * @param path - Path without leading slash (e.g., 'roadmaps/fundamentals')
 * @returns Full path with base URL and trailing slash
 * 
 * @example
 * internalHref('roadmaps/fundamentals')
 * // Returns: '/roadmaps/fundamentals/'
 * 
 * @example
 * internalHref('roadmaps/core#transistors')
 * // Returns: '/roadmaps/core/#transistors'
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