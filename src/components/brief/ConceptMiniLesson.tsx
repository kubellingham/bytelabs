'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadPyodideOnce, runPython } from '@/lib/brief/pyodide';
import type { ConceptStep, MiniLesson, TypeStep } from '@/lib/brief/concepts';

interface Props {
  mini: MiniLesson;
  onComplete: () => void;
}

/**
 * The interactive concept walkthrough.
 *
 * Runs a mini-lesson one step at a time. Teach steps are a paragraph and a
 * Continue button. Type steps are copy-and-type: the learner reads the target,
 * types it into a mini editor, runs it, and only advances when their output
 * matches. This is where the on-ramp stops being a slide deck and becomes the
 * "learn by doing" experience.
 *
 * Pyodide is warmed as soon as the mini-lesson mounts, so by the time the
 * learner reaches the first type step the Python runtime is usually already
 * loaded and the Run button lands instantly.
 */
export function ConceptMiniLesson({ mini, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [pyReady, setPyReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPyodideOnce()
      .then(() => {
        if (!cancelled) setPyReady(true);
      })
      .catch(() => {
        if (!cancelled) setPyReady(true); // let the Run button surface the error itself
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const step = mini.steps[index];
  const isLast = index >= mini.steps.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex(index + 1);
  }, [index, isLast, onComplete]);

  if (!step) return null;

  return (
    <div className="mt-6">
      <div className="mb-6 flex items-center gap-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          Step {index + 1} of {mini.steps.length}
        </p>
        <StepDots count={mini.steps.length} activeIndex={index} />
      </div>

      {step.kind === 'teach' ? (
        <TeachView key={index} body={step.body} isLast={isLast} onAdvance={advance} />
      ) : (
        <TypeView key={index} step={step} pyReady={pyReady} isLast={isLast} onAdvance={advance} />
      )}
    </div>
  );
}

function StepDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${
            i < activeIndex ? 'bg-accent' : i === activeIndex ? 'bg-accent' : 'bg-line-strong'
          }`}
        />
      ))}
    </div>
  );
}

function TeachView({
  body,
  isLast,
  onAdvance,
}: {
  body: string;
  isLast: boolean;
  onAdvance: () => void;
}) {
  return (
    <div>
      <p className="max-w-2xl text-lg leading-relaxed text-ink">{body}</p>
      <div className="mt-8">
        <button
          type="button"
          onClick={onAdvance}
          className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          {isLast ? 'Done with this concept →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'pass'; got: string }
  | { phase: 'fail'; got: string; error: string | null };

function TypeView({
  step,
  pyReady,
  isLast,
  onAdvance,
}: {
  step: TypeStep;
  pyReady: boolean;
  isLast: boolean;
  onAdvance: () => void;
}) {
  const [source, setSource] = useState('');
  const [run, setRun] = useState<RunState>({ phase: 'idle' });
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  const onRun = useCallback(async () => {
    setRun({ phase: 'running' });
    const result = await runPython(source);
    const got = result.stdout.trim();
    const want = step.expected.trim();
    if (result.error) {
      setRun({ phase: 'fail', got, error: result.error });
      return;
    }
    if (got === want) {
      setRun({ phase: 'pass', got });
      return;
    }
    setRun({ phase: 'fail', got, error: null });
  }, [source, step.expected]);

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
    <div>
      <p className="max-w-2xl text-lg leading-relaxed text-ink">{step.instruction}</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-code">
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Type this
          </p>
          <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">python</p>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-relaxed text-ink select-all">
          {step.code}
        </pre>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
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
          rows={3}
          spellCheck={false}
          className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-ink outline-none placeholder:text-subtle"
          placeholder={pyReady ? 'Type it here…' : 'Warming Python…'}
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
            onClick={onAdvance}
            className="rounded-lg border border-success/60 bg-success-soft px-5 py-3 text-base font-medium text-ink transition-colors hover:bg-success-soft/80"
          >
            {isLast ? 'Done with this concept →' : 'Next step →'}
          </button>
        ) : null}
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
            {run.phase === 'pass' ? 'That matched' : 'Not yet — output was'}
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm text-ink">
            {run.phase === 'fail' && run.error ? run.error : run.got || '(no output)'}
          </pre>
          {run.phase === 'fail' && !run.error ? (
            <p className="mt-2 text-sm text-muted">
              Expected: <span className="font-mono text-ink">{step.expected}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Ensure ConceptStep is imported for downstream consumers of this component
// exporting the internal player types (kept for potential test imports).
export type { ConceptStep };
