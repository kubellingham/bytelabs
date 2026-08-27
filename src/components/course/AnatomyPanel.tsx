'use client';

import { getConcept } from '@/content/concepts';
import type { ResolvedAnnotation } from '@/lib/content/annotations';

/**
 * The part-by-part breakdown.
 *
 * The code has already typed itself; now it comes apart. One fragment at a time,
 * at the learner's pace, with the piece under discussion lit up in the editor
 * beside this. The list stays visible so it reads as a whole thing being taken
 * apart rather than a queue of disconnected facts.
 */
export function AnatomyPanel({
  annotations,
  index,
  onSelect,
  onFinish,
  onSkip,
}: {
  annotations: readonly ResolvedAnnotation[];
  index: number;
  onSelect: (next: number) => void;
  onFinish: () => void;
  onSkip: () => void;
}) {
  const current = annotations[index];
  const atEnd = index >= annotations.length - 1;

  if (!current) return null;

  const concepts = current.annotation.concepts
    .map((id) => getConcept(id)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[length:var(--bl-step-1)] font-semibold text-ink">
          What each part does
        </h2>
        <p className="shrink-0 text-xs text-subtle">
          {index + 1} of {annotations.length}
        </p>
      </div>

      <div className="bl-beat-note mt-5 rounded-xl border border-accent/40 bg-accent-soft/50 px-4 py-4">
        <code className="font-mono text-sm text-accent">{current.annotation.find.trim()}</code>
        <p className="mt-2 text-ink">{current.annotation.label}</p>
        {concepts.length > 0 ? (
          <p className="mt-2.5 text-[11px] tracking-[0.1em] text-subtle uppercase">
            {concepts.join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(index - 1)}
          disabled={index === 0}
          className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => (atEnd ? onFinish() : onSelect(index + 1))}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          {atEnd ? 'My turn' : 'Next'}
        </button>
        {!atEnd ? (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg px-3 py-2 text-sm text-subtle transition-colors hover:text-muted"
          >
            Skip the breakdown
          </button>
        ) : null}
      </div>

      <ol className="mt-7 space-y-1 border-t border-line pt-5">
        {annotations.map((entry, position) => {
          const active = position === index;
          const seen = position < index;
          return (
            <li key={entry.annotation.id}>
              <button
                type="button"
                onClick={() => onSelect(position)}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full items-baseline gap-2.5 rounded-md px-2 py-1.5 text-start text-sm transition-colors ${
                  active ? 'bg-raised text-ink' : seen ? 'text-muted hover:bg-raised/60' : 'text-subtle hover:bg-raised/60'
                }`}
              >
                <code className="shrink-0 font-mono text-xs text-accent/80">
                  {entry.annotation.find.trim().slice(0, 22)}
                </code>
                <span className="min-w-0 truncate">{entry.annotation.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-xs text-subtle">
        You can click any underlined piece in the editor to come back to it.
      </p>
    </div>
  );
}
