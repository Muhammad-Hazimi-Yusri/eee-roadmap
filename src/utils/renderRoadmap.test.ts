import { describe, it, expect } from 'vitest';
import { renderRoadmapHtml } from './renderRoadmap';
import type { RoadmapSection } from '../types/roadmap';

function createSection(overrides?: Partial<RoadmapSection>): RoadmapSection {
  return {
    id: 'test-section',
    title: 'Test Section',
    items: [{
      id: 'test-topic',
      title: 'Test Topic',
      description: 'A test description',
    }],
    ...overrides,
  };
}

describe('renderRoadmapHtml', () => {
  describe('section rendering', () => {
    it('renders section with correct id', () => {
      const html = renderRoadmapHtml([createSection({ id: 'my-section' })]);
      expect(html).toContain('id="my-section"');
    });

    it('renders section title as h3', () => {
      const html = renderRoadmapHtml([createSection({ title: 'Math Foundations' })]);
      expect(html).toContain('<h3 class="section-title">Math Foundations</h3>');
    });

    it('renders multiple sections', () => {
      const sections = [
        createSection({ id: 'section-a', title: 'Section A' }),
        createSection({ id: 'section-b', title: 'Section B' }),
      ];
      const html = renderRoadmapHtml(sections);
      expect(html).toContain('id="section-a"');
      expect(html).toContain('id="section-b"');
      expect(html).toContain('Section A');
      expect(html).toContain('Section B');
    });

    it('returns empty string for empty array', () => {
      expect(renderRoadmapHtml([])).toBe('');
    });
  });

  describe('topic rendering', () => {
    it('renders topic with correct id and data-node-id', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 'dc-circuits', title: 'DC Circuits', description: 'desc' }],
      })]);
      expect(html).toContain('id="dc-circuits"');
      expect(html).toContain('data-node-id="dc-circuits"');
    });

    it('renders node-button with aria-expanded="false"', () => {
      const html = renderRoadmapHtml([createSection()]);
      expect(html).toContain('aria-expanded="false"');
    });

    it('renders node-content with hidden attribute', () => {
      const html = renderRoadmapHtml([createSection()]);
      expect(html).toContain('<div class="node-content" hidden>');
    });

    it('renders description in p.node-description', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'Learn about voltage' }],
      })]);
      expect(html).toContain('<p class="node-description">Learn about voltage</p>');
    });

    it('adds roadmap-node--optional class when optional is true', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', optional: true }],
      })]);
      expect(html).toContain('roadmap-node--optional');
    });

    it('omits optional class when optional is false', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', optional: false }],
      })]);
      expect(html).not.toContain('roadmap-node--optional');
    });

    it('renders multiple topics in a section', () => {
      const html = renderRoadmapHtml([createSection({
        items: [
          { id: 'topic-a', title: 'Topic A', description: 'desc a' },
          { id: 'topic-b', title: 'Topic B', description: 'desc b' },
        ],
      })]);
      expect(html).toContain('data-node-id="topic-a"');
      expect(html).toContain('data-node-id="topic-b"');
    });
  });

  describe('prerequisites rendering', () => {
    it('renders nothing when no prerequisites', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', prerequisites: [] }],
      })]);
      expect(html).not.toContain('node-prereqs');
    });

    it('renders static prerequisite as span', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', prerequisites: ['Basic Math'] }],
      })]);
      expect(html).toContain('data-static-prereq="Basic Math"');
      expect(html).toContain('prereq--static');
      expect(html).toContain('>Basic Math<');
    });

    it('renders linked prerequisite as anchor', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          prerequisites: ['fundamentals/dc-circuits/DC Circuits'],
        }],
      })]);
      expect(html).toContain('<a href=');
      expect(html).toContain('prereq--link');
      expect(html).toContain('data-prereq-topic="dc-circuits"');
      expect(html).toContain('>DC Circuits<');
    });

    it('generates correct href for standard track prereqs', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          prerequisites: ['fundamentals/dc-circuits/DC Circuits'],
        }],
      })]);
      expect(html).toContain('href="/roadmaps/fundamentals/#dc-circuits"');
    });

    it('generates correct href for custom track prereqs', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          prerequisites: ['custom:my-track/my-topic/My Topic'],
        }],
      })]);
      expect(html).toContain('href="/roadmaps/custom/?track=my-track#my-topic"');
    });

    it('falls back to id with hyphens replaced when no display name', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          prerequisites: ['fundamentals/dc-circuits'],
        }],
      })]);
      expect(html).toContain('>dc circuits<');
    });

    it('renders prerequisites label', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          prerequisites: ['Basic Math'],
        }],
      })]);
      expect(html).toContain('Prerequisites:');
    });
  });

  describe('outcomes rendering', () => {
    it('renders nothing when no outcomes', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', outcomes: [] }],
      })]);
      expect(html).not.toContain('node-outcomes');
    });

    it('renders outcomes as list with label', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          outcomes: ['Apply KVL', 'Solve circuits'],
        }],
      })]);
      expect(html).toContain("You'll learn to:");
      expect(html).toContain('<ul class="outcomes-list">');
      expect(html).toContain('<li>Apply KVL</li>');
      expect(html).toContain('<li>Solve circuits</li>');
    });
  });

  describe('concepts rendering', () => {
    it('renders nothing when no concepts', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', concepts: [] }],
      })]);
      expect(html).not.toContain('node-concepts');
    });

    it('renders concepts as pills with data attributes', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 'dc-circuits', title: 'T', description: 'd',
          concepts: [{ name: 'Voltage' }, { name: 'Current' }],
        }],
      })]);
      expect(html).toContain('<ul class="node-concepts">');
      expect(html).toContain('class="pill concept-pill"');
      expect(html).toContain('data-topic-id="dc-circuits"');
      expect(html).toContain('data-concept="Voltage"');
      expect(html).toContain('data-concept="Current"');
    });
  });

  describe('resources rendering', () => {
    it('renders nothing when no resources', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{ id: 't', title: 'T', description: 'd', resources: [] }],
      })]);
      expect(html).not.toContain('node-resources');
    });

    it('renders resources as links with correct attributes', () => {
      const html = renderRoadmapHtml([createSection({
        items: [{
          id: 't', title: 'T', description: 'd',
          resources: [
            { label: 'MIT OCW', url: 'https://ocw.mit.edu' },
            { label: 'Khan Academy', url: 'https://khanacademy.org' },
          ],
        }],
      })]);
      expect(html).toContain('Resources:');
      expect(html).toContain('href="https://ocw.mit.edu"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('>MIT OCW<');
      expect(html).toContain('>Khan Academy<');
    });
  });
});
