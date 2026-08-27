import { describe, expect, it } from 'vitest';

import {
  annotationAt,
  nthIndexOf,
  resolveAnnotation,
  resolveAnnotations,
} from '@/lib/content/annotations';
import type { Annotation } from '@/lib/content/schema';

const anno = (over: Partial<Annotation> & Pick<Annotation, 'id' | 'find' | 'label'>): Annotation => ({
  occurrence: 1,
  concepts: [],
  ...over,
});

const LINE = '    <link rel="stylesheet" href="styles.css">\n';
const FILES = { 'index.html': LINE, 'styles.css': 'body { color: red; }\n' };

describe('nthIndexOf', () => {
  it('finds the first occurrence by default', () => {
    expect(nthIndexOf('a b a b', 'a', 1)).toBe(0);
  });

  it('finds a later occurrence', () => {
    expect(nthIndexOf('a b a b', 'a', 2)).toBe(4);
  });

  it('reports -1 when there are not that many', () => {
    expect(nthIndexOf('a b', 'a', 2)).toBe(-1);
    expect(nthIndexOf('a b', 'z', 1)).toBe(-1);
  });
});

describe('resolveAnnotation', () => {
  it('locates a fragment and reports its exact range', () => {
    const found = resolveAnnotation(
      anno({ id: 'a', find: 'href="styles.css"', label: 'where to find it' }),
      FILES,
      'index.html',
    );
    expect(found).not.toBeNull();
    expect(LINE.slice(found!.from, found!.to)).toBe('href="styles.css"');
  });

  it('returns null when the fragment has not been typed yet', () => {
    // Not an error — the learner simply has not written it, which is the normal
    // case while a practice step is in progress.
    expect(
      resolveAnnotation(anno({ id: 'a', find: '<main>', label: 'main' }), FILES, 'index.html'),
    ).toBeNull();
  });

  it('honours an explicit file', () => {
    const found = resolveAnnotation(
      anno({ id: 'a', find: 'color', label: 'the property', file: 'styles.css' }),
      FILES,
      'index.html',
    );
    expect(found?.file).toBe('styles.css');
  });

  it('returns null for a file that is not in the workspace', () => {
    expect(
      resolveAnnotation(anno({ id: 'a', find: 'x', label: 'x', file: 'nope.js' }), FILES, 'index.html'),
    ).toBeNull();
  });

  it('picks the requested occurrence when a fragment repeats', () => {
    const files = { 'index.html': '<p>one</p>\n<p>two</p>\n' };
    const second = resolveAnnotation(
      anno({ id: 'a', find: '<p>', label: 'the second paragraph', occurrence: 2 }),
      files,
      'index.html',
    );
    expect(second?.from).toBe(11);
  });
});

describe('resolveAnnotations', () => {
  it('keeps authored order and drops what is not present yet', () => {
    const partial = { 'index.html': '<link rel="stylesheet"' };
    const resolved = resolveAnnotations(
      [
        anno({ id: 'a', find: '<link', label: 'the element' }),
        anno({ id: 'b', find: 'rel="stylesheet"', label: 'the relationship' }),
        anno({ id: 'c', find: 'href="styles.css"', label: 'where to find it' }),
      ],
      partial,
      'index.html',
    );

    // Reads left to right through the line, and the untyped third is simply absent.
    expect(resolved.map((r) => r.annotation.id)).toEqual(['a', 'b']);
  });

  it('resolves against the learner’s own document, not just the demo’s', () => {
    // The whole reason positions are searched rather than stored: the learner's
    // file is a different string, but the fragment is the same.
    const learner = { 'index.html': '<link rel="stylesheet" href="styles.css">' };
    const resolved = resolveAnnotations(
      [anno({ id: 'a', find: 'href="styles.css"', label: 'where to find it' })],
      learner,
      'index.html',
    );
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.from).toBe(23);
  });
});

describe('annotationAt', () => {
  const resolved = resolveAnnotations(
    [
      anno({ id: 'tag', find: '<link rel="stylesheet" href="styles.css">', label: 'the whole tag' }),
      anno({ id: 'href', find: 'href="styles.css"', label: 'where to find it' }),
    ],
    FILES,
    'index.html',
  );

  it('prefers the smallest fragment containing the click', () => {
    const hrefStart = LINE.indexOf('href=') + 2;
    // Clicking inside href explains href, not the tag that wraps it.
    expect(annotationAt(resolved, 'index.html', hrefStart)?.annotation.id).toBe('href');
  });

  it('falls back to the enclosing fragment elsewhere', () => {
    expect(annotationAt(resolved, 'index.html', LINE.indexOf('<link') + 2)?.annotation.id).toBe('tag');
  });

  it('reports nothing outside every range, and for another file', () => {
    expect(annotationAt(resolved, 'index.html', 0)).toBeNull();
    expect(annotationAt(resolved, 'styles.css', 10)).toBeNull();
  });
});
