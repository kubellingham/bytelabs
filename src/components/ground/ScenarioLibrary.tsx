'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { getSkill } from '@/content/concepts';
import type { Scenario, ScenarioTier } from '@/lib/content/schema';
import { useProgress } from '@/lib/storage/useProgress';

const TIERS: { id: ScenarioTier | 'all'; label: string; note: string }[] = [
  { id: 'all', label: 'Everything', note: '' },
  { id: 'beginner', label: 'Beginner', note: 'One idea at a time' },
  { id: 'intermediate', label: 'Intermediate', note: 'A real feature, done properly' },
  { id: 'elite', label: 'Elite', note: 'The whole job, from a brief' },
];

/**
 * The Ground's library.
 *
 * Nothing here is locked — the brief is explicit that difficulty is open and the
 * learner picks. Tiers are framing; the skill tags underneath are what actually
 * answers "what should I do about my shaky flexbox", and what a future Studying
 * Kube syllabus filter will read.
 */
export function ScenarioLibrary({ scenarios }: { scenarios: readonly Scenario[] }) {
  const progress = useProgress();
  const [tier, setTier] = useState<ScenarioTier | 'all'>('all');
  const [skill, setSkill] = useState<string | null>(null);

  const skills = useMemo(() => {
    const seen = new Map<string, number>();
    for (const scenario of scenarios) {
      for (const id of scenario.skills) seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [scenarios]);

  const shown = scenarios.filter(
    (scenario) =>
      (tier === 'all' || scenario.tier === tier) && (skill === null || scenario.skills.includes(skill)),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TIERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTier(option.id)}
            aria-pressed={tier === option.id}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              tier === option.id
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSkill(null)}
          aria-pressed={skill === null}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            skill === null ? 'bg-raised text-ink' : 'text-subtle hover:text-muted'
          }`}
        >
          any skill
        </button>
        {skills.map(([id, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSkill(skill === id ? null : id)}
            aria-pressed={skill === id}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              skill === id ? 'bg-accent text-on-accent' : 'text-subtle hover:text-muted'
            }`}
          >
            {getSkill(id)?.label ?? id} <span className="opacity-60">{count}</span>
          </button>
        ))}
      </div>

      <ul className="mt-8 space-y-3">
        {shown.map((scenario) => {
          const record = progress.scenarios[scenario.id];
          const done = record?.completedAt != null;

          return (
            <li key={scenario.id}>
              <Link
                href={`/ground/${scenario.slug}`}
                className="group block rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">
                      {scenario.tier} · {scenario.estimatedMinutes} min ·{' '}
                      {scenario.variants.length} clients
                    </p>
                    <h2 className="mt-1 text-[length:var(--bl-step-1)] font-semibold text-ink group-hover:text-accent">
                      {scenario.title}
                    </h2>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {scenario.skills.map((id) => (
                        <li
                          key={id}
                          className="rounded-full bg-sunken px-2.5 py-0.5 text-[11px] text-subtle"
                        >
                          {getSkill(id)?.label ?? id}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {done ? (
                    <span className="shrink-0 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                      Built
                    </span>
                  ) : record ? (
                    <span className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-subtle">
                      {record.satisfiedRequirements.length}/{scenario.requirements.length}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {shown.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface px-5 py-8 text-center text-muted">
          Nothing matches that combination yet. More scenarios are being written.
        </p>
      ) : null}
    </div>
  );
}
