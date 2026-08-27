'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { CodeEditor } from '@/components/editor/CodeEditor';
import { getConcept } from '@/content/concepts';
import { buildWarmupSession, type Drill } from '@/lib/course/drills';
import { completionRatio, resolveLines } from '@/lib/editor/resolve';
import { dueConcepts, strengthMap } from '@/lib/mastery';
import { recordConcepts, touchStreak } from '@/lib/progress';
import { useProgress, useProgressActions } from '@/lib/storage/useProgress';

/**
 * The warm-up.
 *
 * Five minutes on whatever is closest to slipping. This is the honest retention
 * mechanic: the reason to come back is that the app knows what you are about to
 * forget, not that a counter will reset if you don't.
 *
 * A warm-up is revision, never teaching — only concepts the learner has actually
 * met are eligible, which is enforced in `dueConcepts`.
 */
export function WarmupSession() {
  const progress = useProgress();
  const { update } = useProgressActions();

  const strengths = useMemo(() => strengthMap(progress), [progress]);
  const due = useMemo(() => dueConcepts(progress), [progress]);
  const drills = useMemo(
    () => buildWarmupSession(due.map((entry) => entry.concept.id)),
    [due],
  );

  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);

  const drill: Drill | undefined = drills[index];

  const resolution = useMemo(
    () => (drill ? resolveLines(typed, drill.target) : null),
    [typed, drill],
  );
  const done = resolution ? completionRatio(resolution) >= 1 : false;

  const advance = useCallback(() => {
    if (!drill) return;

    update((state) =>
      touchStreak(recordConcepts(state, drill.conceptIds, done ? 'success' : 'exposure')),
    );
    setCompleted((current) => [...current, drill.id]);
    setTyped('');
    setIndex((current) => current + 1);
  }, [drill, done, update]);

  const finish = useCallback(() => {
    update((state) => ({
      ...state,
      warmup: {
        lastSessionAt: new Date().toISOString(),
        sessionsCompleted: state.warmup.sessionsCompleted + 1,
      },
    }));
  }, [update]);

  /* --------------------------------------------------------- Nothing due */

  if (drills.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-24 text-center">
        <h1 className="text-[length:var(--bl-step-3)] font-semibold text-ink">
          Nothing needs warming up.
        </h1>
        <p className="measure mx-auto mt-4 text-muted">
          {Object.keys(progress.concepts).length === 0
            ? 'Warm-ups revisit things you have already been taught, so there is nothing here until you have done a lesson or two.'
            : 'Everything you have learned is still solid. Come back in a few days and some of it will have started to slip — that is when this is worth your time.'}
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Back to the dashboard
        </Link>
      </div>
    );
  }

  /* ------------------------------------------------------------ Finished */

  if (!drill) {
    const strongestFirst = completed.length;
    return (
      <div className="mx-auto max-w-2xl px-8 py-24 text-center">
        <h1 className="text-[length:var(--bl-step-3)] font-semibold text-ink">
          That is the warm-up.
        </h1>
        <p className="measure mx-auto mt-4 text-muted">
          {strongestFirst} {strongestFirst === 1 ? 'thing' : 'things'} pushed back from the edge
          of forgetting. They will come round again when they need to.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            onClick={finish}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Done
          </Link>
          <Link
            href="/ground"
            onClick={finish}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Build something
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- A drill */

  const conceptLabels = drill.conceptIds
    .map((id) => getConcept(id)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-8 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
          ← ByteLabs
        </Link>
        <ol className="flex gap-1.5" aria-label="Warm-up progress">
          {drills.map((entry, i) => (
            <li
              key={entry.id}
              aria-current={i === index ? 'step' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-accent' : i < index ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-line-strong'
              }`}
            />
          ))}
        </ol>
      </div>

      <div className="mt-12">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          Warm-up · {index + 1} of {drills.length}
        </p>
        <h1 className="measure mt-3 text-[length:var(--bl-step-2)] font-semibold text-ink">
          {drill.prompt}
        </h1>
        <p className="mt-3 text-sm text-subtle">
          From {drill.chapterTitle} ·{' '}
          <Link href={drill.href} className="underline hover:text-muted">
            {drill.lessonTitle}
          </Link>
          {conceptLabels.length > 0 ? ` · ${conceptLabels.join(', ')}` : ''}
        </p>
      </div>

      <div className="mt-8 min-h-64 overflow-hidden rounded-lg border border-line bg-code">
        <CodeEditor
          key={drill.id}
          path={drill.file}
          value={typed}
          onChange={setTyped}
          ariaLabel={`Warm-up: ${drill.prompt}`}
          ghost={{
            target: drill.target,
            // A warm-up already knows this concept is weak, so nothing is faded out
            // here — the scaffolding is the point of the exercise.
            lineConcepts: drill.target.split('\n').map(() => drill.conceptIds),
            strengths,
            enabled: true,
          }}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={advance}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          {done ? 'Next' : 'Skip this one'}
        </button>
        {done ? (
          <p className="text-sm text-success">That is it — still there.</p>
        ) : (
          <p className="text-sm text-subtle">Type it out. Skipping costs you nothing.</p>
        )}
      </div>
    </div>
  );
}
