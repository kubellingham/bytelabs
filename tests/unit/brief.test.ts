import { describe, expect, it } from 'vitest';

import { conceptCount, getConcept, humaniseSlug } from '@/lib/brief/concepts';
import { applyCodeEditorKey } from '@/lib/brief/editor-keys';
import { formatPythonError } from '@/lib/brief/python-errors';
import {
  filterValidBlanks,
  hasNthOccurrence,
  makeGhostForRound,
  makeRewriteTemplate,
} from '@/lib/brief/solve';
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

describe('solve — filterValidBlanks', () => {
  const solution = 'for i in range(2, n):\n    if n % i == 0:\n        break';

  it('keeps blanks whose text is present in the solution', () => {
    expect(filterValidBlanks(solution, ['range(2, n)', 'n % i == 0', 'break'])).toEqual([
      'range(2, n)',
      'n % i == 0',
      'break',
    ]);
  });

  it('drops blanks whose text is not in the solution', () => {
    expect(filterValidBlanks(solution, ['while True:', 'break'])).toEqual(['break']);
  });

  it('drops blanks that overlap with an earlier accepted blank', () => {
    // "range" is a substring of "range(2, n)" — reject the later one.
    expect(filterValidBlanks(solution, ['range(2, n)', 'range'])).toEqual(['range(2, n)']);
  });

  it('caps the number of blanks at 5', () => {
    const big = 'a b c d e f g h';
    expect(filterValidBlanks(big, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toHaveLength(5);
  });

  it('drops empty or over-long blanks', () => {
    expect(filterValidBlanks(solution, ['', 'x'.repeat(60), 'break'])).toEqual(['break']);
  });
});

describe('solve — makeRewriteTemplate', () => {
  it('replaces each blank with a placeholder', () => {
    const solution = 'for i in range(2, n):\n    break';
    expect(makeRewriteTemplate(solution, ['range(2, n)', 'break'])).toBe(
      'for i in ____:\n    ____',
    );
  });

  it('returns the source verbatim when there are no blanks', () => {
    expect(makeRewriteTemplate('print("hi")', [])).toBe('print("hi")');
  });
});

describe('solve — makeGhostForRound', () => {
  const solution = 'for i in range(2, n):\n    if n % i == 0:\n        break';

  it('round 1 shows the full solution unchanged', () => {
    expect(makeGhostForRound(solution, ['range(2, n)', 'break'], 1)).toBe(solution);
  });

  it('round 2 replaces blanks with same-length whitespace', () => {
    const ghost = makeGhostForRound(solution, ['range(2, n)', 'break'], 2);
    // Length is preserved so the visual grid aligns.
    expect(ghost).toHaveLength(solution.length);
    // Blanks are gone (as content) but the surrounding characters are intact.
    expect(ghost).toContain('for i in ');
    expect(ghost).not.toContain('range(2, n)');
    expect(ghost).not.toContain('break');
    // Newlines inside a blank stay as newlines so wrapping doesn't shift.
    const multi = makeGhostForRound('a\nb', ['a\nb'], 2);
    expect(multi).toBe(' \n ');
  });

  it('is a no-op in round 2 when there are no blanks', () => {
    expect(makeGhostForRound(solution, [], 2)).toBe(solution);
  });
});

describe('python-errors — formatPythonError', () => {
  it('strips Pyodide internal frames and renames <exec> to main.py', () => {
    // The exact trace the learner reported, verbatim.
    const raw = `Traceback (most recent call last):
  File "/lib/python313.zip/_pyodide/_base.py", line 597, in eval_code_async
    await CodeRunner(
          ~~~~~~~~~~^
        source,
        ^^^^^^^
    ...<5 lines>...
        optimize=optimize,
        ^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/lib/python313.zip/_pyodide/_base.py", line 285, in __init__
    self.ast = next(self._gen)
               ~~~~^^^^^^^^^^^
  File "/lib/python313.zip/_pyodide/_base.py", line 149, in _parse_and_compile_gen
    mod = compile(source, filename, mode, flags | ast.PyCF_ONLY_AST)
  File "<exec>", line 2
    is-print = True
    ^^
SyntaxError: invalid syntax`;

    const formatted = formatPythonError(raw);

    // The internal frames are gone.
    expect(formatted).not.toContain('_pyodide');
    expect(formatted).not.toContain('eval_code_async');
    expect(formatted).not.toContain('_parse_and_compile_gen');
    expect(formatted).not.toContain('<exec>');

    // The learner-relevant parts survive.
    expect(formatted).toContain('main.py');
    expect(formatted).toContain('line 2');
    expect(formatted).toContain('is-print = True');
    expect(formatted).toContain('SyntaxError: invalid syntax');
    // The Traceback header stays because one frame remains under it.
    expect(formatted.startsWith('Traceback')).toBe(true);
  });

  it('drops a "Traceback:" header that has no frames left under it', () => {
    const raw = `Traceback (most recent call last):
  File "/lib/python313.zip/_pyodide/_base.py", line 597, in eval_code_async
    await CodeRunner(...)
NameError: name 'x' is not defined`;
    const formatted = formatPythonError(raw);
    expect(formatted.startsWith('Traceback')).toBe(false);
    expect(formatted).toContain('NameError');
  });

  it('leaves a message with no traceback untouched', () => {
    expect(formatPythonError('KeyboardInterrupt')).toBe('KeyboardInterrupt');
    expect(formatPythonError('')).toBe('');
  });
});

describe('editor-keys — applyCodeEditorKey', () => {
  const key = (opts: Partial<{ key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }>) => ({
    key: 'a',
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...opts,
  });

  it('Tab inserts four spaces at the cursor', () => {
    const result = applyCodeEditorKey(key({ key: 'Tab' }), 'foo', 3, 3);
    expect(result).toEqual({ next: 'foo    ', cursor: 7 });
  });

  it('Tab replaces the current selection with four spaces', () => {
    const result = applyCodeEditorKey(key({ key: 'Tab' }), 'foo bar', 4, 7);
    expect(result).toEqual({ next: 'foo     ', cursor: 8 });
  });

  it('Enter preserves the current line indentation', () => {
    // cursor after "    x"
    const source = '    x';
    const result = applyCodeEditorKey(key({ key: 'Enter' }), source, 5, 5);
    expect(result).toEqual({ next: '    x\n    ', cursor: 10 });
  });

  it('Enter after a `:` adds four extra spaces', () => {
    const source = 'if n < 2:';
    const result = applyCodeEditorKey(key({ key: 'Enter' }), source, 9, 9);
    expect(result).toEqual({ next: 'if n < 2:\n    ', cursor: 14 });
  });

  it('Enter after nested `:` compounds indentation (previous indent + 4)', () => {
    const source = '    for i in range(2, n):';
    const result = applyCodeEditorKey(key({ key: 'Enter' }), source, source.length, source.length);
    // 4 leading + 4 extra = 8 spaces
    expect(result?.next.endsWith('\n        ')).toBe(true);
    expect(result?.cursor).toBe(source.length + 1 + 8);
  });

  it('leaves plain character keys alone', () => {
    expect(applyCodeEditorKey(key({ key: 'a' }), 'foo', 3, 3)).toBeNull();
  });

  it('never handles Ctrl/Meta chords — they belong to the caller', () => {
    expect(applyCodeEditorKey(key({ key: 'Enter', ctrlKey: true }), 'foo', 3, 3)).toBeNull();
    expect(applyCodeEditorKey(key({ key: 'Tab', metaKey: true }), 'foo', 3, 3)).toBeNull();
  });

  it('Shift+Tab is not handled (leaves default focus behaviour)', () => {
    expect(applyCodeEditorKey(key({ key: 'Tab', shiftKey: true }), 'foo', 3, 3)).toBeNull();
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
