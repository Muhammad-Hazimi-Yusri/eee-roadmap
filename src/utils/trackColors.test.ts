import { describe, it, expect } from 'vitest';
import { getTrackColor, getTrackColorMap } from './trackColors';

describe('trackColors', () => {
  describe('getTrackColor', () => {
    it('returns copper hex for index 0', () => {
      expect(getTrackColor(0)).toBe('#b87333');
    });

    it('returns pcb-green hex for index 1', () => {
      expect(getTrackColor(1)).toBe('#2d5a27');
    });

    it('returns blue hex for index 2', () => {
      expect(getTrackColor(2)).toBe('#3b82f6');
    });

    it('returns slate hex for index 7 (last palette)', () => {
      expect(getTrackColor(7)).toBe('#64748b');
    });

    it('returns HSL color for index 8 (first overflow)', () => {
      // overflowIndex = 0, hue = (200 + 0*47) % 360 = 200
      expect(getTrackColor(8)).toBe('hsl(200, 65%, 45%)');
    });

    it('returns HSL color for index 9 (second overflow)', () => {
      // overflowIndex = 1, hue = (200 + 1*47) % 360 = 247
      expect(getTrackColor(9)).toBe('hsl(247, 65%, 45%)');
    });

    it('wraps HSL hue around 360', () => {
      // overflowIndex = 4, hue = (200 + 4*47) % 360 = 388 % 360 = 28
      expect(getTrackColor(12)).toBe('hsl(28, 65%, 45%)');
    });

    it('all 8 palette colors are distinct hex strings', () => {
      const colors = Array.from({ length: 8 }, (_, i) => getTrackColor(i));
      const unique = new Set(colors);
      expect(unique.size).toBe(8);
      colors.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    });
  });

  describe('getTrackColorMap', () => {
    it('returns empty map for empty array', () => {
      expect(getTrackColorMap([])).toEqual({});
    });

    it('maps each slug to its indexed color', () => {
      const result = getTrackColorMap(['fundamentals', 'core', 'advanced']);
      expect(result).toEqual({
        fundamentals: '#b87333',
        core: '#2d5a27',
        advanced: '#3b82f6',
      });
    });

    it('handles more than 8 slugs with overflow colors', () => {
      const slugs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
      const result = getTrackColorMap(slugs);
      expect(Object.keys(result)).toHaveLength(9);
      // First 8 are hex palette
      expect(result['a']).toBe('#b87333');
      expect(result['h']).toBe('#64748b');
      // 9th is overflow HSL
      expect(result['i']).toBe('hsl(200, 65%, 45%)');
    });
  });
});
