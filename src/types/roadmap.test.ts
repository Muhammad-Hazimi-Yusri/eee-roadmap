import { describe, it, expect } from 'vitest';
import type { RoadmapSection } from './roadmap';
import { roadmaps } from '../data';

describe('Roadmap data validation', () => {
  const allRoadmaps = Object.entries(roadmaps).map(([name, roadmap]) => ({ name, data: roadmap.sections }));

  describe.each(allRoadmaps)('$name roadmap', ({ data }) => {
    it('should have at least one section', () => {
      expect(data.length).toBeGreaterThan(0);
    });

    it('should have valid section structure', () => {
      data.forEach((section) => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('items');
        expect(typeof section.id).toBe('string');
        expect(typeof section.title).toBe('string');
        expect(Array.isArray(section.items)).toBe(true);
      });
    });

    it('should have valid topic structure', () => {
      data.forEach((section) => {
        section.items.forEach((topic) => {
          expect(topic).toHaveProperty('id');
          expect(topic).toHaveProperty('title');
          expect(topic).toHaveProperty('description');
          expect(typeof topic.id).toBe('string');
          expect(typeof topic.title).toBe('string');
          expect(typeof topic.description).toBe('string');
        });
      });
    });

    it('should have valid concept structure when present', () => {
      data.forEach((section) => {
        section.items.forEach((topic) => {
          if (topic.concepts) {
            expect(Array.isArray(topic.concepts)).toBe(true);
            topic.concepts.forEach((concept) => {
              expect(concept).toHaveProperty('name');
              expect(typeof concept.name).toBe('string');
              if (concept.notes !== undefined) {
                expect(typeof concept.notes).toBe('string');
              }
            });
          }
        });
      });
    });

    it('should have valid resource structure when present', () => {
      data.forEach((section) => {
        section.items.forEach((topic) => {
          if (topic.resources) {
            expect(Array.isArray(topic.resources)).toBe(true);
            topic.resources.forEach((resource) => {
              expect(resource).toHaveProperty('label');
              expect(resource).toHaveProperty('url');
              expect(typeof resource.label).toBe('string');
              expect(typeof resource.url).toBe('string');
            });
          }
        });
      });
    });

    it('should have unique topic IDs within each section', () => {
      data.forEach((section) => {
        const ids = section.items.map((t) => t.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });
});