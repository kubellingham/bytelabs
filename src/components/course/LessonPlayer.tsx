'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { AssistPanel } from '@/components/assist/AssistPanel';
import { AnatomyPanel } from '@/components/course/AnatomyPanel';
import { Prose } from '@/components/course/Prose';
import { RequirementList } from '@/components/course/RequirementList';
import { Workspace } from '@/components/editor/Workspace';
import { Preview } from '@/components/runner/Preview';
import { useRequirements } from '@/components/runner/useRequirements';
import { nextLesson, type LessonLocation } from '@/content';
import { getConcept } from '@/content/concepts';
import { annotationsForBeats, resolveAnnotation, type ResolvedAnnotation } from '@/lib/content/annotations';
import type { AnatomyRange, AnatomyState } from '@/lib/editor/anatomy';
import { newlyMatchedConcepts, resolveLines, type Resolution } from '@/lib/editor/resolve';
import type { GhostState } from '@/lib/editor/ghost';
import { planLesson } from '@/lib/course/plan';
import { usePrefersReducedMotion, useTypingPlayback } from '@/lib/course/typing';
import { strengthMap } from '@/lib/mastery';
import { advanceLesson, completeLesson, recordConcepts, saveWorkspace } from '@/lib/progress';
import type { WorkspaceFiles } from '@/lib/content/schema';
import { useProgress, useProgressActions } from '@/lib/storage/useProgress';

/**
 * The six acts, in one component.
 *
 * Act 1 is the tutor panel at full width. Act 2 is the slide to split. Act 3 types
 * the code beat by beat with its notes. Act 4 ghosts that code and hands the
 * keyboard over. Act 5 is the next concept in the same lesson, and Act 6 is simply
 * the next chapter — no fanfare, which is the point.
 */
