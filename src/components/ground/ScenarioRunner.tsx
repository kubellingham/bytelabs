'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { AssistPanel } from '@/components/assist/AssistPanel';
import { Prose } from '@/components/course/Prose';
import { RequirementList } from '@/components/course/RequirementList';
import { Workspace } from '@/components/editor/Workspace';
import { Preview } from '@/components/runner/Preview';
import { useBankedRequirements } from '@/components/runner/useBankedRequirements';
import { useRequirements } from '@/components/runner/useRequirements';
import { planBeats } from '@/lib/content/beats';
import type { Scenario, WorkspaceFiles } from '@/lib/content/schema';
import { pickVariant, resolveScenario } from '@/lib/content/variants';
import type { GhostState } from '@/lib/editor/ghost';
import { usePrefersReducedMotion, useTypingPlayback } from '@/lib/course/typing';
import { strengthMap } from '@/lib/mastery';
import { awardXp, touchStreak } from '@/lib/progress';
import { useProgress, useProgressActions } from '@/lib/storage/useProgress';

type Mode = 'assisted' | 'raw';
type Phase = 'demo' | 'build';

const TIER_LABEL: Record<Scenario['tier'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  elite: 'Elite',
};

/**
 * A Ground scenario.
 *
 * Assisted Mode runs the same concurrent typing mechanic as the Course — a worked
 * example, beat by beat, that then fades to ghost. Raw Mode is one switch: blank
 * editor, brief at the top, and nothing else. The learner chose to go alone, so the
 * requirement details go quiet too — the ticks remain, because they are the brief,
 * but the "what is missing" hints do not.
 *
 * There is no failure state anywhere here. Requirements are met or not met yet, the
 * learner can leave with three of five done, and the work is kept.
 */
