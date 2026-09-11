'use client';

import { useCallback, useState } from 'react';

import type { VivaFreeform, VivaMcq, VivaQuestion } from '@/lib/brief/solve-types';

interface Props {
  questions: VivaQuestion[];
  onDone: () => void;
}

/**
 * VIVA — the "defend it" phase.
 *
 * One question at a time, mixing MCQ (buttons, click one, see feedback)
 * and freeform (short text answer, checked against a small set of
 * mustMention keywords). Skip is always available — the vibe is a lab TA
 * asking questions, not a graded oral exam.
 */
export function SolveViva({ questions, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const total = questions.length;
  const question = questions[index];

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      onDone();
      return;
    }
    setIndex(index + 1);
  }, [index, total, onDone]);

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-start px-8 py-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          Viva · Question {index + 1} of {total}
        </p>
        <button
          type="button"
          onClick={advance}
          className="text-sm text-muted hover:text-ink"
        >
          Skip →
        </button>
      </div>

      <QuestionDots count={total} activeIndex={index} />

      {question.kind === 'mcq' ? (
        <McqView key={index} q={question} isLast={index + 1 >= total} onAdvance={advance} />
      ) : (
        <FreeformView key={index} q={question} isLast={index + 1 >= total} onAdvance={advance} />
      )}
    </div>
  );
}

function QuestionDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div className="mt-4 flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-1.5 w-6 rounded-full ${
            i < activeIndex ? 'bg-accent/40' : i === activeIndex ? 'bg-accent' : 'bg-line-strong'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------ MCQ */

type McqPhase = { kind: 'pick' } | { kind: 'answered'; picked: number };

function McqView({
  q,
  isLast,
  onAdvance,
}: {
  q: VivaMcq;
  isLast: boolean;
  onAdvance: () => void;
}) {
  const [phase, setPhase] = useState<McqPhase>({ kind: 'pick' });

  const onPick = useCallback((picked: number) => {
    setPhase({ kind: 'answered', picked });
  }, []);

  const answered = phase.kind === 'answered';
  const correctIndex = q.answer;
  const wasRight = answered && phase.picked === correctIndex;

  return (
    <div>
      <h1 className="mt-6 text-[length:var(--bl-step-2)] font-semibold text-ink">{q.question}</h1>

      <ol className="mt-6 space-y-3">
        {q.options.map((option, i) => {
          const isPicked = answered && phase.picked === i;
          const isCorrect = answered && i === correctIndex;
          const base =
            'w-full rounded-xl border px-5 py-3.5 text-left text-base transition-colors';
          let cls = `${base} border-line bg-surface text-ink hover:border-accent/40 hover:bg-raised`;
          if (answered) {
            if (isCorrect) {
              cls = `${base} border-success/60 bg-success-soft text-ink`;
            } else if (isPicked) {
              cls = `${base} border-danger/60 bg-danger-soft/50 text-ink`;
            } else {
              cls = `${base} border-line bg-surface text-muted`;
            }
          }
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onPick(i)}
                className={cls}
              >
                <span className="me-3 font-mono text-xs text-subtle">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            </li>
          );
        })}
      </ol>

      {answered ? (
        <div
          role="status"
          className={`mt-6 rounded-xl border p-4 ${
            wasRight
              ? 'border-success/40 bg-success-soft/50'
              : 'border-attention/40 bg-attention-soft/40'
          }`}
        >
          <p className="mb-1 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            {wasRight ? 'Nice — that is why' : 'Not quite — the answer was'}{' '}
            {String.fromCharCode(65 + correctIndex)}
          </p>
          <p className="text-base text-ink">{q.feedback}</p>
        </div>
      ) : null}

      {answered ? (
        <button
          type="button"
          onClick={onAdvance}
          className="mt-8 rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          {isLast ? 'Done with the viva →' : 'Continue →'}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------ Freeform */

type FreeformPhase =
  | { kind: 'idle' }
  | { kind: 'accepted' }
  | { kind: 'missed'; missing: string[]; showedHint: boolean };

function FreeformView({
  q,
  isLast,
  onAdvance,
}: {
  q: VivaFreeform;
  isLast: boolean;
  onAdvance: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<FreeformPhase>({ kind: 'idle' });

  const onSubmit = useCallback(() => {
    const lower = answer.toLowerCase();
    const missing = q.mustMention.filter((needle) => !lower.includes(needle.toLowerCase()));
    if (missing.length === 0) {
      setPhase({ kind: 'accepted' });
      return;
    }
    // A first miss shows the hint (if present). A second miss keeps the hint visible.
    setPhase((current) => ({
      kind: 'missed',
      missing,
      showedHint: current.kind === 'missed' ? current.showedHint : true,
    }));
  }, [answer, q.mustMention]);

  const canSubmit = answer.trim().length > 0 && phase.kind !== 'accepted';

  return (
    <div>
      <h1 className="mt-6 text-[length:var(--bl-step-2)] font-semibold text-ink">{q.question}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        A short answer in your own words. No perfect grammar required.
      </p>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Type your answer…"
        rows={4}
        spellCheck
        className="mt-4 w-full resize-y rounded-xl border border-line bg-surface p-4 text-base leading-relaxed text-ink outline-none placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
        disabled={phase.kind === 'accepted'}
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
        >
          Submit
        </button>
        {phase.kind === 'accepted' ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-lg border border-success/60 bg-success-soft px-5 py-3 text-base font-medium text-ink transition-colors hover:bg-success-soft/80"
          >
            {isLast ? 'Done with the viva →' : 'Continue →'}
          </button>
        ) : null}
      </div>

      {phase.kind === 'accepted' ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-success/40 bg-success-soft/50 p-4"
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Answered
          </p>
          <p className="mt-1 text-base text-ink">
            You said the essential thing. That is the answer.
          </p>
        </div>
      ) : null}

      {phase.kind === 'missed' ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-attention/40 bg-attention-soft/40 p-4"
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Almost — but your answer did not mention
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {phase.missing.map((word) => (
              <li
                key={word}
                className="rounded-full border border-attention/40 bg-attention-soft/60 px-2.5 py-0.5 font-mono text-xs text-ink"
              >
                {word}
              </li>
            ))}
          </ul>
          {q.hint ? (
            <p className="mt-3 text-sm text-muted">{q.hint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
