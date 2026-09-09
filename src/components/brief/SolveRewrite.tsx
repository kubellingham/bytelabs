'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { applyCodeEditorKey } from '@/lib/brief/editor-keys';
import { useEditorZoom, zoomStyle } from '@/lib/brief/editor-zoom';
import { evaluatePassing, type GradingMode } from '@/lib/brief/grading';
import { loadPyodideOnce, runPython, stdinLines } from '@/lib/brief/pyodide';
import { makeGhostForRound } from '@/lib/brief/solve';
import type { SolveResponse } from '@/lib/brief/solve-types';

import { EditorZoomControls } from './EditorZoomControls';

interface Props {
  solve: SolveResponse;
  onDone: () => void;
  onBack: () => void;
}

type Round = 1 | 2;

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'pass'; got: string; mode: GradingMode }
  | { phase: 'fail'; got: string; error: string | null };

/**
 * REWRITE — two rounds of typing over a silhouette.
 *
 * Round 1 (trace). The whole solution appears as a low-opacity ghost behind
 * a transparent textarea. The learner types on top of it — no deleting, no
 * blanks. Muscle memory first: prove you can type the whole thing while
 * looking at the shape.
 *
 * Round 2 (recall). On passing round 1, the ghost's `blanks` positions are
 * AUTO-REMOVED — those spots become empty, the rest of the ghost stays.
 * The learner still sees the surrounding structure as ghost text but has to
 * remember what belongs in the gaps.
 *
 * Passing round 2 finishes the walkthrough. Grading is the same both
 * rounds: their stdout must match the reference expectedOutput.
 */
export function SolveRewrite({ solve, onDone, onBack }: Props) {
  const [round, setRound] = useState<Round>(1);
  const [source, setSource] = useState('');
  const [run, setRun] = useState<RunState>({ phase: 'idle' });
  // The AI sometimes writes an expectedOutput that doesn't actually match
  // what its own solution prints (a hallucinated sort order, an off-by-one
  // count). On mount we run the reference solution ourselves — its real
  // stdout, if it runs cleanly, is the truth we grade against. The AI's
  // declared value is the fallback in case the reference errors.
  const [healedExpected, setHealedExpected] = useState<string | undefined>(
    solve.expectedOutput,
  );
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    editorRef.current?.focus();
    void loadPyodideOnce();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await runPython(solve.solution, {
        stdin: stdinLines(solve.expectedInput),
      });
      if (cancelled) return;
      if (result.error) return;
      const actual = result.stdout;
      if (actual && actual.trim() !== (solve.expectedOutput ?? '').trim()) {
        setHealedExpected(actual);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [solve.solution, solve.expectedInput, solve.expectedOutput]);

  // Refocus on round change so the learner keeps typing without an extra click.
  useEffect(() => {
    editorRef.current?.focus();
  }, [round]);

  const ghost = useMemo(
    () => makeGhostForRound(solve.solution, solve.blanks, round),
    [solve.solution, solve.blanks, round],
  );
  const expected = healedExpected?.trim() ?? '';
  const hasBlanks = solve.blanks.length > 0;

  const onRun = useCallback(async () => {
    setRun({ phase: 'running' });
    const result = await runPython(source, {
      stdin: stdinLines(solve.expectedInput),
      // When the AI's cached solve pre-dates expectedInput (or asks for
      // more lines than were seeded), pop a prompt so the learner can
      // hand-feed one value instead of hitting EOFError.
      promptFallback: () => {
        if (typeof window === 'undefined') return null;
        const value = window.prompt('Your program is asking for input:');
        return value;
      },
    });
    const got = result.stdout.trim();
    if (result.error) {
      setRun({ phase: 'fail', got, error: result.error });
      return;
    }
    const grade = evaluatePassing(result.stdout, healedExpected, solve.acceptancePattern);
    if (grade.pass) {
      setRun({ phase: 'pass', got, mode: grade.mode });
      return;
    }
    setRun({ phase: 'fail', got, error: null });
  }, [source, solve.expectedInput, healedExpected, solve.acceptancePattern]);

  const onNextRound = useCallback(() => {
    if (round === 1 && hasBlanks) {
      setRound(2);
      setSource('');
      setRun({ phase: 'idle' });
      return;
    }
    onDone();
  }, [round, hasBlanks, onDone]);

  const { zoomIn, zoomOut, reset: zoomReset } = useEditorZoom();

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key === 'Enter') {
        event.preventDefault();
        void onRun();
        return;
      }
      if (mod && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        zoomIn();
        return;
      }
      if (mod && event.key === '-') {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (mod && event.key === '0') {
        event.preventDefault();
        zoomReset();
        return;
      }
      const el = event.currentTarget;
      const applied = applyCodeEditorKey(
        event,
        source,
        el.selectionStart,
        el.selectionEnd,
      );
      if (applied) {
        event.preventDefault();
        setSource(applied.next);
        requestAnimationFrame(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = editorRef.current.selectionEnd = applied.cursor;
          }
        });
      }
    },
    [onRun, source, zoomIn, zoomOut, zoomReset],
  );

  const roundLabel = round === 1 ? 'Round 1 · Trace' : 'Round 2 · Recall';
  const roundHeading =
    round === 1
      ? 'Type it out, over the silhouette.'
      : 'Some pieces are gone. Type what you remember.';
  const roundBlurb =
    round === 1
      ? 'The whole solution is here as a shadow. Just type on top of it. Nothing to solve yet — this round is muscle memory.'
      : 'The surrounding structure is still here as a shadow to guide you. The meaningful pieces are gone — you fill them in.';

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-start px-8 py-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          {roundLabel}
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
        {roundHeading}
      </h1>
      <p className="mt-2 max-w-2xl text-base text-muted">{roundBlurb}</p>

      <RoundDots round={round} hasRound2={hasBlanks} />

      {solve.expectedInput ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-raised px-4 py-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Input fed in
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm text-ink">
            {solve.expectedInput}
          </pre>
        </div>
      ) : null}

      <SilhouetteEditor
        ghost={ghost}
        value={source}
        onChange={(next) => {
          setSource(next);
          if (run.phase !== 'idle') setRun({ phase: 'idle' });
        }}
        onKeyDown={onKeyDown}
        editorRef={editorRef}
      />

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
            onClick={onNextRound}
            className="rounded-lg border border-success/60 bg-success-soft px-5 py-3 text-base font-medium text-ink transition-colors hover:bg-success-soft/80"
          >
            {round === 1 && hasBlanks ? 'Next round →' : 'Nice — that’s it →'}
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
            {run.phase === 'pass'
              ? run.mode === 'strict'
                ? 'Output matches'
                : 'Accepted — different wording, same answer'
              : 'Not yet — your output was'}
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
    </div>
  );
}

