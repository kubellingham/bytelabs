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

export const solveResponseSchema = z.object({
  solution: z.string().min(1),
  beats: z.array(solveBeatSchema).min(1),
});
export type SolveResponse = z.infer<typeof solveResponseSchema>;
export type SolveResponseInput = z.input<typeof solveResponseSchema>;
