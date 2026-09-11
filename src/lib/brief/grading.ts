import type { AcceptancePattern } from './solve-types';

export type GradingMode = 'strict' | 'lenient';

export type GradingResult =
  | { pass: false }
  | { pass: true; mode: GradingMode };

/**
 * Grade a learner's stdout against the reference expected output and the
 * optional lenient acceptance pattern.
 *
 * Strict pass:  trimmed stdout equals trimmed expectedOutput (verbatim).
 * Lenient pass: every mustContain substring appears in stdout AND no
 *               mustNotContain substring appears. All matches are
 *               case-insensitive.
 *
 * The strict check runs first so a learner who typed the reference wording
 * exactly is credited with strict — that lets the UI say "matched" instead
 * of "accepted (different wording)" for people who followed the silhouette
 * verbatim.
 */
export function evaluatePassing(
  stdout: string,
  expectedOutput: string | undefined,
  acceptance: AcceptancePattern | undefined,
): GradingResult {
  const got = stdout.trim();
  const want = expectedOutput?.trim() ?? '';

  if (want && got === want) return { pass: true, mode: 'strict' };

  if (acceptance) {
    const gotLower = got.toLowerCase();
    const allPresent = acceptance.mustContain.every((needle) =>
      gotLower.includes(needle.toLowerCase()),
    );
    const noneForbidden = (acceptance.mustNotContain ?? []).every(
      (needle) => !gotLower.includes(needle.toLowerCase()),
    );
    if (allPresent && noneForbidden) return { pass: true, mode: 'lenient' };
  }

  return { pass: false };
}
