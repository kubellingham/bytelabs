import { complete } from '@/lib/ai/complete';
import { resolveModel, resolveProvider } from '@/lib/ai/provider';

import { BRIEF_SOLVE_SYSTEM, briefSolveUser } from './solve-prompt';
import {
  solveBeatSchema,
  vivaQuestionSchema,
  type SolveBeat,
  type SolveResponse,
  type VivaQuestion,
} from './solve-types';
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

  const blanks = filterValidBlanks(
    solution,
    Array.isArray(json.blanks) ? json.blanks.filter((b): b is string => typeof b === 'string') : [],
  );

  const expectedOutput =
    typeof json.expectedOutput === 'string' ? json.expectedOutput : undefined;

  const viva = filterValidViva(Array.isArray(json.viva) ? json.viva : []);

  return {
    ok: true,
    data: {
      solution,
      beats,
      blanks,
      viva,
      ...(expectedOutput !== undefined ? { expectedOutput } : {}),
    },
  };
}

/**
 * Keep only viva questions that pass the schema AND — for MCQ — whose
 * `answer` index points at a real option. Cap at 6 questions so a
 * runaway model can't drown the learner.
 */
export function filterValidViva(candidates: readonly unknown[]): VivaQuestion[] {
  const kept: VivaQuestion[] = [];
  for (const candidate of candidates) {
    const parsed = vivaQuestionSchema.safeParse(candidate);
    if (!parsed.success) continue;
    if (parsed.data.kind === 'mcq') {
      if (parsed.data.answer < 0 || parsed.data.answer >= parsed.data.options.length) continue;
    }
    kept.push(parsed.data);
    if (kept.length >= 6) break;
  }
  return kept;
}

/**
 * Keep only blanks that (a) appear in the solution, (b) are within a sane
 * length band, and (c) do not overlap with any earlier accepted blank. Order
 * of the input array is preserved so the AI can express preference.
 */
export function filterValidBlanks(solution: string, candidates: readonly string[]): string[] {
  const kept: string[] = [];
  const occupied: Array<[number, number]> = [];
  for (const raw of candidates) {
    const text = raw.trim();
    if (!text || text.length > 50) continue;
    // Reject a blank that is a strict substring of an already-kept blank, or
    // that contains one. Both would let the learner "solve" one blank by
    // filling the other, and mangle the template.
    if (kept.some((prev) => prev.includes(text) || text.includes(prev))) continue;
    const idx = solution.indexOf(text);
    if (idx < 0) continue;
    const end = idx + text.length;
    if (occupied.some(([a, b]) => idx < b && end > a)) continue;
    kept.push(text);
    occupied.push([idx, end]);
    if (kept.length >= 5) break;
  }
  return kept;
}

/**
 * The template shown to the learner in the rewrite phase: the solution with
 * each blank replaced by a placeholder of the same shape as `___`. Non-blank
 * text is preserved verbatim so the surrounding structure guides the learner.
 */
export function makeRewriteTemplate(solution: string, blanks: readonly string[]): string {
  let out = solution;
  for (const blank of blanks) {
    // Replace only the first occurrence per blank — filterValidBlanks already
    // ensured no overlap, so first-match is unambiguous.
    const idx = out.indexOf(blank);
    if (idx < 0) continue;
    out = out.slice(0, idx) + '____' + out.slice(idx + blank.length);
  }
  return out;
}

/**
 * The silhouette the learner types on top of during REWRITE.
 *
 * Round 1 (trace) shows the whole solution as a low-opacity ghost — the
 * learner types over it verbatim. Round 2 (recall) auto-removes the blanks
 * from the ghost by replacing them with whitespace of the same length, so
 * the surrounding structure stays put but the learner has to remember what
 * belongs in the gaps. Layout is preserved across rounds so the overlay
 * grid aligns cleanly.
 */
export function makeGhostForRound(
  solution: string,
  blanks: readonly string[],
  round: 1 | 2,
): string {
  if (round === 1) return solution;
  let out = solution;
  for (const blank of blanks) {
    const idx = out.indexOf(blank);
    if (idx < 0) continue;
    // Same-length whitespace preserves the visual grid — new-lines inside a
    // blank stay as new-lines so wrapping does not shift.
    const replacement = blank
      .split('')
      .map((ch) => (ch === '\n' ? '\n' : ' '))
      .join('');
    out = out.slice(0, idx) + replacement + out.slice(idx + blank.length);
  }
  return out;
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
