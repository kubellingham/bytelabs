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

import type { PythonRunResult } from './verdict';
export type { PythonRunResult } from './verdict';

/**
 * Run a Python program and capture what it prints.
 *
 * stdin is not supported yet. When the paste's task expects the learner to
 * hard-code inputs into the source (which most beginner practicals do), that's
 * fine; when it expects `input()` interaction, the room falls back to self-mark.
 */
export async function runPython(code: string): Promise<PythonRunResult> {
  const pyodide = await loadPyodideOnce();
  const stdout: string[] = [];
  const stderr: string[] = [];
  pyodide.setStdout({ batched: (text) => stdout.push(text) });
  pyodide.setStderr({ batched: (text) => stderr.push(text) });

  const started = performance.now();
  let error: string | null = null;
  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const durationMs = performance.now() - started;
  return { stdout: stdout.join(''), stderr: stderr.join(''), error, durationMs };
}
