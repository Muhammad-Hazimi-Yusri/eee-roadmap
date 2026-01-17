/**
 * Track color utility - assigns consistent colors to tracks.
 * Uses curated palette for first 8, HSL rotation for overflow.
 */

// Curated PCB/engineering palette (light + dark mode friendly)
const PALETTE = [
  { name: 'copper', hex: '#b87333' },
  { name: 'pcb-green', hex: '#2d5a27' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'purple', hex: '#8b5cf6' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'rose', hex: '#e11d48' },
  { name: 'slate', hex: '#64748b' },
];

/**
 * Generate HSL color for overflow tracks (index >= 8)
 * Starts at hue 200 to avoid repeating early palette colors
 */
function generateHslColor(overflowIndex: number): string {
  const hue = (200 + overflowIndex * 47) % 360; // 47 = golden angle approximation
  return `hsl(${hue}, 65%, 45%)`;
}

/**
 * Get color for a track by index
 * @param index - Track index (0-based, typically from sorted order)
 * @returns Hex color string
 */
export function getTrackColor(index: number): string {
  if (index < PALETTE.length) {
    return PALETTE[index].hex;
  }
  return generateHslColor(index - PALETTE.length);
}

/**
 * Get all track colors as a map of slug -> color
 * @param slugs - Array of track slugs in display order
 * @returns Map of slug to hex color
 */
export function getTrackColorMap(slugs: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  slugs.forEach((slug, index) => {
    map[slug] = getTrackColor(index);
  });
  return map;
}