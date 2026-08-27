import { describe, expect, it } from 'vitest';

import { completionRatio, newlyMatchedConcepts, resolveLines } from '@/lib/editor/resolve';

describe('resolveLines', () => {
  it('shows the whole target line as ghost when nothing is typed', () => {
    const result = resolveLines('', '<h1>Hello</h1>');
    expect(result.lines[0]).toEqual({ state: 'untouched', remainder: '<h1>Hello</h1>' });
  });

  it('shows the remainder while a line is partially typed', () => {
    const result = resolveLines('<h1>Hel', '<h1>Hello</h1>');
    expect(result.lines[0]?.state).toBe('partial');
    expect(result.lines[0]?.remainder).toBe('lo</h1>');
  });

  it('resolves a line once it matches', () => {
    const result = resolveLines('<h1>Hello</h1>', '<h1>Hello</h1>');
    expect(result.lines[0]?.state).toBe('matched');
    expect(result.lines[0]?.remainder).toBe('');
  });

  it('ignores trailing whitespace', () => {
    expect(resolveLines('<p>a</p>   ', '<p>a</p>').lines[0]?.state).toBe('matched');
  });

  it('accepts correct content with different indentation', () => {
    // Indentation is taught by the ghost above, not enforced by refusing to resolve.
    expect(resolveLines('<p>a</p>', '    <p>a</p>').lines[0]?.state).toBe('matched');
  });

  it('marks a genuinely different line as diverged, not as an error', () => {
    const result = resolveLines('<div>whatever</div>', '<h1>Hello</h1>');
    expect(result.lines[0]?.state).toBe('diverged');
    expect(result.lines[0]?.remainder).toBe('');
  });

  it('allows the learner to write past the end of the target', () => {
    const result = resolveLines('<p>a</p>\n<p>mine</p>', '<p>a</p>');
    expect(result.lines[1]?.state).toBe('diverged');
    expect(result.pending).toEqual([]);
  });

  it('reports target lines not yet reached', () => {
    const result = resolveLines('<h1>A</h1>', '<h1>A</h1>\n<p>B</p>\n<p>C</p>');
    expect(result.pending).toEqual(['<p>B</p>', '<p>C</p>']);
  });

  it('does not award credit for blank lines', () => {
    const result = resolveLines('\n\n', '\n\n');
    expect(result.matchedCount).toBe(0);
    expect(result.meaningfulTarget).toBe(0);
    expect(completionRatio(result)).toBe(1);
  });

  it('reaches full completion when the whole target is typed', () => {
    const target = '<h1>A</h1>\n<p>B</p>';
    expect(completionRatio(resolveLines(target, target))).toBe(1);
  });
});

describe('newlyMatchedConcepts', () => {
  const target = '<h1>A</h1>\n<p>B</p>';
  const lineConcepts = [['heading-outline'], ['paragraphs']];

  it('credits a concept when its line first resolves', () => {
    const before = resolveLines('', target);
    const after = resolveLines('<h1>A</h1>', target);
    expect(newlyMatchedConcepts(before, after, lineConcepts)).toEqual(['heading-outline']);
  });

  it('does not credit the same line twice', () => {
    const first = resolveLines('<h1>A</h1>', target);
    const second = resolveLines('<h1>A</h1>\n<p>', target);
    expect(newlyMatchedConcepts(first, second, lineConcepts)).toEqual([]);
  });

  it('credits every concept on a line that resolves', () => {
    const before = resolveLines('', '<a href="#">x</a>');
    const after = resolveLines('<a href="#">x</a>', '<a href="#">x</a>');
    expect(newlyMatchedConcepts(before, after, [['links', 'a11y']]).sort()).toEqual(['a11y', 'links']);
  });
});
