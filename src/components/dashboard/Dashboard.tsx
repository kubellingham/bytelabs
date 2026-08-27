'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { GROUND_SCENARIOS, LEARNING_PATHS, TRACKS, getTrackById, lessonsInTrack } from '@/content';
import { buildWarmupSession } from '@/lib/course/drills';
import { dueConcepts } from '@/lib/mastery';
import { localDateKey } from '@/lib/progress';
import { dailyScenario, weeklyScenario } from '@/lib/schedule';
import { useProgress } from '@/lib/storage/useProgress';

/**
 * Generic over the href so `typedRoutes` can narrow each call site to the actual
 * route it links to, rather than widening every card to `unknown`.
 */
function Card<T>({
  href,
  eyebrow,
  title,
  body,
  accent,
}: {
  href: ComponentProps<typeof Link<T>>['href'];
  eyebrow: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-xl border px-5 py-4 transition-colors ${
        accent
          ? 'border-accent/30 bg-accent-soft/40 hover:border-accent/60'
          : 'border-line bg-surface hover:border-accent/40'
      }`}
    >
      <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">{eyebrow}</p>
      <h3 className="mt-1.5 font-semibold text-ink group-hover:text-accent">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </Link>
  );
}

/**
 * The dashboard.
 *
 * What it deliberately does not do: guilt anyone. There is no "you are about to
 * lose your streak", no percentage-complete bar on a track nobody promised to
 * finish, and no comparison to another learner. It shows what is worth doing next
 * and gets out of the way.
 */
export function Dashboard() {
  const progress = useProgress();

  const due = dueConcepts(progress);
  const warmup = buildWarmupSession(due.map((entry) => entry.concept.id));
  const daily = dailyScenario(GROUND_SCENARIOS);
  const weekly = weeklyScenario(GROUND_SCENARIOS);

  const dailyDone = progress.scheduled[`daily:${localDateKey(new Date())}`]?.completedAt != null;

  // "Continue" is the furthest lesson touched, not the first unfinished one —
  // people come back to where they were, not to where they slipped.
  const lastLesson = TRACKS.flatMap(lessonsInTrack).findLast(
    ({ lesson }) => progress.lessons[lesson.id] !== undefined,
  );
  const nextLesson =
    TRACKS.flatMap(lessonsInTrack).find(
      ({ lesson }) => progress.lessons[lesson.id]?.completedAt == null,
    ) ?? null;

  const resume = lastLesson ?? nextLesson;
  const totalXp = Object.entries(progress.xp)
    .filter(([key]) => !key.startsWith('skill:'))
    .reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="mx-auto max-w-5xl px-8 py-16">
      <header className="flex items-baseline justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">ByteLabs</p>
          <h1 className="mt-2 text-[length:var(--bl-step-4)] font-semibold text-ink">
            {resume ? 'Pick up where you left off.' : 'You learn to code by coding.'}
          </h1>
          <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">
            {resume
              ? 'Or do something else entirely — nothing here is keeping score against you.'
              : 'Not by reading about it, not by watching lectures. Start with the first track and write something.'}
          </p>
        </div>

        <div className="shrink-0 text-end">
          {progress.streak.current > 0 ? (
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{progress.streak.current}</span>{' '}
              {progress.streak.current === 1 ? 'day' : 'days'} running
            </p>
          ) : null}
          {totalXp > 0 ? (
            <p className="mt-1 text-sm text-subtle">{totalXp.toLocaleString()} XP</p>
          ) : null}
        </div>
      </header>

      {resume ? (
        <div className="mt-10">
          <Card
            accent
            href={`/learn/${resume.track.slug}/${resume.unit.slug}/${resume.chapter.slug}/${resume.lesson.slug}`}
            eyebrow={`${resume.track.title} · ${resume.chapter.title}`}
            title={resume.lesson.title}
            body={resume.lesson.summary}
          />
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Worth doing today</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {warmup.length > 0 ? (
            <Card
              href="/warmup"
              eyebrow="Warm-up"
              title={`${warmup.length} ${warmup.length === 1 ? 'thing' : 'things'} starting to slip`}
              body="A few minutes on whatever is closest to being forgotten."
            />
          ) : null}

          {daily ? (
            <Card
              href={`/ground/${daily.slug}`}
              eyebrow={dailyDone ? 'Today · done' : 'Today'}
              title={daily.title}
              body={`${daily.estimatedMinutes} minutes, a real brief, a different client each time.`}
            />
          ) : null}

          {weekly ? (
            <Card
              href={`/ground/${weekly.slug}`}
              eyebrow="This week"
              title={weekly.title}
              body="A bigger piece of work, for when you have an afternoon."
            />
          ) : null}

          <Card
            href="/skills"
            eyebrow="Where you are"
            title="Your skill map"
            body="What is solid, what is shaky, and what you have not touched."
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Paths</h2>
        <div className="mt-4 space-y-3">
          {LEARNING_PATHS.map((path) => (
            <Link
              key={path.id}
              href={`/paths/${path.slug}`}
              className="group block rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-semibold text-ink group-hover:text-accent">{path.title}</h3>
                <p className="shrink-0 text-xs text-subtle">
                  {path.trackIds.length} {path.trackIds.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
              <p className="measure mt-1 text-sm text-muted">{path.subtitle}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {path.trackIds.map((id) => {
                  const track = getTrackById(id);
                  if (!track) return null;
                  return (
                    <li
                      key={id}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                        track.status === 'available'
                          ? 'bg-accent-soft text-accent'
                          : 'bg-sunken text-subtle'
                      }`}
                    >
                      {track.title}
                      {track.status === 'available' ? '' : ' · soon'}
                    </li>
                  );
                })}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Everything else</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card
            href="/ground"
            eyebrow="The Ground"
            title="Build something real"
            body="No lessons, no unlocks, nothing to fail. Pick a brief and go."
          />
          <Card
            href="/settings"
            eyebrow="Settings"
            title="Theme and skin"
            body="Light by day, dark by evening — or pick one and keep it."
          />
        </div>
      </section>
    </div>
  );
}