function RoundDots({ round, hasRound2 }: { round: Round; hasRound2: boolean }) {
  if (!hasRound2) return null;
  return (
    <div className="mt-4 flex items-center gap-1.5">
      {[1, 2].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={`h-1.5 w-6 rounded-full ${
            n === round ? 'bg-accent' : n < round ? 'bg-accent/40' : 'bg-line-strong'
          }`}
        />
      ))}
    </div>
  );
}

interface SilhouetteEditorProps {
  ghost: string;
  value: string;
  onChange: (next: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  editorRef: React.Ref<HTMLTextAreaElement>;
}

/**
 * The silhouette editor. A `<pre>` renders the ghost in low opacity behind
 * a transparent `<textarea>` at the same padding, font, and line-height.
 * Because both are monospace, the learner's characters land squarely on top
 * of the ghost characters and the ghost shows through wherever they have
 * not typed yet. Both share the same zoom style so alignment survives any
 * font-size change.
 */
function SilhouetteEditor({
  ghost,
  value,
  onChange,
  onKeyDown,
  editorRef,
}: SilhouetteEditorProps) {
  const { scale } = useEditorZoom();
  const style = zoomStyle(scale);
  const rows = Math.max(6, ghost.split('\n').length + 1);
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line bg-code">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
          Your editor
        </p>
        <div className="flex items-center gap-3">
          <EditorZoomControls />
          <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
            ⌘/Ctrl + Enter to run
          </p>
        </div>
      </div>
      <div className="relative">
        <pre
          aria-hidden="true"
          style={style}
          className="pointer-events-none absolute inset-0 whitespace-pre px-4 py-3 font-mono text-ink opacity-[0.28] select-none"
        >
          {ghost}
        </pre>
        <textarea
          ref={editorRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={rows}
          spellCheck={false}
          style={style}
          className="relative z-10 w-full resize-none bg-transparent px-4 py-3 font-mono text-ink caret-accent outline-none"
        />
      </div>
    </div>
  );
}
