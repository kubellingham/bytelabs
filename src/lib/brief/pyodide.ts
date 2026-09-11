'use client';

/**
 * Lazy Pyodide loader.
 *
 * Pyodide is ~10 MB the first time (CPython + stdlib compiled to WebAssembly),
 * so we load it exactly once, on demand, from jsdelivr's CDN. The tab holds the
 * instance for the rest of its life. Subsequent tasks in the same brief reuse it
 * with zero cost.
 *
 * Runs on the main thread for MVP. The programs students write for a Python
 * laboratory course are tiny — a max/min calc, a palindrome check — and finish
 * in milliseconds. A Web Worker sandbox is a later refinement.
 */

const PYODIDE_VERSION = '0.28.3';
const CDN_ROOT = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  setStdin: (options: { stdin: () => string | null }) => void;
  globals: { set: (name: string, value: unknown) => void };
}

interface PyodideGlobal {
  loadPyodide: (options: { indexURL: string }) => Promise<PyodideInstance>;
}

declare global {
  interface Window {
    loadPyodide?: PyodideGlobal['loadPyodide'];
  }
}

let cached: Promise<PyodideInstance> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-brief-pyodide]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.briefPyodide = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

export function loadPyodideOnce(): Promise<PyodideInstance> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Pyodide is client-only.'));
  }
  if (cached) return cached;
  cached = (async () => {
    await loadScript(`${CDN_ROOT}/pyodide.js`);
    if (typeof window.loadPyodide !== 'function') {
      throw new Error('Pyodide loader did not attach to window.');
    }
    return window.loadPyodide({ indexURL: `${CDN_ROOT}/` });
  })();
  return cached;
}

import { formatPythonError } from './python-errors';
import type { PythonRunResult } from './verdict';
export type { PythonRunResult } from './verdict';

export interface RunPythonOptions {
  /**
   * Values fed line-by-line into `input()` calls. Each `input()` in the
   * program consumes one entry.
   *
   * When the queue runs dry, the runtime falls back to `promptFallback`
   * (if provided) so the learner can still enter a value — cached
   * walkthroughs from before expectedInput existed still work this way,
   * and interactive tasks can ask the browser for input directly.
   */
  stdin?: readonly string[];
  /**
   * Called when `input()` fires and no queued stdin lines remain. Return
   * the value (as if the user typed it), or `null` to signal EOF.
   * A common implementation is `() => window.prompt('Input:')`.
   */
  promptFallback?: () => string | null;
}

/**
 * Run a Python program and capture what it prints.
 *
 * When the caller passes a `stdin` list (e.g. the walkthrough's
 * expectedInput, split into lines), each `input()` call in the program
 * consumes the next line. This lets a solution written for `input()`
 * actually run in the browser even though Pyodide has no real terminal.
 */
export async function runPython(
  code: string,
  options: RunPythonOptions = {},
): Promise<PythonRunResult> {
  const pyodide = await loadPyodideOnce();
  const stdout: string[] = [];
  const stderr: string[] = [];
  // Pyodide's batched stdout callback strips the trailing newline before
  // handing each chunk to us. We reconstruct it — without this, three
  // print() calls come back as one glued-together line.
  pyodide.setStdout({ batched: (text) => stdout.push(text + '\n') });
  pyodide.setStderr({ batched: (text) => stderr.push(text + '\n') });

  const queue = (options.stdin ?? []).slice();
  const fallback = options.promptFallback;
  pyodide.setStdin({
    stdin: () => {
      if (queue.length > 0) return queue.shift() ?? null;
      if (fallback) return fallback();
      return null;
    },
  });

  const started = performance.now();
  let error: string | null = null;
  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    error = formatPythonError(raw);
  }
  const durationMs = performance.now() - started;
  return { stdout: stdout.join(''), stderr: stderr.join(''), error, durationMs };
}

/**
 * Turn a multi-line stdin blob into the array `runPython` expects.
 * Empty input becomes an empty array. Trailing newline is stripped so
 * "7\n" and "7" both mean "one line: 7".
 */
export function stdinLines(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const trimmed = raw.endsWith('\n') ? raw.slice(0, -1) : raw;
  return trimmed.split('\n');
}
