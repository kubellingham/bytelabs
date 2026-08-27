import { describe, expect, it } from 'vitest';

import {
  applyEvent,
  currentStrength,
  dueConcepts,
  ghostLevelFor,
  ghostLevelForConcepts,
  halfLifeFor,
  masteryTag,
  recordConcepts,
  skillSummaries,
} from '@/lib/mastery';
import { createLearnerState } from '@/lib/storage/types';

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date('2026-01-01T09:00:00.000Z');
const at = (days: number) => new Date(T0.getTime() + days * DAY);

describe('decay', () => {
  it('reports nothing for a concept never met', () => {
    expect(currentStrength(undefined, T0)).toBe(0);
  });

  it('halves strength after one half-life', () => {
    const mastery = applyEvent(undefined, 'success', T0);
    const halfLife = halfLifeFor(mastery.successes);
    const later = new Date(T0.getTime() + halfLife);
    expect(currentStrength(mastery, later)).toBeCloseTo(mastery.strengthAtLastSeen / 2, 5);
  });

  it('extends half-life with each success — the spacing effect', () => {
    expect(halfLifeFor(3)).toBeGreaterThan(halfLifeFor(1));
    expect(halfLifeFor(10)).toBeGreaterThan(halfLifeFor(3));
  });

  it('caps half-life so nothing is ever considered permanently learned', () => {
    expect(halfLifeFor(10_000)).toBe(halfLifeFor(100_000));
  });

  it('never reports a strength outside 0..1', () => {
    let mastery = applyEvent(undefined, 'success', T0);
    for (let i = 1; i <= 40; i += 1) mastery = applyEvent(mastery, 'success', at(i));
    expect(currentStrength(mastery, at(41))).toBeLessThanOrEqual(1);
    expect(currentStrength(mastery, at(41))).toBeGreaterThanOrEqual(0);
  });
});

describe('update', () => {
  it('approaches mastery asymptotically rather than linearly', () => {
    const first = applyEvent(undefined, 'success', T0);
    const second = applyEvent(first, 'success', T0);
    const third = applyEvent(second, 'success', T0);

    const gain1 = first.strengthAtLastSeen;
    const gain2 = second.strengthAtLastSeen - first.strengthAtLastSeen;
    const gain3 = third.strengthAtLastSeen - second.strengthAtLastSeen;

    expect(gain2).toBeLessThan(gain1);
    expect(gain3).toBeLessThan(gain2);
  });

  it('counts an exposure without counting it as a success', () => {
    const seen = applyEvent(undefined, 'exposure', T0);
    expect(seen.exposures).toBe(1);
    expect(seen.successes).toBe(0);
    expect(seen.strengthAtLastSeen).toBeGreaterThan(0);
  });

  it('does not let an exposure reduce existing strength', () => {
    const strong = applyEvent(applyEvent(undefined, 'success', T0), 'success', T0);
    const after = applyEvent(strong, 'exposure', T0);
    expect(after.strengthAtLastSeen).toBeCloseTo(strong.strengthAtLastSeen, 5);
  });

  it('records several concepts at once and leaves others untouched', () => {
    const state = recordConcepts(createLearnerState(T0), ['doctype', 'html-lang'], 'success', T0);
    expect(Object.keys(state.concepts).sort()).toEqual(['doctype', 'html-lang']);
    expect(state.concepts.doctype?.successes).toBe(1);
  });

  it('returns the same state when given no concepts', () => {
    const state = createLearnerState(T0);
    expect(recordConcepts(state, [], 'success', T0)).toBe(state);
  });
});

describe('ghost level', () => {
  it('fades as strength rises', () => {
    expect(ghostLevelFor(0)).toBe(0);
    expect(ghostLevelFor(0.4)).toBe(1);
    expect(ghostLevelFor(0.7)).toBe(2);
    expect(ghostLevelFor(0.95)).toBe(3);
  });

  it('keeps scaffolding while any concept on the line is shaky', () => {
    const strengths = { a: 0.95, b: 0.1 };
    expect(ghostLevelForConcepts(['a', 'b'], strengths)).toBe(0);
    expect(ghostLevelForConcepts(['a'], strengths)).toBe(3);
  });

  it('shows full scaffolding for an untagged line', () => {
    expect(ghostLevelForConcepts([], {})).toBe(0);
  });
});

describe('selection', () => {
  it('queues the weakest concepts first, and only ones already met', () => {
    let state = createLearnerState(T0);
    state = recordConcepts(state, ['doctype'], 'success', T0);
    state = recordConcepts(state, ['html-lang'], 'exposure', T0);

    const due = dueConcepts(state, at(6));
    const ids = due.map((d) => d.concept.id);

    expect(ids).toContain('html-lang');
    expect(ids).not.toContain('charset'); // never met — a warm-up is revision, not teaching
    expect(due[0]!.strength).toBeLessThanOrEqual(due[due.length - 1]!.strength);
  });

  it('leaves out concepts that are still strong', () => {
    let state = createLearnerState(T0);
    for (let i = 0; i < 6; i += 1) {
      state = recordConcepts(state, ['doctype'], 'success', at(i));
    }
    expect(dueConcepts(state, at(6)).map((d) => d.concept.id)).not.toContain('doctype');
  });

  it('distinguishes "not started" from "started and shaky" in a skill summary', () => {
    const state = recordConcepts(createLearnerState(T0), ['doctype'], 'success', T0);
    const document = skillSummaries(state, T0).find((s) => s.skillId === 'document');
    const grid = skillSummaries(state, T0).find((s) => s.skillId === 'grid');

    expect(document?.met).toBe(1);
    expect(document!.strength).toBeGreaterThan(0);
    expect(grid?.met).toBe(0);
    expect(masteryTag(grid!)).toBeNull();
  });

  it('awards mastery tags on both strength and coverage', () => {
    expect(masteryTag({ skillId: 'x', strength: 0.9, met: 8, total: 10 })).toBe('Builder');
    expect(masteryTag({ skillId: 'x', strength: 0.6, met: 5, total: 10 })).toBe('Practitioner');
    expect(masteryTag({ skillId: 'x', strength: 0.2, met: 1, total: 10 })).toBe('Beginner');
    // Strong but barely covered is not mastery of the skill.
    expect(masteryTag({ skillId: 'x', strength: 0.9, met: 1, total: 10 })).toBe('Beginner');
  });
});
