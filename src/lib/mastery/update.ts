import type { ConceptMastery, LearnerState } from '@/lib/storage/types';

import { currentStrength } from './decay';

/**
 * How much of the remaining gap to 1 a success closes. Asymptotic rather than
 * linear: early reps move the needle a lot, later ones consolidate.
 */
export const LEARNING_RATE = 0.42;

/** Meeting a concept without demonstrating it still counts for something. */
export const EXPOSURE_FLOOR = 0.15;

export type MasteryEvent = 'success' | 'exposure';

export function applyEvent(
  mastery: ConceptMastery | undefined,
  event: MasteryEvent,
  now: Date = new Date(),
): ConceptMastery {
  const strength = currentStrength(mastery, now);

  const next =
    event === 'success'
      ? strength + (1 - strength) * LEARNING_RATE
      : Math.max(strength, EXPOSURE_FLOOR);

  return {
    exposures: (mastery?.exposures ?? 0) + 1,
    successes: (mastery?.successes ?? 0) + (event === 'success' ? 1 : 0),
    lastSeenAt: now.toISOString(),
    strengthAtLastSeen: Math.min(1, Math.max(0, next)),
  };
}

/**
 * Records an event against several concepts at once.
 *
 * Every surface funnels through here — a resolved practice line, a satisfied
 * requirement, a warm-up answer — which is what keeps ghost fade, the warm-up queue
 * and the skill map reading the same numbers instead of three drifting estimates.
 */
export function recordConcepts(
  state: LearnerState,
  concepts: readonly string[],
  event: MasteryEvent,
  now: Date = new Date(),
): LearnerState {
  if (concepts.length === 0) return state;

  const concepts_ = { ...state.concepts };
  for (const id of concepts) {
    concepts_[id] = applyEvent(concepts_[id], event, now);
  }

  return { ...state, concepts: concepts_, lastActiveAt: now.toISOString() };
}

/** Current strength for every concept the learner has met. */
export function strengthMap(
  state: LearnerState,
  now: Date = new Date(),
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, mastery] of Object.entries(state.concepts)) {
    out[id] = currentStrength(mastery, now);
  }
  return out;
}