export function LessonPlayer({ location }: { location: LessonLocation }) {
  const { track, unit, chapter, lesson } = location;
  const steps = useMemo(() => planLesson(lesson), [lesson]);

  const progress = useProgress();
  const { update } = useProgressActions();
  const reducedMotion = usePrefersReducedMotion();

  const [stepIndex, setStepIndex] = useState(0);
  const [activePath, setActivePath] = useState('index.html');
  /** A demo runs in two phases: the code types itself, then it comes apart. */
  const [demoPhase, setDemoPhase] = useState<'typing' | 'anatomy'>('typing');
  const [annotationIndex, setAnnotationIndex] = useState(0);
  /** A fragment the learner clicked to ask about again, outside the breakdown. */
  const [recalledId, setRecalledId] = useState<string | null>(null);
  const [learnerFiles, setLearnerFiles] = useState<WorkspaceFiles | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});

  const step = lesson.steps[stepIndex];
  const planned = steps[stepIndex];
  const isSplit = step?.kind !== 'explain';
  const isLast = stepIndex === lesson.steps.length - 1;

  const strengths = useMemo(() => strengthMap(progress), [progress]);

  /* ------------------------------------------------------------- Act 3 */

  const demoPlan = planned?.kind === 'demo' ? planned.plan : null;
  const demoFrom = planned?.kind === 'demo' ? planned.from : null;

  const playback = useTypingPlayback(
    demoPlan ?? { beats: [], result: {}, lineConcepts: {} },
    demoFrom ?? {},
    { active: planned?.kind === 'demo', reducedMotion },
  );

  /* ------------------------------------------------------ Files on show */

  const files: WorkspaceFiles = useMemo(() => {
    if (planned?.kind === 'demo') return playback.files;
    if (learnerFiles) return learnerFiles;
    if (planned?.kind === 'practice') return planned.from;
    if (planned?.kind === 'explain' || planned?.kind === 'check') return planned.files;
    return lesson.startFiles;
  }, [planned, playback.files, learnerFiles, lesson.startFiles]);

  /* ------------------------------------------------- The breakdown (Act 3b) */

  /**
   * Annotations resolve against the files currently on screen, so the same
   * definitions light up the demo's code and, later, the learner's own copy of it.
   */
  const resolvedAnnotations: ResolvedAnnotation[] = useMemo(() => {
    if (step?.kind !== 'demo') return [];
    return annotationsForBeats(step.beats)
      .map(({ annotation, defaultFile }) => resolveAnnotation(annotation, files, defaultFile))
      .filter((entry): entry is ResolvedAnnotation => entry !== null);
  }, [step, files]);

  const inAnatomy = planned?.kind === 'demo' && demoPhase === 'anatomy';
  const hasBreakdown = resolvedAnnotations.length > 0;

  /** Underlines stay on after the breakdown, so any piece can be asked about again. */
  const anatomies: Record<string, AnatomyState> | undefined = useMemo(() => {
    if (planned?.kind !== 'demo' || !playback.done || !hasBreakdown) return undefined;

    const activeId = inAnatomy
      ? (resolvedAnnotations[annotationIndex]?.annotation.id ?? null)
      : recalledId;

    const byFile = new Map<string, AnatomyRange[]>();
    for (const entry of resolvedAnnotations) {
      const ranges = byFile.get(entry.file) ?? [];
      ranges.push({ id: entry.annotation.id, from: entry.from, to: entry.to });
      byFile.set(entry.file, ranges);
    }

    const out: Record<string, AnatomyState> = {};
    for (const [file, ranges] of byFile) {
      out[file] = { ranges, activeId, dim: inAnatomy, interactive: true };
    }
    return out;
  }, [planned, playback.done, hasBreakdown, inAnatomy, resolvedAnnotations, annotationIndex, recalledId]);

  /** Stepping to a fragment in another file opens that file. */
  const selectAnnotation = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(resolvedAnnotations.length - 1, next));
      setAnnotationIndex(clamped);
      const target = resolvedAnnotations[clamped];
      if (target) setActivePath(target.file);
    },
    [resolvedAnnotations],
  );

  const pickAnnotation = useCallback(
    (id: string) => {
      const position = resolvedAnnotations.findIndex((entry) => entry.annotation.id === id);
      if (position === -1) return;
      if (inAnatomy) selectAnnotation(position);
      else setRecalledId(id);
    },
    [resolvedAnnotations, inAnatomy, selectAnnotation],
  );

  const recalled = recalledId
    ? (resolvedAnnotations.find((entry) => entry.annotation.id === recalledId) ?? null)
    : null;

  /* ------------------------------------------------------------- Act 4 */

  const ghosts: Record<string, GhostState> | undefined = useMemo(() => {
    if (planned?.kind !== 'practice' || step?.kind !== 'practice') return undefined;

    const out: Record<string, GhostState> = {};
    for (const path of step.files) {
      out[path] = {
        target: planned.target[path] ?? '',
        lineConcepts: planned.lineConcepts[path] ?? [],
        strengths,
        enabled: true,
      };
    }
    return out;
  }, [planned, step, strengths]);

  const practiceProgress = useMemo(() => {
    if (planned?.kind !== 'practice' || step?.kind !== 'practice') return null;
    let matched = 0;
    let total = 0;
    for (const path of step.files) {
      const resolution = resolutions[path] ?? resolveLines(files[path] ?? '', planned.target[path] ?? '');
      matched += resolution.matchedCount;
      total += resolution.meaningfulTarget;
    }
    return { matched, total };
  }, [planned, step, resolutions, files]);

  const handleChange = useCallback(
    (path: string, value: string) => {
      const next = { ...files, [path]: value };
      setLearnerFiles(next);

      // Credit concepts as lines resolve. Done here rather than in an effect so a
      // concept is banked exactly once, when its line first lands.
      if (planned?.kind === 'practice') {
        const target = planned.target[path] ?? '';
        if (target) {
          const previous = resolutions[path] ?? null;
          const resolution = resolveLines(value, target);
          const credited = newlyMatchedConcepts(
            previous,
            resolution,
            planned.lineConcepts[path] ?? [],
          );
          setResolutions({ ...resolutions, [path]: resolution });
          if (credited.length > 0) {
            update((state) => recordConcepts(state, credited, 'success'));
          }
        }
      }
    },
    [files, planned, resolutions, update],
  );

  /* ------------------------------------------------------------- Checks */

  const requirements = step?.kind === 'check' ? step.requirements : [];
  const checkState = useRequirements(files, requirements, {
    enabled: step?.kind === 'check',
  });

  /* --------------------------------------------------------- Navigation */

  const goNext = useCallback(() => {
    if (isLast) {
      update((state) => completeLesson(state, lesson.id, track.id, lesson.concepts));
      update((state) => saveWorkspace(state, `lesson:${lesson.id}`, files));
      return;
    }

    const nextIndex = stepIndex + 1;
    const nextPlanned = steps[nextIndex];

    // Carry the learner's own work forward; wind back only what the next step
    // asks them to practise.
    setLearnerFiles(
      nextPlanned?.kind === 'practice'
        ? nextPlanned.from
        : nextPlanned?.kind === 'demo'
          ? null
          : files,
    );
    setResolutions({});
    setDemoPhase('typing');
    setAnnotationIndex(0);
    setRecalledId(null);
    setStepIndex(nextIndex);
    update((state) => advanceLesson(state, lesson.id, nextIndex));
  }, [isLast, stepIndex, steps, files, lesson, track.id, update]);

  const lessonDone = progress.lessons[lesson.id]?.completedAt != null;

  /**
   * Act 6: "Move to the next chapter. Same environment, new concept. No lectures.
   * Just reps." So finishing a lesson offers the next one directly rather than
   * dropping the learner back on a list to find their own way.
   */
  const upNext = useMemo(() => nextLesson(location), [location]);

  if (!step || !planned) return null;

  /* ------------------------------------------------------------- Render */

  // What the current step is teaching, so an answer is about the thing in front of
  // them rather than the lesson in general.
  const activeConcept = (() => {
    const ids =
      step.kind === 'explain' || step.kind === 'practice'
        ? step.concepts
        : step.kind === 'demo'
          ? (step.beats[Math.max(0, playback.beatIndex)]?.concepts ?? [])
          : [];
    return ids.map((id) => getConcept(id)?.label).filter(Boolean).join(', ');
  })();

  const continueLabel = (() => {
    if (isLast) return lessonDone ? 'Lesson complete' : 'Finish lesson';
    if (step.kind === 'explain') return 'Show me';
    if (step.kind === 'demo') {
      if (!playback.done) return 'Skip the typing';
      // The breakdown is offered rather than forced; a learner who already reads
      // HTML fluently should not have to click through eight labels.
      return hasBreakdown ? 'Break it down' : 'My turn';
    }
    return 'Continue';
  })();

  const onContinue = () => {
    if (step.kind === 'demo' && !playback.done) {
      playback.skip();
      return;
    }
    if (step.kind === 'demo' && hasBreakdown && demoPhase === 'typing') {
      setDemoPhase('anatomy');
      selectAnnotation(0);
      return;
    }
    goNext();
  };

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-3">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <Link href="/" className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            ByteLabs
          </Link>
          <span aria-hidden="true" className="text-subtle">
            /
          </span>
          <Link href="/course" className="text-muted hover:text-ink">
            The Course
          </Link>
          <span aria-hidden="true" className="text-subtle">
            /
          </span>
          <Link href={`/course/${track.slug}`} className="truncate text-muted hover:text-ink">
            {track.title}
          </Link>
          <span aria-hidden="true" className="text-subtle">
            /
          </span>
          <span className="truncate text-subtle">{chapter.title}</span>
        </div>

        <ol className="flex items-center gap-1.5" aria-label="Lesson progress">
          {lesson.steps.map((s, index) => (
            <li
              key={s.id}
              aria-current={index === stepIndex ? 'step' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                index === stepIndex
                  ? 'w-6 bg-accent'
                  : index < stepIndex
                    ? 'w-1.5 bg-accent/50'
                    : 'w-1.5 bg-line-strong'
              }`}
            >
              <span className="sr-only">
                Step {index + 1} of {lesson.steps.length}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="bl-split min-h-0 flex-1" data-split={isSplit}>
        <aside className="bl-split__tutor bl-scroll overflow-y-auto">
          <div className={`mx-auto px-8 py-10 ${isSplit ? '' : 'max-w-2xl py-16'}`}>
            <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
              {unit.title} · {chapter.title}
            </p>
            <h1 className="mt-2 text-[length:var(--bl-step-2)] font-semibold text-ink">
              {lesson.title}
            </h1>

            {/*
              Where you are in the chapter. Present so a lesson never feels like a
              corridor with no doors — you can see what came before and what is
              still to come, and go straight to either.
            */}
            {chapter.lessons.length > 1 ? (
              <ol className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Lessons in this chapter">
                {chapter.lessons.map((entry, position) => {
                  const current = entry.id === lesson.id;
                  const complete = progress.lessons[entry.id]?.completedAt != null;
                  return (
                    <li key={entry.id}>
                      <Link
                        href={`/learn/${track.slug}/${unit.slug}/${chapter.slug}/${entry.slug}`}
                        aria-current={current ? 'page' : undefined}
                        title={entry.title}
                        className={`flex size-6 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                          current
                            ? 'bg-accent text-on-accent'
                            : complete
                              ? 'bg-success-soft text-success hover:bg-success-soft/80'
                              : 'border border-line text-subtle hover:text-ink'
                        }`}
                      >
                        {position + 1}
                        <span className="sr-only"> — {entry.title}</span>
                      </Link>
                    </li>
                  );
                })}
                <li className="ms-1 text-xs text-subtle">
                  lesson {chapter.lessons.findIndex((entry) => entry.id === lesson.id) + 1} of{' '}
                  {chapter.lessons.length}
                </li>
              </ol>
            ) : null}

            <div className="mt-8">
              {step.kind === 'explain' ? (
                <>
                  <h2 className="mb-5 text-[length:var(--bl-step-1)] font-semibold text-ink">
                    {step.title}
                  </h2>
                  <Prose blocks={step.body} />
                </>
              ) : null}

              {step.kind === 'demo' && inAnatomy ? (
                <AnatomyPanel
                  annotations={resolvedAnnotations}
                  index={annotationIndex}
                  onSelect={selectAnnotation}
                  onFinish={goNext}
                  onSkip={goNext}
                />
              ) : null}

              {step.kind === 'demo' && !inAnatomy ? (
                <div>
                  <h2 className="mb-5 text-[length:var(--bl-step-1)] font-semibold text-ink">
                    {step.title}
                  </h2>
                  <ol className="space-y-3">
                    {step.beats.map((beat, index) => {
                      const reached = index <= playback.beatIndex;
                      const current = index === playback.beatIndex && !playback.done;
                      if (!reached) return null;
                      return (
                        <li
                          key={beat.id}
                          className={`bl-beat-note rounded-lg border px-4 py-3 text-sm transition-colors ${
                            current
                              ? 'border-accent/40 bg-accent-soft/60 text-ink'
                              : 'border-line bg-surface text-muted'
                          }`}
                        >
                          {beat.note}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}

              {recalled && !inAnatomy ? (
                <div className="bl-beat-note mt-6 rounded-xl border border-accent/40 bg-accent-soft/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <code className="font-mono text-sm text-accent">
                      {recalled.annotation.find.trim()}
                    </code>
                    <button
                      type="button"
                      onClick={() => setRecalledId(null)}
                      className="shrink-0 text-xs text-subtle transition-colors hover:text-ink"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-ink">{recalled.annotation.label}</p>
                </div>
              ) : null}

              {step.kind === 'practice' ? (
                <div className="space-y-5">
                  <p className="measure text-muted">{step.prompt}</p>
                  {practiceProgress && practiceProgress.total > 0 ? (
                    <div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-line"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={practiceProgress.total}
                        aria-valuenow={practiceProgress.matched}
                        aria-label="Lines written"
                      >
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-300"
                          style={{
                            width: `${(practiceProgress.matched / practiceProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-subtle">
                        {practiceProgress.matched} of {practiceProgress.total} lines
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step.kind === 'check' ? (
                <div className="space-y-5">
                  <p className="measure text-muted">{step.prompt}</p>
                  <RequirementList
                    requirements={step.requirements}
                    results={checkState.results}
                    running={checkState.running}
                  />
                </div>
              ) : null}
            </div>

            {/*
              The breakdown carries its own Back/Next, so the step controls stand
              down while it is running rather than offering a second, competing
              way forward.
            */}
            <div className={`mt-10 flex items-center gap-3 ${inAnatomy ? 'hidden' : ''}`}>
              <button
                type="button"
                onClick={onContinue}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
              >
                {continueLabel}
              </button>

              {step.kind === 'demo' && playback.done ? (
                <button
                  type="button"
                  onClick={playback.restart}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                >
                  Watch again
                </button>
              ) : null}

              {isLast && lessonDone && upNext ? (
                <Link
                  href={`/learn/${upNext.track.slug}/${upNext.unit.slug}/${upNext.chapter.slug}/${upNext.lesson.slug}`}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
                >
                  Next: {upNext.lesson.title}
                </Link>
              ) : null}

              {isLast && lessonDone ? (
                <Link
                  href={`/course/${track.slug}`}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                >
                  {upNext ? 'See the track' : 'Back to the track'}
                </Link>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="bl-split__work flex min-h-0 flex-col gap-3 p-4 pt-6" aria-label="Editor and preview">
          <div className="flex min-h-0 flex-[3] flex-col">
            <Workspace
              files={files}
              activePath={activePath}
              onSelect={setActivePath}
              onChange={handleChange}
              {...(ghosts ? { ghosts } : {})}
              {...(anatomies ? { anatomies } : {})}
              {...(anatomies ? { onPickAnnotation: pickAnnotation } : {})}
              readOnly={step.kind === 'demo'}
            />
          </div>
          <div className="flex min-h-0 flex-[2] flex-col">
            <p className="mb-1.5 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
              Preview
            </p>
            <Preview files={files} className="min-h-0 flex-1" />
          </div>
        </section>
      </div>

      <AssistPanel
        context={{
          zone: 'course',
          title: `${chapter.title} — ${lesson.title}`,
          ...(activeConcept ? { concept: activeConcept } : {}),
          files,
        }}
      />
    </div>
  );
}
