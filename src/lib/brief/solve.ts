import { complete } from '@/lib/ai/complete';
import { resolveModel, resolveProvider } from '@/lib/ai/provider';

import { BRIEF_SOLVE_SYSTEM, briefSolveUser } from './solve-prompt';
import { solveBeatSchema, type SolveBeat, type SolveResponse } from './solve-types';
import type { BriefTask } from './types';
import { extractJson } from './verdict';

export type SolveFailure =
  | { error: 'not-configured'; message: string }
  | { error: 'model-failed'; message: string }
  | { error: 'no-solution'; message: string };

export type SolveResult =
  | { ok: true; data: SolveResponse }
  | { ok: false; failure: SolveFailure };

const MAX_TOKENS = 4000;

export async function solveTask(task: BriefTask): Promise<SolveResult> {
  const provider = resolveProvider();
  const response = await complete({
    system: BRIEF_SOLVE_SYSTEM,
    user: briefSolveUser(task),
    // Solve is a smaller job than a fresh parse — a solid working solution
    // for a beginner task plus 4-8 short beats. Reuse the brief-role model
    // so a deployment only tunes one env var; upgrading is a follow-up if
    // the shape genuinely calls for a bigger model.
    model: resolveModel('brief', provider.provider),
    maxTokens: MAX_TOKENS,
  });

  if (!response.ok) {
    if (response.error === 'not-configured') {
      return { ok: false, failure: { error: 'not-configured', message: response.message } };
    }
    return { ok: false, failure: { error: 'model-failed', message: response.message } };
  }

  const json = extractJson(response.text);
  if (!json || typeof json.solution !== 'string' || !Array.isArray(json.beats)) {
    return {
      ok: false,
      failure: {
        error: 'model-failed',
        message: 'The walkthrough author returned something that was not the expected JSON shape.',
      },
    };
  }

  const solution = json.solution.trim();
  if (!solution) {
    return {
      ok: false,
      failure: { error: 'no-solution', message: 'No solution was produced.' },
    };
  }

  // Validate beats: schema check + each beat's `find` must appear at the
  // requested occurrence in the solution. Drop beats that fail either check —
  // a highlight that lights up nothing confuses more than it teaches.
  const beats: SolveBeat[] = [];
  for (const candidate of json.beats) {
    const parsed = solveBeatSchema.safeParse(candidate);
    if (!parsed.success) continue;
    if (!hasNthOccurrence(solution, parsed.data.find, parsed.data.occurrence)) continue;
    beats.push(parsed.data);
  }

  if (beats.length === 0) {
    return {
      ok: false,
      failure: {
        error: 'no-solution',
        message: 'The walkthrough author produced a solution but no valid beats.',
      },
    };
  }

  return { ok: true, data: { solution, beats } };
}

/**
 * Check that `find` appears at least `occurrence` times in `text`.
 * The walkthrough highlighter uses the same rule when it picks the Nth
 * instance to light up, so the validator matches it exactly.
 */
export function hasNthOccurrence(text: string, find: string, occurrence: number): boolean {
  if (!find) return false;
  let index = -find.length;
  let count = 0;
  while ((index = text.indexOf(find, index + find.length)) !== -1) {
    count += 1;
    if (count >= occurrence) return true;
  }
  return false;
}
