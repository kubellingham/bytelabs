'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Workspace } from '@/components/editor/Workspace';
import { loadPyodideOnce, runPython } from '@/lib/brief/pyodide';
import type { BriefTask } from '@/lib/brief/types';
import { resolvePythonVerdict, type PythonRunResult } from '@/lib/brief/verdict';

type Status = 'booting' | 'idle' | 'running' | 'complete';

interface Props {
  task: BriefTask;
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  onPass: () => void;
}

export function PythonRoom({ task, files, onFilesChange, onPass }: Props) {
  // 'booting' from the start — Pyodide is not yet loaded on mount. The effect
  // below flips to 'idle' once its promise resolves.
  const [status, setStatus] = useState<Status>('booting');
  const [result, setResult] = useState<PythonRunResult | null>(null);
  const [activePath, setActivePath] = useState('main.py');

  // Warm Pyodide as soon as the room mounts — the first-run cost lands during
  // reading time, not after the learner has clicked Run.
  useEffect(() => {
    let cancelled = false;
    loadPyodideOnce()
      .then(() => {
        if (!cancelled) setStatus('idle');
      })
      .catch(() => {
        if (!cancelled) setStatus('idle');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const paths = useMemo(() => Object.keys(files), [files]);
  const activeFile =
    files[activePath] !== undefined ? activePath : (paths[0] ?? 'main.py');

  const handleChange = useCallback(
    (path: string, value: string) => onFilesChange({ ...files, [path]: value }),
    [files, onFilesChange],
  );

  const run = useCallback(async () => {
    setStatus('running');
    const primary = files[activeFile] ?? '';
    const output = await runPython(primary);
    setResult(output);
    setStatus('complete');
  }, [files, activeFile]);

  const verdict = useMemo(() => resolvePythonVerdict(task, result), [task, result]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-4" aria-label="Editor and output">
      <div className="flex min-h-0 flex-[3] flex-col">
        <Workspace
          files={files}
          activePath={activeFile}
          onSelect={setActivePath}
          onChange={handleChange}
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={status === 'running' || status === 'booting'}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
        >
          {status === 'booting'
            ? 'Warming Python…'
            : status === 'running'
              ? 'Running…'
              : 'Run'}
        </button>
        {result ? (
          <span className="text-xs text-subtle">
            {Math.round(result.durationMs)} ms
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-[2] flex-col overflow-hidden rounded-lg border border-line bg-code">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2">
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Output
          </p>
          {verdict.badge ? (
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                verdict.tone === 'pass'
                  ? 'bg-success-soft text-success'
                  : verdict.tone === 'fail'
                    ? 'bg-danger-soft text-danger'
                    : 'bg-raised text-muted'
              }`}
            >
              {verdict.badge}
            </span>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed">
          {result ? (
            <>
              {result.stdout ? (
                <pre className="whitespace-pre-wrap text-ink">{result.stdout}</pre>
              ) : (
                <p className="text-subtle">no output</p>
              )}
              {result.stderr ? (
                <pre className="mt-2 whitespace-pre-wrap text-attention">{result.stderr}</pre>
              ) : null}
              {result.error ? (
                <pre className="mt-2 whitespace-pre-wrap text-danger">{result.error}</pre>
              ) : null}
              {verdict.detail ? (
                <p className="mt-4 text-sm text-muted">{verdict.detail}</p>
              ) : null}
            </>
          ) : (
            <p className="text-subtle">
              Run your code to see its output here.
            </p>
          )}
        </div>
      </div>

      {verdict.tone === 'pass' ? (
        <button
          type="button"
          onClick={onPass}
          className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Next task
        </button>
      ) : task.expected.kind === 'self-mark' && result && !result.error ? (
        <button
          type="button"
          onClick={onPass}
          className="shrink-0 rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
        >
          Mark it done — move on
        </button>
      ) : null}
    </section>
  );
}

