import type { BriefTask } from './types';

export interface PythonRunResult {
  stdout: string;
  stderr: string;
  error: string | null;
  /** Wall time in milliseconds. */
  durationMs: number;
}

export interface Verdict {
  tone: 'pass' | 'fail' | 'neutral';
  badge: string | null;
  detail: string | null;
}

/**
 * Decide the verdict for a Python task given its output.
 *
 * Kept as a pure function so both the room UI and the tests can reach it
 * without dragging Pyodide or React into the picture.
 */
export function resolvePythonVerdict(task: BriefTask, result: PythonRunResult | null): Verdict {
  if (!result) return { tone: 'neutral', badge: null, detail: null };
  if (result.error) {
    return {
      tone: 'fail',
      badge: 'Error',
      detail: 'Fix the error above, then run again.',
    };
  }

  const expected = task.expected;
  switch (expected.kind) {
    case 'stdout-equals': {
      const got = result.stdout.trim();
      const want = expected.value.trim();
      return got === want
        ? { tone: 'pass', badge: 'Output matches', detail: null }
        : {
            tone: 'fail',
            badge: 'Output differs',
            detail: `Expected:\n${expected.value}`,
          };
    }
    case 'stdout-contains': {
      return result.stdout.includes(expected.value)
        ? { tone: 'pass', badge: 'Output matches', detail: null }
        : {
            tone: 'fail',
            badge: 'Output missing something',
            detail: `Expected output to contain: ${expected.value}`,
          };
    }
    case 'html-contains':
      // Python task with an HTML check is a parser inconsistency; degrade
      // gracefully rather than falsely marking pass or fail.
      return { tone: 'neutral', badge: null, detail: null };
    case 'self-mark':
      return {
        tone: 'neutral',
        badge: null,
        detail:
          'No oracle for this one — when your output matches what the brief asks for, mark it done.',
      };
  }
}

/**
 * Pull the first `{...}` JSON object out of raw model output. The parse
 * prompt says "no code fences", but if the model adds one anyway this
 * salvages the payload rather than failing the whole parse.
 */
export function extractJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const opener = trimmed.indexOf('{');
  const closer = trimmed.lastIndexOf('}');
  if (opener < 0 || closer <= opener) return null;
  try {
    return JSON.parse(trimmed.slice(opener, closer + 1));
  } catch {
    return null;
  }
}
