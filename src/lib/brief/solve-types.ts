import { z } from 'zod';

/**
 * The AI-generated walkthrough for one BriefTask.
 *
 * The `solution` is the complete working code — what the learner will read
 * first (SEE) and later type over (REWRITE, PR 5). The `beats` array walks
 * that solution chunk by chunk in conversational voice; each beat lights up
 * one substring of the solution and dims the rest.
 *
 * Future fields (planned in later PRs, kept in shape here so cached
 * responses can carry them forward):
 *   - blanks:  Array<{ find: string; hint?: string }>  — for REWRITE
 *   - viva:    Array<{ kind: 'mcq' | 'freeform'; ... }> — for VIVA
 */

/**
 * "Why this piece?" — a short MCQ inside a beat that ties the chunk to
 * the task's actual decision (why a dict vs a list, why sorted with
 * reverse=True, why break early). Sharpens understanding beyond syntax.
 */
export const beatWhySchema = z.object({
  question: z.string().min(1).max(280),
  options: z.array(z.string().min(1).max(160)).min(2).max(4),
  answer: z.number().int().nonnegative(),
  feedback: z.string().min(1).max(280),
});
export type BeatWhy = z.infer<typeof beatWhySchema>;

/**
 * "Say it back" — a freeform recall prompt at the end of a beat.
 * The learner explains the chunk in their own words; a couple of
 * required keywords check that the essential idea is present.
 */
export const beatSayItBackSchema = z.object({
  question: z.string().min(1).max(280),
  mustMention: z.array(z.string().min(1).max(40)).min(1).max(4),
  hint: z.string().min(1).max(280).optional(),
});
export type BeatSayItBack = z.infer<typeof beatSayItBackSchema>;

export const solveBeatSchema = z.object({
  /**
   * The exact substring of the solution that this beat is about.
   * Matched verbatim in the walkthrough — beats whose `find` is not
   * present in the solution are dropped.
   */
  find: z.string().min(1),
  /**
   * The "See" note: one sentence pointing at the mechanic while the
   * chunk is highlighted. Used in step 2 of the beat.
   */
  note: z.string().min(1),
  /**
   * The "Frame" — plain-English intro that sets up the chunk before
   * any code is shown. Two short sentences, no jargon, no code. Step 1
   * of the beat. Optional so old cached responses still render, but
   * the prompt requires it.
   */
  intro: z.string().min(1).max(400).optional(),
  /**
   * "Why this piece?" — the MCQ that ties the chunk to a real task
   * decision. Step 4 of the beat. Optional to allow graceful fallback
   * when the AI cannot craft a sharp question for a trivial beat.
   */
  why: beatWhySchema.optional(),
  /**
   * "Say it back" — freeform recall prompt. Step 5 of the beat.
   * Optional; skipped when absent.
   */
  sayItBack: beatSayItBackSchema.optional(),
  /**
   * When the same substring appears multiple times in the solution,
   * which occurrence to light up. 1-based; defaults to the first.
   */
  occurrence: z.number().int().positive().default(1),
});
export type SolveBeat = z.infer<typeof solveBeatSchema>;

/**
 * The blanks the learner fills in during the REWRITE phase. Each is a short,
 * meaningful substring of the solution — a range bound, an operator, a
 * variable name — that gets replaced with a placeholder in the template the
 * learner sees, and that they type back to prove they understood the shape.
 *
 * The parser drops blanks whose text is not in the solution, and drops
 * blanks that overlap with any earlier blank (so `range` and `range(2, n)`
 * cannot both be blanks in the same rewrite).
 */
