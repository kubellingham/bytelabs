'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { GROUND_SCENARIOS, TRACKS, lessonsInTrack } from '@/content';
import { buildWarmupSession } from '@/lib/course/drills';
import { dueConcepts } from '@/lib/mastery';
import { dailyScenario } from '@/lib/schedule';
import { useProgress } from '@/lib/storage/useProgress';

/**
 * Generic over the href so `typedRoutes` narrows each call site to the route it
 * actually links to, rather than widening every card to `unknown`.
 */
function Card<T>({
  href,
  eyebrow,
  title,
  body,
}: {
  href: ComponentProps<typeof Link<T>>['href'];
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-accent/40"
    >
      <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">{eyebrow}</p>
      <h3 className="mt-1.5 font-semibold text-ink group-hover:text-accent">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </Link>
  );
}

/**
 * Home.
 *
 * This is a place to *resume*, not a directory — the navigation is the directory
 * now, and a dashboard that repeats it just makes the app feel like one long pile
 * of cards with no main road through it.
 *
 * What it still refuses to do: guilt anyone. No "you are about to lose your
 * streak", no completion percentage on a track nobody promised to finish, and no
 * comparison to another learner.
 */
export function Dashboard() {
  const progress = useProgress();

  const ordered = TRACKS.flatMap(lessonsInTrack);
  const lastLesson = ordered.findLast(({ lesson }) => progress.lessons[lesson.id] !== undefined);
  const firstLesson = ordered.find(
    ({ lesson }) => progress.lessons[lesson.id]?.completedAt == null,
  );

  // Somebody who has never opened a lesson is not "picking up where they left
  // off", and telling them they are is a small lie the whole page rests on.
  const returning = lastLesson !== undefined;
  const resume = lastLesson ?? firstLesson ?? null;

  const warmup = buildWarmupSession(dueConcepts(progress).map((entry) => entry.concept.id));
  const daily = dailyScenario(GROUND_SCENARIOS);

  return (
    <>
      <header>
        <h1 className="text-[length:var(--bl-step-4)] font-semibold text-ink">
          {returning ? 'Pick up where you left off.' : 'You learn to code by coding.'}
        </h1>
        <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">
          {returning
            ? 'Or do something else entirely — nothing here is keeping score against you.'
            : 'Not by reading about it, not by watching lectures. Start with the first track and write something.'}
        </p>
      </header>

      {resume ? (
        <Link
          href={`/learn/${resume.track.slug}/${resume.unit.slug}/${resume.chapter.slug}/${resume.lesson.slug}`}
          className="group mt-10 block rounded-xl border border-accent/30 bg-accent-soft/40 px-6 py-5 transition-colors hover:border-accent/60"
        >
          <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">
            {returning
              ? `Continue · ${resume.track.title} · ${resume.chapter.title}`
              : `Start here · ${resume.track.title}`}
          </p>
          <h2 className="mt-1.5 text-[length:var(--bl-step-2)] font-semibold text-ink group-hover:text-accent">
            {resume.lesson.title}
          </h2>
          <p className="measure mt-1 text-muted">{resume.lesson.summary}</p>
        </Link>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">The two ways in</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card
            href="/course"
            eyebrow="Taught"
            title="The Course"
            body="Shown to you, then typed by you, then built from a brief with no help."
          />
          <Card
            href="/ground"
            eyebrow="Open"
            title="The Ground"
            body="No lessons, no unlocks, nothing to fail. A client and a brief."
          />
        </div>
      </section>

      {warmup.length > 0 || daily ? (
        <section className="mt-12">
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
                eyebrow="Today"
                title={daily.title}
                body={`${daily.estimatedMinutes} minutes, a real brief, a different client each time.`}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
