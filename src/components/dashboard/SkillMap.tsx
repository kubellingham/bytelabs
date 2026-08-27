'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { SKILLS, conceptsForSkill, getSkill } from '@/content/concepts';
import { GROUND_SCENARIOS } from '@/content';
import { currentStrength, masteryTag, skillSummaries } from '@/lib/mastery';
import { useProgress } from '@/lib/storage/useProgress';

/**
 * The skill map.
 *
 * An honest picture rather than a flattering one: it distinguishes "you have not
 * started this" from "you started it and it is shaky", and points at something
 * concrete to do about the second. No comparison to anyone else — the brief rules
 * that out, and it would not help anyway.
 */
export function SkillMap() {
  const progress = useProgress();

  const summaries = useMemo(() => skillSummaries(progress), [progress]);
  const started = summaries.filter((summary) => summary.met > 0);
  const untouched = summaries.filter((summary) => summary.met === 0);

  const shakiest = [...started].sort((a, b) => a.strength - b.strength).slice(0, 3);

  if (started.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
        <p className="text-muted">
          Nothing to show yet. Do a lesson or build something and this fills in on its own.
        </p>
        <Link
          href="/course/html-css"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Start with HTML & CSS
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {shakiest.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">
            Worth some attention
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {shakiest.map((summary) => {
              const skill = getSkill(summary.skillId);
              const scenario = GROUND_SCENARIOS.find((s) => s.skills.includes(summary.skillId));
              return (
                <div
                  key={summary.skillId}
                  className="rounded-xl border border-line bg-surface px-4 py-4"
                >
                  <p className="font-semibold text-ink">{skill?.label ?? summary.skillId}</p>
                  <p className="mt-1 text-xs text-subtle">
                    {Math.round(summary.strength * 100)}% solid · {summary.met} of{' '}
                    {summary.total} met
                  </p>
                  {scenario ? (
                    <Link
                      href={`/ground/${scenario.slug}`}
                      className="mt-3 inline-block text-sm text-accent hover:underline"
                    >
                      Practise it →
                    </Link>
                  ) : (
                    <Link href="/warmup" className="mt-3 inline-block text-sm text-accent hover:underline">
                      Warm it up →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">What you have touched</h2>
        <ul className="mt-4 space-y-2">
          {started
            .sort((a, b) => b.strength - a.strength)
            .map((summary) => {
              const skill = getSkill(summary.skillId);
              const tag = masteryTag(summary);
              const concepts = conceptsForSkill(summary.skillId);

              return (
                <li
                  key={summary.skillId}
                  className="rounded-xl border border-line bg-surface px-5 py-4"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-medium text-ink">{skill?.label ?? summary.skillId}</p>
                    <div className="flex shrink-0 items-center gap-3">
                      {tag ? (
                        <span className="rounded-full bg-sunken px-2.5 py-0.5 text-[11px] text-muted">
                          {tag}
                        </span>
                      ) : null}
                      <span className="text-xs text-subtle">
                        {summary.met}/{summary.total}
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(summary.strength * 100)}
                    aria-label={`${skill?.label ?? summary.skillId} retention`}
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{ width: `${Math.max(2, summary.strength * 100)}%` }}
                    />
                  </div>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {concepts
                      .filter((concept) => progress.concepts[concept.id])
                      .map((concept) => {
                        const strength = currentStrength(progress.concepts[concept.id]);
                        return (
                          <li
                            key={concept.id}
                            title={`${Math.round(strength * 100)}% solid`}
                            className="rounded-full px-2 py-0.5 text-[11px]"
                            style={{
                              backgroundColor: 'var(--bl-surface-sunken)',
                              color:
                                strength > 0.6 ? 'var(--bl-text-muted)' : 'var(--bl-text-subtle)',
                              opacity: 0.45 + strength * 0.55,
                            }}
                          >
                            {concept.label}
                          </li>
                        );
                      })}
                  </ul>
                </li>
              );
            })}
        </ul>
      </section>

      {untouched.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Not started</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {untouched.map((summary) => (
              <li
                key={summary.skillId}
                className="rounded-full border border-line px-3 py-1 text-xs text-subtle"
              >
                {SKILLS.find((s) => s.id === summary.skillId)?.label ?? summary.skillId}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
