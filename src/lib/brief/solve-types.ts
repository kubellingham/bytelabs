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

export const solveBeatSchema = z.object({
  /**
   * The exact substring of the solution that this beat is talking about.
   * Matched verbatim in the walkthrough — beats whose `find` is not present
   * in the solution are dropped, because a highlight that lights up nothing
   * confuses more than it teaches.
   */
  find: z.string().min(1),
  /**
   * Conversational explanation, one short paragraph. This is the tone: not
   * a lecture, not a docstring — a lab TA talking through what the code is
   * doing right now.
   */
  note: z.string().min(1),
  /**
   * When the same substring appears multiple times in the solution, which
   * occurrence to light up. 1-based; defaults to the first.
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
   * Lenient grading target. When present, a learner whose stdout satisfies
   * this pattern also passes, even if it does not match expectedOutput
   * verbatim. See AcceptancePattern for the rules.
   */
  acceptancePattern: acceptancePatternSchema.optional(),
});
export type SolveResponse = z.infer<typeof solveResponseSchema>;
export type SolveResponseInput = z.input<typeof solveResponseSchema>;
