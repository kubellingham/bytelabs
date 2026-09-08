import { describe, expect, it } from 'vitest';

import { conceptCount, getConcept, humaniseSlug } from '@/lib/brief/concepts';
import { hasNthOccurrence } from '@/lib/brief/solve';
import { solveResponseSchema } from '@/lib/brief/solve-types';
import { briefSessionSchema, briefTaskSchema, type BriefTask } from '@/lib/brief/types';
import { extractJson, resolvePythonVerdict } from '@/lib/brief/verdict';

const baseTask: BriefTask = briefTaskSchema.parse({
  id: 't01',
  title: 'Max, min, and count of 88',
  prompt: 'Print the max, min, and count of 88 for the given scores.',
  language: 'python',
  starterFiles: { 'main.py': 'scores = [45, 88, 72]\n' },
  expected: { kind: 'stdout-equals', value: 'Max: 100, Min: 45, Count of 88: 2' },
});

describe('brief schema', () => {
  it('defaults expected to self-mark when the parser omits it', () => {
    const task = briefTaskSchema.parse({
      id: 't99',
      title: 'A quiet task',
      prompt: 'Do the thing.',
      language: 'python',
    });
    expect(task.expected).toEqual({ kind: 'self-mark' });
    expect(task.starterFiles).toEqual({});
    expect(task.concepts).toEqual([]);
  });

  it('preserves concept order when the parser supplies it', () => {
    const task = briefTaskSchema.parse({
      id: 't10',
      title: 'Prime check',
      prompt: 'Print whether a number is prime.',
      language: 'python',
      concepts: ['input', 'for-loop', 'modulo', 'break'],
    });
    expect(task.concepts).toEqual(['input', 'for-loop', 'modulo', 'break']);
  });

  it('rejects a session without at least one task', () => {
    const bad = briefSessionSchema.safeParse({
      id: 's1',
      sourceLabel: 'Empty',
      createdAt: 1,
      tasks: [],
    });
    expect(bad.success).toBe(false);
  });
});

describe('concept library', () => {
  it('returns a fully-shaped explainer for known slugs', () => {
    const forLoop = getConcept('for-loop');
    expect(forLoop).not.toBeNull();
    expect(forLoop?.title).toMatch(/for loop/i);
    expect(forLoop?.snippet.length).toBeGreaterThan(0);
    expect(forLoop?.language).toBe('python');
  });

  it('returns null for unknown slugs', () => {
    expect(getConcept('prime-check')).toBeNull();
    expect(getConcept('')).toBeNull();
    expect(getConcept('not-a-real-concept')).toBeNull();
  });

  it('holds at least the beginner-Python vocabulary the on-ramp expects', () => {
    for (const slug of [
      'input',
      'print',
      'for-loop',
      'if-statement',
      'break',
      'modulo',
      'list-basics',
      'list-methods',
      'function-def',
      'return',
    ]) {
      expect(getConcept(slug), `missing library entry: ${slug}`).not.toBeNull();
    }
    expect(conceptCount()).toBeGreaterThanOrEqual(10);
  });

  it('humanises unknown slugs into title-case display strings', () => {
    expect(humaniseSlug('prime-check')).toBe('Prime check');
    expect(humaniseSlug('matplotlib_bar')).toBe('Matplotlib bar');
    expect(humaniseSlug('csv')).toBe('Csv');
    expect(humaniseSlug('')).toBe('');
  });
});

