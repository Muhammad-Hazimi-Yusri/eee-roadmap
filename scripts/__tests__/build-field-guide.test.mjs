// Tests for the field-guide build: the real content must resolve cleanly,
// and broken references must be reported rather than silently dropped.

import { describe, it, expect } from 'vitest';
import { loadInputs, buildFieldGuide, VISUALS } from '../build-field-guide.mjs';

const FIXED_TIME = { generatedAt: '2026-10-24T00:00:00.000Z' };

function withTopic(inputs, patch) {
  const [first, ...rest] = inputs.topics;
  return { ...inputs, topics: [{ ...first, data: { ...first.data, ...patch } }, ...rest] };
}

describe('build-field-guide on the real content', () => {
  const inputs = loadInputs();
  const { guide, errors } = buildFieldGuide(inputs, FIXED_TIME);

  it('resolves every reference', () => {
    expect(errors).toEqual([]);
  });

  it('emits the five topics in order', () => {
    expect(guide.topics.map(t => t.id)).toEqual([
      'landscape', 'inertia-syncons', 'fault-ride-through', 'reactive-voltage', 'frequency-response',
    ]);
  });

  it('every topic has a visual, key ideas, a matrix and at least one reading', () => {
    for (const t of guide.topics) {
      expect(t.visuals.length, t.id).toBeGreaterThan(0);
      expect(t.keyIdeas.length, t.id).toBeGreaterThan(0);
      expect(t.matrix?.rows.length, t.id).toBeGreaterThan(0);
      expect(t.reading.length, t.id).toBeGreaterThan(0);
      for (const v of t.visuals) expect(VISUALS.has(v)).toBe(true);
    }
  });

  it('every key idea cites at least one clause, document or source', () => {
    for (const t of guide.topics) {
      for (const k of t.keyIdeas) expect(k.refs.length, `${t.id}: ${k.title}`).toBeGreaterThan(0);
    }
  });

  it('clause refs carry a document, a link and a viewer target', () => {
    const clauseRefs = guide.topics.flatMap(t => t.keyIdeas.flatMap(k => k.refs)).filter(r => r.kind === 'clause');
    expect(clauseRefs.length).toBeGreaterThan(10);
    for (const r of clauseRefs) {
      expect(r.doc.id).toBeTruthy();
      expect(r.href).toMatch(/^https:\/\//);
      expect(r.viewer.doc).toBe(r.doc.id);
    }
  });

  it('pinned PDF pages become #page deep links', () => {
    const scu = guide.cited.find(c => c.ref === 'eirgrid-grid-code/SCU1');
    expect(scu.href).toMatch(/GridCodeVersion17\.pdf#page=430$/);
  });

  it('concepts resolve to names and roadmap locations', () => {
    const swing = guide.topics.flatMap(t => t.concepts).find(c => c.id === 'the-swing-equation');
    expect(swing.name).toBeTruthy();
    expect(swing.locations.length).toBeGreaterThan(0);
    expect(swing.locations[0]).toHaveProperty('track');
    expect(swing.locations[0]).toHaveProperty('topicId');
  });

  it('textbook refs carry their verification status', () => {
    const reading = guide.topics.flatMap(t => t.reading);
    const kundur13 = reading.find(r => r.ref === 'kundur-1994' && r.label.includes('ch. 13'));
    expect(kundur13.status).toBe('inferred');
    const mach = reading.find(r => r.ref === 'machowski-2020' && r.label.includes('§6.3.4'));
    expect(mach.status).toBe('checked');
    expect(mach.page).toBe(252);
  });
});

describe('build-field-guide error reporting', () => {
  const inputs = loadInputs();

  it('reports an unknown clause', () => {
    const bad = withTopic(inputs, { keyIdeas: [{ title: 'x', body: 'y', refs: ['grid-code/ECC.9.9.9'] }] });
    const { errors } = buildFieldGuide(bad, FIXED_TIME);
    expect(errors.some(e => e.includes('unknown clause "grid-code/ECC.9.9.9"'))).toBe(true);
  });

  it('reports an unknown source section', () => {
    const bad = withTopic(inputs, { reading: [{ source: 'machowski-2020', section: '99.9' }] });
    const { errors } = buildFieldGuide(bad, FIXED_TIME);
    expect(errors.some(e => e.includes('has no section "99.9"'))).toBe(true);
  });

  it('reports an unknown concept, visual, related topic and matrix column', () => {
    const bad = withTopic(inputs, {
      concepts: ['no-such-concept'],
      visuals: ['no-such-visual'],
      related: ['no-such-topic'],
      matrix: { caption: '', rows: [{ param: 'p', cells: { XX: { text: 't' } } }] },
    });
    const { errors } = buildFieldGuide(bad, FIXED_TIME);
    expect(errors.some(e => e.includes('unknown concept "no-such-concept"'))).toBe(true);
    expect(errors.some(e => e.includes('unknown visual "no-such-visual"'))).toBe(true);
    expect(errors.some(e => e.includes('unknown related topic "no-such-topic"'))).toBe(true);
    expect(errors.some(e => e.includes('unknown column "XX"'))).toBe(true);
  });

  it('reports a topic whose id does not match its file name', () => {
    const bad = withTopic(inputs, { id: 'renamed' });
    const { errors } = buildFieldGuide(bad, FIXED_TIME);
    expect(errors.some(e => e.includes('must match the file name'))).toBe(true);
  });
});
