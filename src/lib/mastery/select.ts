import { CONCEPTS, getConcept, type Concept } from '@/content/concepts';
import type { LearnerState } from '@/lib/storage/types';

import { currentStrength } from './decay';

/** Below this, a concept is worth re-drilling. Above it, leave the learner alone. */
export const WARMUP_THRESHOLD = 0.55;

export interface DueConcept {
  concept: Concept;
  strength: number;
  lastSeenAt: string;
}

/**
 * What the learner is closest to forgetting.
 *
 * Only concepts they have actually met are eligible — a warm-up is revision, never
 * a way to introduce something new. Weakest first, so a short session spends its
 * time where it is worth most.
 */
export function dueConcepts(
  state: LearnerState,
  now: Date = new Date(),
  threshold = WARMUP_THRESHOLD,
): DueConcept[] {
  const due: DueConcept[] = [];

  for (const [id, mastery] of Object.entries(state.concepts)) {
    const concept = getConcept(id);
    if (!concept) continue;

    const strength = currentStrength(mastery, now);
    if (strength >= threshold) continue;

    due.push({ concept, strength, lastSeenAt: mastery.lastSeenAt });
  }

  return due.sort((a, b) => a.strength - b.strength);
}

export interface SkillSummary {
  skillId: string;
  /** Mean strength across the concepts in this skill that the learner has met. */
  strength: number;
  met: number;
  total: number;
}

/**
 * Per-skill picture for the skill map. Concepts never met are counted in `total`
 * but excluded from `strength`, so "you have not started this" is distinguishable
 * from "you have started it and it is shaky".
 */
export function skillSummaries(
  state: LearnerState,
  now: Date = new Date(),
): SkillSummary[] {
  const buckets = new Map<string, { sum: number; met: number; total: number }>();

  for (const concept of CONCEPTS) {
    const bucket = buckets.get(concept.skillId) ?? { sum: 0, met: 0, total: 0 };
    bucket.total += 1;

    const mastery = state.concepts[concept.id];
    if (mastery) {
      bucket.sum += currentStrength(mastery, now);
      bucket.met += 1;
    }
    buckets.set(concept.skillId, bucket);
  }

  return [...buckets.entries()].map(([skillId, bucket]) => ({
    skillId,
    strength: bucket.met === 0 ? 0 : bucket.sum / bucket.met,
    met: bucket.met,
    total: bucket.total,
  }));
}

/**
 * Cosmetic only, per the product brief — a mastery tag never gates anything and is
 * never compared against another learner.
 */
export type MasteryTag = 'Beginner' | 'Practitioner' | 'Builder';

export function masteryTag(summary: SkillSummary): MasteryTag | null {
  if (summary.met === 0) return null;
  const coverage = summary.met / summary.total;
  if (summary.strength >= 0.75 && coverage >= 0.7) return 'Builder';
  if (summary.strength >= 0.5 && coverage >= 0.35) return 'Practitioner';
  return 'Beginner';
}
