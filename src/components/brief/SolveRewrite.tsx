'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadPyodideOnce, runPython } from '@/lib/brief/pyodide';
import { makeRewriteTemplate } from '@/lib/brief/solve';
import type { SolveResponse } from '@/lib/brief/solve-types';

interface Props {
  solve: SolveResponse;
  onDone: () => void;
  onBack: () => void;
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'pass'; got: string }
  | { phase: 'fail'; got: string; error: string | null };

/**
 * The REWRITE phase.
 *
 * The learner sees the solution again, but this time some of its meaningful
 * pieces are replaced with `____` placeholders. They fill in the blanks
 * (typing over the placeholders) and hit Run. The pass check is stdout
 * matching the reference `expectedOutput`. A "Show me the solution" escape
 * hatch reveals the answer for anyone who is properly stuck.
 */
export function SolveRewrite({ solve, onDone, onBack }: Props) {
  const template = useMemo(
    () => makeRewriteTemplate(solve.solution, solve.blanks),
    [solve.solution, solve.blanks],
  );
  const [source, setSource] = useState(template);
  const [run, setRun] = useState<RunState>({ phase: 'idle' });
  const [showReveal, setShowReveal] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    editorRef.current?.focus();
    void loadPyodideOnce();
  }, []);

  const expected = solve.expectedOutput?.trim() ?? '';

  const onRun = useCallback(async () => {
    setRun({ phase: 'running' });
    const result = await runPython(source);
    const got = result.stdout.trim();
    if (result.error) {
      setRun({ phase: 'fail', got, error: result.error });
      return;
    }
    if (expected && got === expected) {
      setRun({ phase: 'pass', got });
      return;
    }
    setRun({ phase: 'fail', got, error: null });
  }, [source, expected]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void onRun();
      }
    },
    [onRun],
  );

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-start px-8 py-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          Now you type it
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted hover:text-ink"
        >
          ← Back to breakdown
        </button>
      </div>

      <h1 className="mt-3 text-[length:var(--bl-step-2)] font-semibold text-ink">
        Fill in the {solve.blanks.length}{' '}
        blank{solve.blanks.length === 1 ? '' : 's'}.
      </h1>
      <p className="mt-2 max-w-2xl text-base text-muted">
        The structure is here to guide you. Replace each <code className="rounded bg-raised px-1 font-mono text-ink">____</code>{' '}
        with what belongs there, then hit Run. Nothing to lose — mistakes are how you know.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-code">
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Your editor
          </p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
            ⌘/Ctrl + Enter to run
          </p>
        </div>
        <textarea
          ref={editorRef}
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            if (run.phase !== 'idle') setRun({ phase: 'idle' });
          }}
          onKeyDown={onKeyDown}
          rows={Math.max(6, source.split('\n').length + 1)}
          spellCheck={false}
          className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-ink outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={run.phase === 'running' || source.trim().length === 0}
          className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
        >
          {run.phase === 'running' ? 'Running…' : 'Run'}
        </button>
        {run.phase === 'pass' ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-success/60 bg-success-soft px-5 py-3 text-base font-medium text-ink transition-colors hover:bg-success-soft/80"
          >
            Nice — that’s it →
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowReveal((r) => !r)}
          className="ms-auto text-sm text-muted hover:text-ink"
        >
          {showReveal ? 'Hide the solution' : 'Stuck? Show me the solution'}
        </button>
      </div>

      {run.phase !== 'idle' && run.phase !== 'running' ? (
        <div
          role="status"
          className={`mt-4 rounded-xl border p-4 ${
            run.phase === 'pass'
              ? 'border-success/40 bg-success-soft/50'
              : 'border-danger/40 bg-danger-soft/40'
          }`}
        >
          <p className="mb-1 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            {run.phase === 'pass' ? 'Output matches' : 'Not yet — your output was'}
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm text-ink">
            {run.phase === 'fail' && run.error ? run.error : run.got || '(no output)'}
          </pre>
          {run.phase === 'fail' && !run.error && expected ? (
            <>
              <p className="mt-3 mb-1 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
                Expected
              </p>
              <pre className="whitespace-pre-wrap font-mono text-sm text-muted">{expected}</pre>
            </>
          ) : null}
        </div>
      ) : null}

      {showReveal ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-attention/40 bg-attention-soft/40">
          <div className="flex items-center justify-between border-b border-attention/30 px-4 py-2">
            <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
              The solution — try again first, then peek
            </p>
          </div>
          <pre className="overflow-x-auto px-4 py-3 font-mono text-sm text-ink">
            {solve.solution}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