describe('resolvePythonVerdict', () => {
  it('is neutral before the code has run', () => {
    expect(resolvePythonVerdict(baseTask, null)).toEqual({
      tone: 'neutral',
      badge: null,
      detail: null,
    });
  });

  it('passes when stdout equals the expected value (whitespace tolerant)', () => {
    const verdict = resolvePythonVerdict(baseTask, {
      stdout: '  Max: 100, Min: 45, Count of 88: 2\n',
      stderr: '',
      error: null,
      durationMs: 5,
    });
    expect(verdict.tone).toBe('pass');
    expect(verdict.badge).toBe('Output matches');
  });

  it('fails with a helpful detail when stdout differs', () => {
    const verdict = resolvePythonVerdict(baseTask, {
      stdout: 'Max: 91',
      stderr: '',
      error: null,
      durationMs: 5,
    });
    expect(verdict.tone).toBe('fail');
    expect(verdict.detail).toContain('Max: 100, Min: 45, Count of 88: 2');
  });

  it('reports a fail on a Python error, regardless of stdout', () => {
    const verdict = resolvePythonVerdict(baseTask, {
      stdout: 'Max: 100, Min: 45, Count of 88: 2',
      stderr: '',
      error: "NameError: name 'x' is not defined",
      durationMs: 3,
    });
    expect(verdict.tone).toBe('fail');
    expect(verdict.badge).toBe('Error');
  });

  it('passes when stdout contains the expected substring', () => {
    const task = briefTaskSchema.parse({
      ...baseTask,
      expected: { kind: 'stdout-contains', value: 'prime' },
    });
    expect(
      resolvePythonVerdict(task, {
        stdout: '17 is a prime number.\n',
        stderr: '',
        error: null,
        durationMs: 1,
      }).tone,
    ).toBe('pass');
  });

  it('stays neutral for a self-mark task even when stdout is present', () => {
    const task = briefTaskSchema.parse({
      ...baseTask,
      expected: { kind: 'self-mark' },
    });
    const verdict = resolvePythonVerdict(task, {
      stdout: 'anything',
      stderr: '',
      error: null,
      durationMs: 1,
    });
    expect(verdict.tone).toBe('neutral');
    expect(verdict.detail).toBeTruthy();
  });
});

describe('solve — hasNthOccurrence', () => {
  const source = 'for i in range(2, n):\n    if n % i == 0:\n        is_prime = False\n        break';

  it('finds a substring that exists', () => {
    expect(hasNthOccurrence(source, 'for i in range(2, n):', 1)).toBe(true);
    expect(hasNthOccurrence(source, 'break', 1)).toBe(true);
  });

  it('returns false when the substring is not present', () => {
    expect(hasNthOccurrence(source, 'while True:', 1)).toBe(false);
    expect(hasNthOccurrence(source, '', 1)).toBe(false);
  });

  it('respects the occurrence index', () => {
    const doubled = 'break\nprint(n)\nbreak';
    expect(hasNthOccurrence(doubled, 'break', 1)).toBe(true);
    expect(hasNthOccurrence(doubled, 'break', 2)).toBe(true);
    expect(hasNthOccurrence(doubled, 'break', 3)).toBe(false);
  });
});

describe('solveResponseSchema', () => {
  it('parses a well-shaped walkthrough', () => {
    const parsed = solveResponseSchema.safeParse({
      solution: 'print("hi")',
      beats: [
        { find: 'print("hi")', note: 'This line prints hi.' },
        { find: '"hi"', note: 'That is our message.' },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // occurrence defaults to 1
      expect(parsed.data.beats[0]?.occurrence).toBe(1);
    }
  });

  it('rejects an empty beats array', () => {
    const parsed = solveResponseSchema.safeParse({ solution: 'x', beats: [] });
    expect(parsed.success).toBe(false);
  });
});

describe('extractJson', () => {
  it('parses a plain JSON object', () => {
    expect(extractJson('{"sourceLabel":"X","tasks":[]}')).toEqual({
      sourceLabel: 'X',
      tasks: [],
    });
  });

  it('salvages JSON wrapped in code fences', () => {
    const raw = '```json\n{"a":1}\n```';
    expect(extractJson(raw)).toEqual({ a: 1 });
  });

  it('salvages JSON with leading prose', () => {
    expect(extractJson('Here is your JSON:\n{"ok":true}')).toEqual({ ok: true });
  });

  it('returns null on nothing recognisable', () => {
    expect(extractJson('no braces here')).toBeNull();
    expect(extractJson('')).toBeNull();
    expect(extractJson('{ not valid }')).toBeNull();
  });
});
