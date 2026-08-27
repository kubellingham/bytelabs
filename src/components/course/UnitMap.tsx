'use client';

import Link from 'next/link';

import type { Track } from '@/lib/content/schema';
import { isUnitGraduated } from '@/lib/progress';
import { useProgress } from '@/lib/storage/useProgress';

/**
 * The unit map.
 *
 * Units never announce their difficulty — the brief is explicit that the lessons do
 * that silently through repetition. So this shows what a unit is *for*, and whether
 * it is open, and nothing about how hard it is meant to be.
 *
 * A unit opens when the one before it has been graduated. Unauthored units are shown
 * rather than hidden: the roadmap is part of what a subscription is buying.
 */
export function UnitMap({ track }: { track: Track }) {
  const progress = useProgress();

  return (
    <ol className="space-y-3">
      {track.units.map((unit, index) => {
        const previous = index > 0 ? track.units[index - 1] : undefined;
        const open = index === 0 || (previous ? isUnitGraduated(progress, previous.id) : false);
        const graduated = isUnitGraduated(progress, unit.id);
        const authored = unit.status === 'available';
        const reachable = authored && open;

        const lessonCount = unit.chapters.reduce(
          (total, chapter) => total + chapter.lessons.length,
          0,
        );

        return (
          <li
            key={unit.id}
            className={`rounded-xl border px-5 py-4 transition-colors ${
              reachable ? 'border-line bg-surface' : 'border-line/60 bg-surface/40'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">
                  Unit {index + 1}
                </p>
                <h2
                  className={`mt-1 text-[length:var(--bl-step-1)] font-semibold ${
                    reachable ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {unit.title}
                </h2>
                <p className="measure mt-1.5 text-sm text-muted">{unit.intent}</p>

                <p className="mt-3 text-xs text-subtle">
                  {unit.chapters.length} chapters
                  {lessonCount > 0 ? ` · ${lessonCount} lessons` : ''}
                  {unit.graduation ? ' · ends in a build' : ''}
                </p>
              </div>

              <div className="shrink-0 text-end">
                {graduated ? (
                  <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                    Done
                  </span>
                ) : !authored ? (
                  <span className="rounded-full border border-line px-3 py-1 text-xs text-subtle">
                    Coming soon
                  </span>
                ) : !open ? (
                  <span className="rounded-full border border-line px-3 py-1 text-xs text-subtle">
                    Opens after Unit {index}
                  </span>
                ) : null}
              </div>
            </div>

            {reachable ? (
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {unit.chapters.map((chapter) => {
                  const first = chapter.lessons[0];
                  return (
                    <li key={chapter.id}>
                      {first ? (
                        <Link
                          href={`/learn/${track.slug}/${unit.slug}/${chapter.slug}/${first.slug}`}
                          className="group flex items-baseline justify-between gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-raised"
                        >
                          <span className="text-sm text-ink group-hover:text-accent">
                            {chapter.title}
                          </span>
                          <span className="shrink-0 text-xs text-subtle">
                            {chapter.lessons.length} lessons
                          </span>
                        </Link>
                      ) : (
                        <span className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm text-subtle">
                          {chapter.title}
                          <span className="shrink-0 text-xs">soon</span>
                        </span>
                      )}
                    </li>
                  );
                })}

                {unit.graduation ? (
                  <li className="pt-2">
                    <Link
                      href={`/graduate/${track.slug}/${unit.slug}`}
                      className="group flex items-baseline justify-between gap-4 rounded-lg border border-accent/25 bg-accent-soft/40 px-3 py-2.5 transition-colors hover:border-accent/50"
                    >
                      <span className="text-sm font-medium text-ink">
                        {unit.graduation.title}
                      </span>
                      <span className="shrink-0 text-xs text-subtle">a build, no help</span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
