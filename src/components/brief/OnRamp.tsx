'use client';

import { useMemo, useState } from 'react';

import { getConcept, humaniseSlug, type ConceptExplainer } from '@/lib/brief/concepts';

interface Props {
  taskTitle: string;
  concepts: string[];
  onDismiss: () => void;
}

type Phase = { kind: 'intro' } | { kind: 'slide'; index: number };

interface Card {
  slug: string;
  explainer: ConceptExplainer | null;
  title: string;
}

/**
 * The on-ramp.
 *
 * When a task opens, the learner sees this first — one screen, big font,
 * with the concepts the task will exercise. They can flip through each
 * concept's explainer at their own pace, skip straight to the editor, or
 * back out of a slide. "I've got the shape" or "Skip and code" both close
 * the on-ramp; the room's editor takes over from there.
 *
 * Concepts without a library entry surface as placeholder cards — the
 * learner still sees what the task expects them to know, just without
 * the ByteLabs-voice explainer that the authored library provides.
 */
export function OnRamp({ taskTitle, concepts, onDismiss }: Props) {
  const cards = useMemo<Card[]>(
    () =>
      concepts.map((slug) => {
        const explainer = getConcept(slug);
        return {
          slug,
          explainer,
          title: explainer?.title ?? humaniseSlug(slug),
        };
      }),
    [concepts],
  );

  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });

  if (cards.length === 0) {
    // Nothing to teach; skip straight past.
    onDismiss();
    return null;
  }

  if (phase.kind === 'intro') {
    return (
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-8 py-16">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          On-ramp · {taskTitle}
        </p>
        <h1 className="mt-3 text-[length:var(--bl-step-3)] font-semibold text-ink">
          This task will teach you{' '}
          <span className="text-accent">{cards.length}</span>{' '}
          thing{cards.length === 1 ? '' : 's'}.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Tap any of them to see the shape, or skip straight to the editor if you already know how
          it goes.
        </p>

        <ul className="mt-8 flex flex-wrap gap-3">
          {cards.map((card, index) => (
            <li key={card.slug}>
              <button
                type="button"
                onClick={() => setPhase({ kind: 'slide', index })}
                className="rounded-full border border-line bg-surface px-5 py-2.5 text-base font-medium text-ink transition-colors hover:border-accent hover:bg-raised"
              >
                {index + 1}. {card.title}
                {card.explainer ? null : (
                  <span className="ms-2 text-xs text-subtle">(no explainer yet)</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPhase({ kind: 'slide', index: 0 })}
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Walk me through
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-line px-5 py-3 text-base text-muted transition-colors hover:text-ink"
          >
            Skip and code
          </button>
        </div>
      </div>
    );
  }

  const card = cards[phase.index]!;
  const isLast = phase.index + 1 >= cards.length;

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-8 py-16">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          Concept {phase.index + 1} of {cards.length}
        </p>
        <button
          type="button"
          onClick={() => setPhase({ kind: 'intro' })}
          className="text-sm text-muted hover:text-ink"
        >
          ← Back to overview
        </button>
      </div>

      <h1 className="mt-3 text-[length:var(--bl-step-2)] font-semibold text-ink">
        {card.title}
      </h1>

      {card.explainer ? (
        <>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink">
            {card.explainer.blurb}
          </p>

          <div className="mt-8 overflow-hidden rounded-xl border border-line bg-code">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
                One way it looks
              </p>
              <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
                {card.explainer.language}
              </p>
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-relaxed text-ink">
              {card.explainer.snippet}
            </pre>
            {card.explainer.snippetOutput ? (
              <div className="border-t border-line px-4 py-3">
                <p className="mb-1 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
                  Output
                </p>
                <pre className="whitespace-pre-wrap font-mono text-sm text-muted">
                  {card.explainer.snippetOutput}
                </pre>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-line bg-surface p-6">
          <p className="text-lg text-muted">
            ByteLabs does not have a hand-written explainer for{' '}
            <span className="font-mono text-ink">{card.slug}</span> yet. The task expects you to
            know what it is — if you already do, keep going; if not, the assistant panel below can
            help.
          </p>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-3">
        {isLast ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            I’ve got the shape — let me code
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPhase({ kind: 'slide', index: phase.index + 1 })}
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Next concept →
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-line px-5 py-3 text-base text-muted transition-colors hover:text-ink"
        >
          Skip and code
        </button>
      </div>
    </div>
  );
}