/**
 * A lenient fallback for grading the rewrite.
 *
 * `expectedOutput` is exact — the learner's stdout must equal it verbatim
 * (after trim) to pass strictly. But a learner who wrote a valid solution
 * with slightly different wording ("7 is prime" vs "7 is a prime number.")
 * would fail strict grading even though their answer is correct.
 * `acceptancePattern` gives the grader a way to say yes to those too:
 *
 *   mustContain    all of these substrings must appear in stdout
 *                  (case-insensitive)
 *   mustNotContain none of these substrings may appear
 *                  (used when the same word can appear in both a right
 *                   and a wrong answer — e.g. "prime" appears in both
 *                   "is prime" and "is not prime"; for a prime input the
 *                   pattern rejects "not" via mustNotContain)
 */
export const acceptancePatternSchema = z.object({
  mustContain: z.array(z.string().min(1).max(80)).min(1).max(6),
  mustNotContain: z.array(z.string().min(1).max(80)).max(6).optional(),
});
export type AcceptancePattern = z.infer<typeof acceptancePatternSchema>;

/**
 * VIVA — the "defend it" round after REWRITE.
 *
 * Two shapes:
 *  - MCQ: a specific question with 3-4 short options and one correct
 *    answer. Fast to check, sharp for calibrating "did they understand".
 *  - FREEFORM: an open-ended "why" question. The learner types a short
 *    explanation; the grader checks that a few key words are present
 *    (case-insensitive substring). Not scored strictly — the point is to
 *    make the learner *say* the reason out loud.
 */
export const vivaMcqSchema = z.object({
  kind: z.literal('mcq'),
  question: z.string().min(1).max(280),
  options: z.array(z.string().min(1).max(160)).min(2).max(4),
  answer: z.number().int().nonnegative(),
  /** One-sentence explanation shown after the learner picks. */
  feedback: z.string().min(1).max(280),
});
export type VivaMcq = z.infer<typeof vivaMcqSchema>;

export const vivaFreeformSchema = z.object({
  kind: z.literal('freeform'),
  question: z.string().min(1).max(280),
  /**
   * Short case-insensitive substrings that MUST appear in the learner's
   * answer for the question to count as answered. Aim for 1-3 substrings
   * per question — the essential words the learner has to have said.
   */
  mustMention: z.array(z.string().min(1).max(40)).min(1).max(4),
  /** Optional nudge shown when the learner's first attempt misses. */
  hint: z.string().min(1).max(280).optional(),
});
export type VivaFreeform = z.infer<typeof vivaFreeformSchema>;

export const vivaQuestionSchema = z.discriminatedUnion('kind', [
  vivaMcqSchema,
  vivaFreeformSchema,
]);
export type VivaQuestion = z.infer<typeof vivaQuestionSchema>;

export const solveResponseSchema = z.object({
  solution: z.string().min(1),
  beats: z.array(solveBeatSchema).min(1),
  /** 2-5 non-overlapping substrings the learner types back in the rewrite. */
  blanks: z.array(z.string().min(1).max(50)).default([]),
  /**
   * What the reference solution prints. Strict grading target: the
   * learner's stdout must equal this after trimming. Absent when the
   * task's own `expected` (from parse) already carries the truth.
   */
  expectedOutput: z.string().optional(),
  /**
   * The representative stdin the reference solution was written against
   * — one line per prompt. When the solution reads via `input()`, the
   * runtime pipes these lines into Pyodide's stdin in order so the
   * learner's rewrite runs the same way the reference does. Absent when
   * the solution reads no input.
   */
  expectedInput: z.string().optional(),
  /**
   * Lenient grading target. When present, a learner whose stdout satisfies
   * this pattern also passes, even if it does not match expectedOutput
   * verbatim. See AcceptancePattern for the rules.
   */
  acceptancePattern: acceptancePatternSchema.optional(),
  /**
   * The VIVA — a mixed handful of MCQ + freeform questions the learner
   * answers after the rewrite passes. Empty or absent means we skip the
   * viva phase entirely.
   */
  viva: z.array(vivaQuestionSchema).default([]),
});
export type SolveResponse = z.infer<typeof solveResponseSchema>;
export type SolveResponseInput = z.input<typeof solveResponseSchema>;
