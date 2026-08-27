'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { Prose } from '@/components/course/Prose';
import { RequirementList } from '@/components/course/RequirementList';
import { Workspace } from '@/components/editor/Workspace';
import { Preview } from '@/components/runner/Preview';
import { useBankedRequirements } from '@/components/runner/useBankedRequirements';
import { useRequirements } from '@/components/runner/useRequirements';
import type { Track, Unit, WorkspaceFiles } from '@/lib/content/schema';
import { graduateUnit, saveWorkspace } from '@/lib/progress';
import { useProgress, useProgressActions } from '@/lib/storage/useProgress';

/**
 * A graduation.
 *
 * No ghost text, no typing animation, no assistant — the scaffolding is simply
 * absent, and nothing announces that as a test. The learner has already been
 * prepared by the reps; the only thing that changed is that the help is gone. They
 * walk through the glass without noticing it was there.
 */
export function GraduationRunner({ track, unit }: { track: Track; unit: Unit }) {
  const graduation = unit.graduation;
  const progress = useProgress();
  const { update } = useProgressActions();

  const stored = progress.workspaces[`graduation:${unit.id}`];
  const [files, setFiles] = useState<WorkspaceFiles>(
    () => stored ?? graduation?.starterFiles ?? {},
  );
  const [activePath, setActivePath] = useState('index.html');

  const requirements = useMemo(() => graduation?.requirements ?? [], [graduation]);
  const state = useRequirements(files, requirements);

  const scope = useMemo(() => ({ kind: 'unit' as const, id: unit.id }), [unit.id]);
  const { banked, satisfiedIds, complete } = useBankedRequirements({
    requirements,
    results: state.results,
    scope,
    files,
    workspaceKey: `graduation:${unit.id}`,
  });

  const graduated = progress.units[unit.id]?.graduatedAt != null;

  const handleChange = useCallback(
    (path: string, value: string) => setFiles((current) => ({ ...current, [path]: value })),
    [],
  );

  const finish = () => {
    update((current) => graduateUnit(saveWorkspace(current, `graduation:${unit.id}`, files), unit.id, track.id));
  };

  if (!graduation) return null;

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-3">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            ByteLabs
          </Link>
          <span aria-hidden="true" className="text-subtle">
            /
          </span>
          <Link href="/course" className="text-muted hover:text-ink">
            The Course
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <Link href={`/course/${track.slug}`} className="text-muted hover:text-ink">
            {track.title}
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <span className="text-subtle">{unit.title}</span>
        </div>
        <p className="text-xs text-subtle">
          {satisfiedIds.size} of {requirements.length} done
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="bl-scroll w-[clamp(22rem,34%,30rem)] shrink-0 overflow-y-auto border-e border-line">
          <div className="px-8 py-10">
            <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
              A brief
            </p>
            <h1 className="mt-2 text-[length:var(--bl-step-2)] font-semibold text-ink">
              {graduation.title}
            </h1>

            <div className="mt-7">
              <Prose blocks={graduation.brief} />
            </div>

            <div className="mt-9">
              <h2 className="mb-3 text-xs tracking-[0.14em] text-subtle uppercase">
                What they asked for
              </h2>
              <RequirementList
                requirements={requirements}
                results={state.results}
                running={state.running}
                alreadySatisfied={banked}
              />
            </div>

            <div className="mt-8">
              {graduated ? (
                <div className="rounded-xl border border-success/30 bg-success-soft/40 px-5 py-4">
                  <p className="font-medium text-ink">That is the unit.</p>
                  <p className="mt-1 text-sm text-muted">
                    You built this from a brief with nothing to lean on. The next unit is open.
                  </p>
                  <Link
                    href={`/course/${track.slug}`}
                    className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    Keep going
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={!complete}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
                >
                  {complete ? 'Hand it over' : 'Not everything is there yet'}
                </button>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col gap-3 p-4" aria-label="Editor and preview">
          <div className="flex min-h-0 flex-[3] flex-col">
            <Workspace
              files={files}
              activePath={activePath}
              onSelect={setActivePath}
              onChange={handleChange}
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
    </div>
  );
}
