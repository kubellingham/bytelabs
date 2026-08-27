'use client';

import type { Requirement } from '@/lib/content/checks';
import type { RequirementResult } from '@/components/runner/useRequirements';

/**
 * The brief's requirements, ticking as they are met.
 *
 * There is no failure state anywhere in this component. A requirement is either
 * ticked or it is not ticked *yet*, and the detail line says what is missing rather
 * than what is wrong. No score, no red, no cross.
 */
export function RequirementList({
  requirements,
  results,
  running,
  /** Requirements already banked in a previous session stay ticked. */
  alreadySatisfied,
}: {
  requirements: readonly Requirement[];
  results: Record<string, RequirementResult>;
  running?: boolean;
  alreadySatisfied?: readonly string[];
}) {
  const banked = new Set(alreadySatisfied ?? []);

  return (
    <ul className="space-y-2" aria-busy={running ? 'true' : 'false'}>
      {requirements.map((requirement) => {
        const satisfied = results[requirement.id]?.satisfied || banked.has(requirement.id);
        const detail = results[requirement.id]?.detail;

        return (
          <li
            key={requirement.id}
            className={`flex gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
              satisfied
                ? 'border-success/30 bg-success-soft/40'
                : 'border-line bg-surface'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors ${
                satisfied
                  ? 'border-success bg-success text-bg'
                  : 'border-line-strong text-transparent'
              }`}
            >
              ✓
            </span>
            <div className="min-w-0">
              <p className={`text-sm ${satisfied ? 'text-ink' : 'text-muted'}`}>
                {requirement.label}
                <span className="sr-only">{satisfied ? ' — done' : ' — not yet'}</span>
              </p>
              {!satisfied && detail ? (
                <p className="mt-1 text-xs text-subtle">{detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
