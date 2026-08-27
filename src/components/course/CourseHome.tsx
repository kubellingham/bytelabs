'use client';

import Link from 'next/link';

import { LEARNING_PATHS, TRACKS, lessonsInTrack } from '@/content';
import { isUnitGraduated } from '@/lib/progress';
import { useProgress } from '@/lib/storage/useProgress';

/**
 * The Course's front door.
 *
 * The track — the language — is the spine, because "I want to learn Python" is a
 * thought people actually have. Paths appear underneath as context for where these
 * lead, not as a second menu competing with the first. One road, clearly signposted.
 */
export function CourseHome() {
  const progress = useProgress();

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Tracks</h2>

        <ul className="mt-4 space-y-3">
          {TRACKS.map((track) => {
            const lessons = lessonsInTrack(track);
            const done = lessons.filter(
              ({ lesson }) => progress.lessons[lesson.id]?.completedAt != null,
            ).length;
            const started = lessons.some(({ lesson }) => progress.lessons[lesson.id]);
            const available = track.status === 'available';
            const units = track.units.length;
            const openUnits = track.units.filter((unit) => unit.status === 'available').length;
            const graduated = track.units.filter((unit) => isUnitGraduated(progress, unit.id)).length;

            const body = (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[length:var(--bl-step-2)] font-semibold text-ink">
                    {track.title}
                  </h3>
                  {available ? (
                    started ? (
                      <p className="shrink-0 text-xs text-subtle">
                        {done} {done === 1 ? 'lesson' : 'lessons'} done
                        {graduated > 0 ? ` · ${graduated} unit${graduated === 1 ? '' : 's'} passed` : ''}
                      </p>
                    ) : (
                      <p className="shrink-0 text-xs font-medium text-accent">Start here</p>
                    )
                  ) : (
                    <p className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-subtle">
                      Curriculum written
                    </p>
                  )}
                </div>

                <p className="measure mt-1.5 text-muted">{track.subtitle}</p>
                <p className="measure mt-4 text-sm text-accent">{track.promise}</p>

                <p className="mt-4 text-xs text-subtle">
                  {units} units ·{' '}
                  {available
                    ? `${openUnits} available now, the rest in production`
                    : 'lessons in production'}
                </p>
              </>
            );

            return (
              <li key={track.id}>
                {available ? (
                  <Link
                    href={`/course/${track.slug}`}
                    className="group block rounded-xl border border-line bg-surface px-6 py-5 transition-colors hover:border-accent/50"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="rounded-xl border border-line/60 bg-surface/40 px-6 py-5">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Where these lead</h2>
        <p className="measure mt-2 text-sm text-muted">
          Tracks stack into paths. You do not have to choose one — it is just what the road looks
          like from here.
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {LEARNING_PATHS.map((path) => (
            <li key={path.id}>
              <Link
                href={`/paths/${path.slug}`}
                className="group block rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-accent/40"
              >
                <h3 className="font-semibold text-ink group-hover:text-accent">{path.title}</h3>
                <p className="mt-1 text-sm text-muted">{path.subtitle}</p>
                <p className="mt-3 font-mono text-[11px] tracking-[0.08em] text-subtle">
                  {path.trackIds
                    .map((id) => TRACKS.find((track) => track.id === id)?.title ?? id)
                    .join('  →  ')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
