// Unit tests for the clause-id matcher in pdf-extract.ts. We don't test
// the PDF.js loader path here — that's covered by manual integration
// testing in the browser (Node lacks the DOM the worker needs).

import { describe, it, expect } from 'vitest';
import { buildClauseRegex } from '../pdf-extract';

describe('buildClauseRegex', () => {
  it('matches an exact clause ID', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('see ECC.6.3.7 for details')).toBe(true);
  });

  it('matches a clause ID with surrounding punctuation', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('(ECC.6.3.7)')).toBe(true);
    expect(buildClauseRegex('13.2').test('Section 13.2 — Frequency Response')).toBe(true);
  });

  it('tolerates whitespace between segments', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('ECC 6 3 7 elsewhere')).toBe(true);
    expect(buildClauseRegex('ECC.6.3.7').test('ECC.\n6.3.7 wrapped')).toBe(true);
  });

  it('tolerates mixed dots and spaces', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('ECC. 6.3.7')).toBe(true);
    expect(buildClauseRegex('ECC.6.3.7').test('ECC 6.3.7')).toBe(true);
  });

  it('handles letter+digit IDs like BC3', () => {
    expect(buildClauseRegex('BC3').test('BC3 is the commercial code')).toBe(true);
    expect(buildClauseRegex('BC3').test('BC 3 is the commercial code')).toBe(true);
  });

  it('handles long dotted IDs like ECC.6.3.15.10', () => {
    expect(buildClauseRegex('ECC.6.3.15.10').test('see ECC.6.3.15.10 envelope')).toBe(true);
  });

  it("doesn't match substrings of larger numbers", () => {
    // Table 13.2-1 should not match 13.2
    expect(buildClauseRegex('13.2').test('Table 13.2-1')).toBe(false);
  });

  it("doesn't match if a digit continues past the end", () => {
    // 6.3.7 should not match 6.3.75
    expect(buildClauseRegex('6.3.7').test('clause 6.3.75')).toBe(false);
  });

  it("doesn't match if a letter continues past the end", () => {
    // ECC.6.3 should not match ECC.6.3X
    expect(buildClauseRegex('ECC.6.3').test('ECC.6.3X')).toBe(false);
  });

  it('handles ENA bare clause IDs (no leading letters)', () => {
    expect(buildClauseRegex('13.2').test('clause 13.2 covers FSM')).toBe(true);
    expect(buildClauseRegex('13.6').test('Section 13.6.')).toBe(true);
  });

  it('returns a never-match regex for empty input', () => {
    expect(buildClauseRegex('').test('anything at all')).toBe(false);
  });
});
