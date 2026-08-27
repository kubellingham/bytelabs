import type { ConceptMastery } from '@/lib/storage/types';

/**
 * Retention decay.
 *
 * A concept's stored strength is its value at `lastSeenAt`; what matters now is
 * that value decayed by however long it has been. Half-life extends with each
 * success, which is the spacing effect: the third time you get something right it
 * sticks around far longer than the first.
 *
 * This is deliberately simple — a two-parameter forgetting curve, not SM-2. It only
 * has to be good enough to order a warm-up queue and fade ghost text, and a model
 * nobody can reason about is worse than a slightly coarse one.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Half-life for a concept met successfully once. */
export const BASE_HALF_LIFE_MS = 3 * DAY_MS;

/** Each additional success multiplies how long the memory survives. */
export const SPACING_FACTOR = 0.8;

/** Ceiling, so a concept is never treated as permanently learned. */
export const MAX_HALF_LIFE_MS = 180 * DAY_MS;

export function halfLifeFor(successes: number): number {
  const scaled = BASE_HALF_LIFE_MS * (1 + Math.max(0, successes - 1) * SPACING_FACTOR);
  return Math.min(scaled, MAX_HALF_LIFE_MS);
}

/** Strength right now, 0-1, accounting for time since the concept was last met. */
export function currentStrength(
  mastery: ConceptMastery | undefined,
  now: Date = new Date(),
): number {
  if (!mastery) return 0;

  const lastSeen = Date.parse(mastery.lastSeenAt);
  if (!Number.isFinite(lastSeen)) return mastery.strengthAtLastSeen;

  const elapsed = Math.max(0, now.getTime() - lastSeen);
  const halfLife = halfLifeFor(mastery.successes);
  const decayed = mastery.strengthAtLastSeen * Math.pow(0.5, elapsed / halfLife);

  return Math.min(1, Math.max(0, decayed));
}

/**
 * How faint this concept's ghost text should be, as one of four steps rather than a
 * continuous opacity. Steps are stable across sessions and easy to reason about;
 * a continuously varying opacity reads as flicker.
 *
 * 0 = fully visible scaffolding, 3 = effectively gone.
 */
export type GhostLevel = 0 | 1 | 2 | 3;

export function ghostLevelFor(strength: number): GhostLevel {
  if (strength >= 0.85) return 3;
  if (strength >= 0.6) return 2;
  if (strength >= 0.3) return 1;
  return 0;
}

/** The weakest concept governs the line: scaffolding stays while anything is shaky. */
export function ghostLevelForConcepts(
  concepts: readonly string[],
  strengths: Record<string, number>,
): GhostLevel {
  if (concepts.length === 0) return 0;
  const weakest = Math.min(...concepts.map((id) => strengths[id] ?? 0));
  return ghostLevelFor(weakest);
}
