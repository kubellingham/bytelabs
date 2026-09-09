'use client';

import { useCallback, useMemo, useState } from 'react';

import { hasNthOccurrence } from '@/lib/brief/solve';
import type { SolveBeat, SolveResponse } from '@/lib/brief/solve-types';

import { BeatMiniLesson } from './BeatMiniLesson';
import { SolveRewrite } from './SolveRewrite';
import { SolveViva } from './SolveViva';

interface Props {
  taskTitle: string;
  solve: SolveResponse;
  onClose: () => void;
}

type Phase =
  | { kind: 'see' }
  | { kind: 'beat'; index: number }
  | { kind: 'rewrite' }
  | { kind: 'viva' };

/**
 * The SEE + BREAKDOWN walkthrough.
 *
 * Phase 1 shows the whole solution to read — the "here's what we're building"
 * moment, no highlights, no explanations, just the code. When the learner
 * clicks Start breakdown, the shell shifts to Phase 2: one beat at a time.
 * The beat's `find` substring lights up in the code panel; everything else
 * dims. The beat's conversational note reads alongside it. Continue, back to
 * overview, and Close are always available.
 */
export function SolveWalkthrough({ taskTitle, solve, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: 'see' });

  const highlight = phase.kind === 'beat' ? solve.beats[phase.index] ?? null : null;
  const totalBeats = solve.beats.length;

  const currentIndex = phase.kind === 'beat' ? phase.index : -1;
  const isLastBeat = currentIndex === totalBeats - 1;

  // A rewrite phase only makes sense when the solve response gave us blanks
  // AND an expected output to grade against. Otherwise the last beat just
  // closes the walkthrough (as before).
  const canRewrite = solve.blanks.length > 0 && !!solve.expectedOutput?.trim();
  const canViva = solve.viva.length > 0;

  const advance = useCallback(() => {
    if (phase.kind === 'see') {
      setPhase({ kind: 'beat', index: 0 });
      return;
    }
    if (phase.kind === 'beat') {
      if (isLastBeat) {
        if (canRewrite) {
          setPhase({ kind: 'rewrite' });
        } else if (canViva) {
          setPhase({ kind: 'viva' });
        } else {
          onClose();
        }
        return;
      }
      setPhase({ kind: 'beat', index: phase.index + 1 });
      return;
    }
    if (phase.kind === 'rewrite') {
      if (canViva) {
        setPhase({ kind: 'viva' });
      } else {
        onClose();
      }
      return;
    }
    // In the viva phase, advance = done.
    onClose();
  }, [phase, isLastBeat, canRewrite, canViva, onClose]);

  const phaseLabel =
    phase.kind === 'see'
      ? 'Read the solution'
      : phase.kind === 'beat'
        ? `Beat ${currentIndex + 1} of ${totalBeats}`
        : phase.kind === 'rewrite'
          ? 'Now you type it'
          : 'Viva — defend the solution';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-bg px-6 py-3">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
            Walkthrough
          </p>
          <span aria-hidden="true" className="text-subtle">/</span>
          <span className="truncate text-subtle">{taskTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-subtle">{phaseLabel}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            Close
          </button>
        </div>
      </header>

      {phase.kind === 'rewrite' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SolveRewrite
            solve={solve}
            onDone={advance}
            onBack={() => setPhase({ kind: 'beat', index: totalBeats - 1 })}
          />
        </div>
      ) : phase.kind === 'viva' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SolveViva questions={solve.viva} onDone={onClose} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="bl-scroll w-[clamp(21rem,32%,28rem)] shrink-0 overflow-y-auto border-e border-line">
            <div className="px-7 py-9">
              {phase.kind === 'see' ? (
                <SeePanel taskTitle={taskTitle} totalBeats={totalBeats} onStart={advance} />
              ) : (
                <BeatMiniLesson
                  key={currentIndex}
                  index={currentIndex}
                  totalBeats={totalBeats}
                  beat={highlight!}
                  isLast={isLastBeat}
                  isLastLeadsToRewrite={canRewrite}
                  onBack={() => setPhase({ kind: 'see' })}
                  onAdvance={advance}
                />
              )}
            </div>
          </aside>

          <section
            aria-label="Solution"
            className="flex min-h-0 flex-1 flex-col p-6"
          >
            <CodeCanvas source={solve.solution} highlight={highlight} />
          </section>
        </div>
      )}
    </div>
  );
}

function SeePanel({
  taskTitle,
  totalBeats,
  onStart,
}: {
  taskTitle: string;
  totalBeats: number;
  onStart: () => void;
}) {
  return (
    <>
      <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
        Here is one way
      </p>
      <h1 className="mt-2 text-[length:var(--bl-step-2)] font-semibold text-ink">
        {taskTitle}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ink">
        This is the whole solution. Read it — you do not need to understand every line yet. In a
        moment we will walk through it, one chunk at a time.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        Break it down ({totalBeats} steps) →
      </button>
    </>
  );
}

/**
 * Renders the solution with either everything at full opacity (SEE phase) or
 * with one substring lit and the rest dimmed (BREAKDOWN phase). The
 * highlighter finds `find` at the Nth occurrence, splits the source into
 * three parts (before / hit / after), and renders each with its own class.
 * When the beat's `find` is not present at the expected occurrence, the
 * whole solution renders un-dimmed as a graceful fallback.
 */
function CodeCanvas({
  source,
  highlight,
}: {
  source: string;
  highlight: SolveBeat | null;
}) {
  const split = useMemo(() => {
    if (!highlight) return null;
    if (!hasNthOccurrence(source, highlight.find, highlight.occurrence)) return null;
    let idx = -highlight.find.length;
    let count = 0;
    while ((idx = source.indexOf(highlight.find, idx + highlight.find.length)) !== -1) {
      count += 1;
      if (count === highlight.occurrence) {
        return {
          before: source.slice(0, idx),
          hit: source.slice(idx, idx + highlight.find.length),
          after: source.slice(idx + highlight.find.length),
        };
      }
    }
    return null;
  }, [source, highlight]);

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-code">
      <pre className="whitespace-pre p-6 font-mono text-[15px] leading-relaxed">
        {split ? (
          <>
            <span className="opacity-25 transition-opacity">{split.before}</span>
            <span className="rounded bg-accent-soft/80 text-ink shadow-[0_0_0_2px_var(--color-accent-soft)]">
              {split.hit}
            </span>
            <span className="opacity-25 transition-opacity">{split.after}</span>
          </>
        ) : (
          <span className="text-ink">{source}</span>
        )}
      </pre>
    </div>
  );
}
