'use client';

import { useCallback, useState } from 'react';

import { applyCodeEditorKey } from '@/lib/brief/editor-keys';
import { useEditorZoom, zoomStyle } from '@/lib/brief/editor-zoom';
import type { SolveBeat } from '@/lib/brief/solve-types';

import { EditorZoomControls } from './EditorZoomControls';

interface Props {
  index: number;
  totalBeats: number;
  beat: SolveBeat;
  isLast: boolean;
  isLastLeadsToRewrite: boolean;
  onBack: () => void;
  onAdvance: () => void;
}

/**
 * A beat is a five-step mini-lesson about ONE chunk of the solution.
 * The steps below spiral over the same chunk — plain-English framing,
 * pointed mechanic, type from memory, decision MCQ, freeform recall —
 * so by the end the learner has touched the same idea five ways.
 *
 * The right-hand code panel always shows the whole solution with this
 * beat's `find` lit up; step transitions happen inside the left aside.
 * When all steps for a beat are sealed we call `onAdvance` and the
 * walkthrough moves on to the next beat.
 *
 * Steps we can skip gracefully:
 *   why       — omitted when the AI did not craft an MCQ for this beat
 *   sayItBack — same, omitted when absent
 *
 * The type-it step is always present because the chunk itself is the
 * spine of the lesson.
 */

type Step =
  | { kind: 'frame' }
  | { kind: 'see' }
  | { kind: 'type' }
  | { kind: 'why' }
  | { kind: 'say' };

function planSteps(beat: SolveBeat): Step[] {
  const out: Step[] = [];
  if (beat.intro) out.push({ kind: 'frame' });
  out.push({ kind: 'see' });
  out.push({ kind: 'type' });
  if (beat.why) out.push({ kind: 'why' });
  if (beat.sayItBack) out.push({ kind: 'say' });
  return out;
}

export function BeatMiniLesson({
  index,
  totalBeats,
  beat,
  isLast,
  isLastLeadsToRewrite,
  onBack,
  onAdvance,
}: Props) {
  const steps = planSteps(beat);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex] ?? steps[0];

  const isFinalStep = stepIndex === steps.length - 1;

  const goNext = useCallback(() => {
    if (isFinalStep) {
      onAdvance();
      return;
    }
    setStepIndex((n) => n + 1);
  }, [isFinalStep, onAdvance]);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          Beat {index + 1} of {totalBeats}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted hover:text-ink"
        >
          ← Back to overview
        </button>
      </div>

      <StepDots count={steps.length} activeIndex={stepIndex} />

      {step?.kind === 'frame' ? (
        <FrameStep intro={beat.intro ?? ''} onAdvance={goNext} />
      ) : null}
      {step?.kind === 'see' ? (
        <SeeStep note={beat.note} find={beat.find} onAdvance={goNext} />
      ) : null}
      {step?.kind === 'type' ? (
        <TypeStep find={beat.find} onAdvance={goNext} />
      ) : null}
      {step?.kind === 'why' && beat.why ? (
        <WhyStep why={beat.why} onAdvance={goNext} />
      ) : null}
      {step?.kind === 'say' && beat.sayItBack ? (
        <SayStep
          say={beat.sayItBack}
          isLastOverall={isLast && isFinalStep}
          isLastLeadsToRewrite={isLastLeadsToRewrite}
          onAdvance={goNext}
        />
      ) : null}

      {step?.kind !== 'say' && isFinalStep ? (
        // Fallback continue button for the rare case where the last step
        // isn't `say` (no sayItBack authored). Otherwise each step owns
        // its own advance button so the flow reads cleanly.
        <button
          type="button"
          onClick={goNext}
          className="mt-8 rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          {isLast
            ? isLastLeadsToRewrite
              ? 'Try it yourself →'
              : 'Close walkthrough →'
            : 'Next beat →'}
        </button>
      ) : null}
    </>
  );
}

function StepDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div className="mt-4 flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-1.5 w-4 rounded-full ${
            i < activeIndex ? 'bg-accent/40' : i === activeIndex ? 'bg-accent' : 'bg-line-strong'
          }`}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------- Step 1: Frame */

function FrameStep({ intro, onAdvance }: { intro: string; onAdvance: () => void }) {
  return (
    <>
      <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
        First — the idea
      </p>
      <p className="mt-3 text-lg leading-relaxed text-ink">{intro}</p>
      <button
        type="button"
        onClick={onAdvance}
        className="mt-8 rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        Show me the code →
      </button>
    </>
  );
}

/* ---------------------------------------- Step 2: See */

function SeeStep({
  note,
  find,
  onAdvance,
}: {
  note: string;
  find: string;
  onAdvance: () => void;
}) {
  return (
    <>
      <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
        Now — what it looks like
      </p>
      <p className="mt-3 text-lg leading-relaxed text-ink">{note}</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-code">
        <div className="border-b border-line px-4 py-2">
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            This chunk
          </p>
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-sm text-ink">{find}</pre>
      </div>

      <button
        type="button"
        onClick={onAdvance}
        className="mt-8 rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        Now you type it →
      </button>
    </>
  );
}

/* ---------------------------------------- Step 3: Type */

type TypePhase = { kind: 'try' } | { kind: 'wrong' } | { kind: 'right' };

function TypeStep({ find, onAdvance }: { find: string; onAdvance: () => void }) {
  const [value, setValue] = useState('');
  const [phase, setPhase] = useState<TypePhase>({ kind: 'try' });
  const { scale } = useEditorZoom();
  const style = zoomStyle(scale);
  const rows = Math.max(3, find.split('\n').length + 1);

  const check = useCallback(() => {
    if (value === find) {
      setPhase({ kind: 'right' });
    } else {
      setPhase({ kind: 'wrong' });
    }
  }, [value, find]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key === 'Enter') {
        event.preventDefault();
        check();
        return;
      }
      const el = event.currentTarget;
      const applied = applyCodeEditorKey(event, value, el.selectionStart, el.selectionEnd);
      if (applied) {
        event.preventDefault();
        setValue(applied.next);
      }
    },
    [check, value],
  );

  const reveal = useCallback(() => {
    setValue(find);
    setPhase({ kind: 'right' });
  }, [find]);

  return (
    <>
      <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
        Type it out
      </p>
      <p className="mt-3 text-base text-muted">
        From memory — the same chunk you just read.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-code">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Your typing
          </p>
          <div className="flex items-center gap-3">
            <EditorZoomControls />
            <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
              ⌘/Ctrl + Enter to check
            </p>
          </div>
        </div>
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (phase.kind !== 'try') setPhase({ kind: 'try' });
          }}
          onKeyDown={onKeyDown}
          rows={rows}
          spellCheck={false}
          style={style}
          className="w-full resize-none bg-transparent px-4 py-3 font-mono text-ink caret-accent outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={check}
          disabled={value.length === 0 || phase.kind === 'right'}
          className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
        >
          Check
        </button>
        {phase.kind !== 'right' ? (
          <button
            type="button"
            onClick={reveal}
            className="text-sm text-muted hover:text-ink"
          >
            Show me the answer
          </button>
        ) : null}
        {phase.kind === 'right' ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-lg border border-success/60 bg-success-soft px-5 py-3 text-base font-medium text-ink transition-colors hover:bg-success-soft/80"
          >
            Continue →
          </button>
        ) : null}
      </div>

      {phase.kind === 'wrong' ? (
        <p role="status" className="mt-3 text-sm text-attention">
          Not quite — try once more, or reveal it and read it again.
        </p>
      ) : null}
      {phase.kind === 'right' ? (
        <p role="status" className="mt-3 text-sm text-success">
          That is it — same as the reference.
        </p>
      ) : null}
    </>
  );
}

/* ---------------------------------------- Step 4: Why (MCQ) */

type WhyPhase = { kind: 'pick' } | { kind: 'answered'; picked: number };

function WhyStep({
  why,
  onAdvance,
}: {
  why: NonNullable<SolveBeat['why']>;
  onAdvance: () => void;
}) {
  const [phase, setPhase] = useState<WhyPhase>({ kind: 'pick' });
  const answered = phase.kind === 'answered';
  const correctIndex = why.answer;
  const wasRight = answered && phase.picked === correctIndex;

  return (
    <>
      <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
        Why this piece?
      </p>
      <h3 className="mt-3 text-lg leading-relaxed text-ink">{why.question}</h3>

      <ol className="mt-4 space-y-2">
        {why.options.map((option, i) => {
          const isPicked = answered && phase.picked === i;
          const isCorrect = answered && i === correctIndex;
          const base =
            'w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors';
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
                onClick={() => setPhase({ kind: 'answered', picked: i })}
                className={cls}
              >
                <span className="me-2 font-mono text-xs text-subtle">
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
          className={`mt-4 rounded-lg border p-3 ${
            wasRight
              ? 'border-success/40 bg-success-soft/50'
              : 'border-attention/40 bg-attention-soft/40'
          }`}
        >
          <p className="mb-1 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            {wasRight ? 'Right — that is why' : `Not quite — the answer was ${String.fromCharCode(65 + correctIndex)}`}
          </p>
          <p className="text-sm text-ink">{why.feedback}</p>
        </div>
      ) : null}

      {answered ? (
        <button
          type="button"
          onClick={onAdvance}
          className="mt-6 rounded-lg bg-accent px-6 py-3 text-base font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Continue →
        </button>
      ) : null}
    </>
  );
}

/* ---------------------------------------- Step 5: Say it back */

type SayPhase =
  | { kind: 'idle' }
  | { kind: 'accepted' }
  | { kind: 'missed'; missing: string[] };

function SayStep({
  say,
  isLastOverall,
  isLastLeadsToRewrite,
  onAdvance,
}: {
  say: NonNullable<SolveBeat['sayItBack']>;
  isLastOverall: boolean;
  isLastLeadsToRewrite: boolean;
  onAdvance: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<SayPhase>({ kind: 'idle' });

  const check = useCallback(() => {
    const lower = answer.toLowerCase();
    const missing = say.mustMention.filter((needle) => !lower.includes(needle.toLowerCase()));
    if (missing.length === 0) {
      setPhase({ kind: 'accepted' });
      return;
    }
    setPhase({ kind: 'missed', missing });
  }, [answer, say.mustMention]);

  const advanceLabel = isLastOverall
    ? isLastLeadsToRewrite
      ? 'Try the whole thing →'
      : 'Close walkthrough →'
    : 'Next beat →';

  return (
    <>
      <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
        Say it back
      </p>
      <h3 className="mt-3 text-lg leading-relaxed text-ink">{say.question}</h3>
      <p className="mt-2 text-sm text-muted">Short — one line in your own words is enough.</p>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="In your own words…"
        rows={3}
        spellCheck
        className="mt-3 w-full resize-y rounded-lg border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
        disabled={phase.kind === 'accepted'}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={check}
          disabled={answer.trim().length === 0 || phase.kind === 'accepted'}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
        >
          Check
        </button>
        <button
          type="button"
          onClick={onAdvance}
          className="text-sm text-muted hover:text-ink"
        >
          Skip →
        </button>
        {phase.kind === 'accepted' ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-lg border border-success/60 bg-success-soft px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-success-soft/80"
          >
            {advanceLabel}
          </button>
        ) : null}
      </div>

      {phase.kind === 'missed' ? (
        <div
          role="status"
          className="mt-3 rounded-lg border border-attention/40 bg-attention-soft/40 p-3"
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            Almost — but you did not mention
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
          {say.hint ? <p className="mt-2 text-sm text-muted">{say.hint}</p> : null}
        </div>
      ) : null}

      {phase.kind === 'accepted' ? (
        <p role="status" className="mt-3 text-sm text-success">
          Good — that is the idea.
        </p>
      ) : null}
    </>
  );
}