export function ScenarioRunner({ scenario }: { scenario: Scenario }) {
  const progress = useProgress();
  const { update } = useProgressActions();
  const reducedMotion = usePrefersReducedMotion();

  // Assigned once and kept, so a reload does not hand someone a different client
  // halfway through building for the first one.
  const stored = progress.scenarios[scenario.id];
  const storedVariantId = stored?.variantId ?? null;
  const variant = useMemo(() => {
    const previous = storedVariantId
      ? scenario.variants.find((candidate) => candidate.id === storedVariantId)
      : undefined;
    return previous ?? pickVariant(scenario, scenario.id);
  }, [scenario, storedVariantId]);

  const resolved = useMemo(() => resolveScenario(scenario, variant), [scenario, variant]);

  const [mode, setMode] = useState<Mode>(stored?.mode ?? 'assisted');
  const [phase, setPhase] = useState<Phase>(
    resolved.walkthrough && !stored ? 'demo' : 'build',
  );
  const [activePath, setActivePath] = useState('index.html');
  const [learnerFiles, setLearnerFiles] = useState<WorkspaceFiles | null>(
    () => progress.workspaces[`scenario:${scenario.id}`] ?? null,
  );

  const plan = useMemo(
    () =>
      resolved.walkthrough
        ? planBeats(resolved.starterFiles, resolved.walkthrough)
        : { beats: [], result: resolved.starterFiles, lineConcepts: {} },
    [resolved],
  );

  const demoActive = mode === 'assisted' && phase === 'demo' && resolved.walkthrough !== null;

  const playback = useTypingPlayback(plan, resolved.starterFiles, {
    active: demoActive,
    reducedMotion,
  });

  const files: WorkspaceFiles = demoActive
    ? playback.files
    : (learnerFiles ?? resolved.starterFiles);

  const strengths = useMemo(() => strengthMap(progress), [progress]);

  /** Ghost only exists in Assisted Mode, and only where a walkthrough was authored. */
  const ghosts: Record<string, GhostState> | undefined = useMemo(() => {
    if (mode !== 'assisted' || phase !== 'build' || !resolved.walkthrough) return undefined;

    const out: Record<string, GhostState> = {};
    for (const path of Object.keys(plan.result)) {
      out[path] = {
        target: plan.result[path] ?? '',
        lineConcepts: plan.lineConcepts[path] ?? [],
        strengths,
        enabled: true,
      };
    }
    return out;
  }, [mode, phase, resolved.walkthrough, plan, strengths]);

  const state = useRequirements(files, resolved.requirements, { enabled: !demoActive });

  const scope = useMemo(
    () => ({ kind: 'scenario' as const, id: scenario.id, variantId: variant.id }),
    [scenario.id, variant.id],
  );

  const { banked, satisfiedIds, complete } = useBankedRequirements({
    requirements: resolved.requirements,
    results: state.results,
    scope,
    files,
    workspaceKey: `scenario:${scenario.id}`,
  });

  const handleChange = useCallback(
    (path: string, value: string) =>
      setLearnerFiles((current) => ({ ...(current ?? resolved.starterFiles), [path]: value })),
    [resolved.starterFiles],
  );

  const switchMode = (next: Mode) => {
    setMode(next);
    setPhase('build');
    if (next === 'raw' && learnerFiles === null) setLearnerFiles(resolved.starterFiles);
    update((current) => ({
      ...current,
      scenarios: {
        ...current.scenarios,
        [scenario.id]: {
          variantId: variant.id,
          satisfiedRequirements: banked as string[],
          completedAt: current.scenarios[scenario.id]?.completedAt ?? null,
          attempts: current.scenarios[scenario.id]?.attempts ?? 0,
          mode: next,
        },
      },
    }));
  };

  const handIn = () => {
    update((current) => {
      const existing = current.scenarios[scenario.id];
      const first = existing?.completedAt == null;
      let next = {
        ...current,
        scenarios: {
          ...current.scenarios,
          [scenario.id]: {
            variantId: variant.id,
            satisfiedRequirements: banked as string[],
            completedAt: new Date().toISOString(),
            attempts: (existing?.attempts ?? 0) + 1,
            mode,
          },
        },
      };
      // Repeating a scenario is worth less than the first time, and doing it in raw
      // mode is worth more — both are things the brief wants encouraged.
      const base = first ? 120 : 45;
      next = awardXp(next, scenario.trackId, mode === 'raw' ? Math.round(base * 1.5) : base);
      for (const skill of scenario.skills) next = awardXp(next, `skill:${skill}`, 15);
      return touchStreak(next);
    });
  };

  const completedAt = progress.scenarios[scenario.id]?.completedAt;

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-3">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <Link href="/" className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            ByteLabs
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <Link href="/ground" className="text-muted hover:text-ink">
            The Ground
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <span className="truncate text-subtle">{TIER_LABEL[scenario.tier]}</span>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs text-subtle">
            {satisfiedIds.size} of {resolved.requirements.length}
          </p>
          <div
            role="group"
            aria-label="Mode"
            className="flex rounded-lg border border-line p-0.5"
          >
            {(['assisted', 'raw'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => switchMode(option)}
                aria-pressed={mode === option}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  mode === option ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="bl-scroll w-[clamp(21rem,32%,28rem)] shrink-0 overflow-y-auto border-e border-line">
          <div className="px-7 py-9">
            <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
              {TIER_LABEL[scenario.tier]} · {variant.label}
            </p>
            <h1 className="mt-2 text-[length:var(--bl-step-2)] font-semibold text-ink">
              {scenario.title}
            </h1>

            <div className="mt-6">
              <Prose blocks={resolved.brief} />
            </div>

            {demoActive ? (
              <div className="mt-8">
                <h2 className="mb-3 text-xs tracking-[0.14em] text-subtle uppercase">
                  One way through it
                </h2>
                <ol className="space-y-3">
                  {(resolved.walkthrough ?? []).map((beat, index) => {
                    if (index > playback.beatIndex) return null;
                    const current = index === playback.beatIndex && !playback.done;
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
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => (playback.done ? setPhase('build') : playback.skip())}
                    className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    {playback.done ? 'My turn' : 'Skip ahead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('raw')}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                  >
                    I would rather just build it
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-9">
                <h2 className="mb-3 text-xs tracking-[0.14em] text-subtle uppercase">
                  What they asked for
                </h2>
                <RequirementList
                  requirements={resolved.requirements}
                  results={
                    // Raw Mode keeps the ticks — they are the brief — but drops the
                    // hints. The learner chose to go alone.
                    mode === 'raw'
                      ? Object.fromEntries(
                          Object.entries(state.results).map(([id, result]) => [
                            id,
                            { satisfied: result.satisfied },
                          ]),
                        )
                      : state.results
                  }
                  running={state.running}
                  alreadySatisfied={banked}
                />

                <div className="mt-7">
                  {completedAt ? (
                    <div className="rounded-xl border border-success/30 bg-success-soft/40 px-5 py-4">
                      <p className="font-medium text-ink">Handed in.</p>
                      <p className="mt-1 text-sm text-muted">
                        Come back to this one with a different client whenever you like — the
                        skills are the same, the brief is not.
                      </p>
                      <Link
                        href="/ground"
                        className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
                      >
                        Find another
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handIn}
                      disabled={!complete}
                      className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
                    >
                      {complete ? 'Hand it over' : 'Still a few things outstanding'}
                    </button>
                  )}
                  <p className="mt-3 text-xs text-subtle">
                    Nothing here is marked. Leave whenever you like — your work is kept.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col gap-3 p-4" aria-label="Editor and preview">
          <div className="flex min-h-0 flex-[3] flex-col">
            <Workspace
              files={files}
              activePath={activePath}
              onSelect={setActivePath}
              onChange={handleChange}
              {...(ghosts ? { ghosts } : {})}
              readOnly={demoActive}
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

      {/*
        Available in both modes, because raw mode means no unsolicited help — not
        that the door is locked. It stays silent until it is asked, and answers
        more tersely when it is.
      */}
      <AssistPanel
        context={{
          zone: mode === 'raw' ? 'ground-raw' : 'ground-assisted',
          title: `${scenario.title} — ${variant.label}`,
          files,
        }}
      />
    </div>
  );
}
