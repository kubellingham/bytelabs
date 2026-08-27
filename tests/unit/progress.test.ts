import { describe, expect, it } from 'vitest';

import {
  awardXp,
  completeLesson,
  graduateUnit,
  isUnitGraduated,
  localDateKey,
  satisfyRequirement,
  touchStreak,
} from '@/lib/progress';
import { dailyScenario, weekKey, weeklyScenario } from '@/lib/schedule';
import { GROUND_SCENARIOS } from '@/content';
import { createLearnerState } from '@/lib/storage/types';
import { LocalProgressStore, MemoryProgressStore } from '@/lib/storage/local';
import { hasScope, isActive, LOCAL_ENTITLEMENT_STATE } from '@/lib/entitlement/types';

const T0 = new Date('2026-03-02T10:00:00');
const day = (offset: number) => new Date(T0.getTime() + offset * 24 * 60 * 60 * 1000);

describe('streak', () => {
  it('starts at one on the first active day', () => {
    const state = touchStreak(createLearnerState(T0), T0);
    expect(state.streak.current).toBe(1);
    expect(state.streak.lastActiveDate).toBe(localDateKey(T0));
  });

  it('does not double-count a second visit on the same day', () => {
    const once = touchStreak(createLearnerState(T0), T0);
    const twice = touchStreak(once, new Date(T0.getTime() + 60_000));
    expect(twice).toBe(once);
  });

  it('extends across consecutive days', () => {
    let state = createLearnerState(T0);
    for (let i = 0; i < 4; i += 1) state = touchStreak(state, day(i));
    expect(state.streak.current).toBe(4);
    expect(state.streak.longest).toBe(4);
  });

  it('resets quietly after a gap, keeping the longest run as a record', () => {
    let state = createLearnerState(T0);
    for (let i = 0; i < 5; i += 1) state = touchStreak(state, day(i));
    state = touchStreak(state, day(9));

    expect(state.streak.current).toBe(1);
    // Nothing is lost and nothing is offered to buy it back.
    expect(state.streak.longest).toBe(5);
  });
});

describe('lessons and units', () => {
  it('awards less for a repeat pass but never nothing', () => {
    const first = completeLesson(createLearnerState(T0), 'l1', 'html-css', ['doctype'], T0);
    const second = completeLesson(first, 'l1', 'html-css', ['doctype'], day(1));

    const firstXp = first.xp['html-css'] ?? 0;
    const gain = (second.xp['html-css'] ?? 0) - firstXp;

    expect(firstXp).toBeGreaterThan(0);
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThan(firstXp);
    expect(second.lessons.l1?.passes).toBe(2);
  });

  it('records mastery for the lesson’s concepts on completion', () => {
    const state = completeLesson(createLearnerState(T0), 'l1', 'html-css', ['doctype'], T0);
    expect(state.concepts.doctype?.successes).toBe(1);
  });

  it('never un-satisfies a requirement once it has been met', () => {
    let state = createLearnerState(T0);
    state = satisfyRequirement(state, { kind: 'unit', id: 'u1' }, 'r1', ['doctype'], T0);
    const after = satisfyRequirement(state, { kind: 'unit', id: 'u1' }, 'r1', ['doctype'], T0);

    // Banking is idempotent: editing on and breaking a requirement must not
    // make a tick disappear, which would read as punishment.
    expect(after).toBe(state);
    expect(state.units.u1?.satisfiedRequirements).toEqual(['r1']);
  });

  it('gates a unit on the previous one having been graduated', () => {
    const state = createLearnerState(T0);
    expect(isUnitGraduated(state, 'htmlcss-u1')).toBe(false);

    const graduated = graduateUnit(state, 'htmlcss-u1', 'html-css', T0);
    expect(isUnitGraduated(graduated, 'htmlcss-u1')).toBe(true);
    expect(isUnitGraduated(graduated, 'htmlcss-u2')).toBe(false);
  });

  it('does not re-award a unit that is already graduated', () => {
    const once = graduateUnit(createLearnerState(T0), 'u1', 'html-css', T0);
    expect(graduateUnit(once, 'u1', 'html-css', day(1))).toBe(once);
  });

  it('ignores a non-positive XP award', () => {
    const state = createLearnerState(T0);
    expect(awardXp(state, 'html-css', 0)).toBe(state);
  });
});

describe('scheduling', () => {
  it('gives everyone the same scenario on the same day', () => {
    const a = dailyScenario(GROUND_SCENARIOS, new Date('2026-03-02T08:00:00'));
    const b = dailyScenario(GROUND_SCENARIOS, new Date('2026-03-02T21:30:00'));
    expect(a?.id).toBe(b?.id);
  });

  it('moves on to a different day’s pick', () => {
    const picks = new Set(
      Array.from({ length: 14 }, (_, i) => dailyScenario(GROUND_SCENARIOS, day(i))?.id),
    );
    // With a small library the same one recurs, but it must not be frozen.
    expect(picks.size).toBeGreaterThan(1);
  });

  it('keeps the daily small and the weekly substantial', () => {
    expect(dailyScenario(GROUND_SCENARIOS, T0)?.tier).not.toBe('elite');
    expect(weeklyScenario(GROUND_SCENARIOS, T0)?.tier).not.toBe('beginner');
  });

  it('holds a weekly pick steady across its week and changes between weeks', () => {
    const monday = new Date('2026-03-02T09:00:00');
    const friday = new Date('2026-03-06T09:00:00');
    const nextMonday = new Date('2026-03-09T09:00:00');

    expect(weekKey(monday)).toBe(weekKey(friday));
    expect(weekKey(monday)).not.toBe(weekKey(nextMonday));
    expect(weeklyScenario(GROUND_SCENARIOS, monday)?.id).toBe(
      weeklyScenario(GROUND_SCENARIOS, friday)?.id,
    );
  });

  it('returns nothing rather than throwing on an empty library', () => {
    expect(dailyScenario([], T0)).toBeNull();
    expect(weeklyScenario([], T0)).toBeNull();
  });
});

describe('storage', () => {
  it('notifies subscribers only when the state actually changed', () => {
    const store = new MemoryProgressStore();
    let notified = 0;
    store.subscribe(() => (notified += 1));

    store.update((state) => state);
    expect(notified).toBe(0);

    store.update((state) => ({ ...state, xp: { 'html-css': 10 } }));
    expect(notified).toBe(1);
    expect(store.getSnapshot().xp['html-css']).toBe(10);
  });

  it('survives corrupt stored data instead of throwing away a learner’s history', () => {
    const backing = new Map<string, string>([['k', '{not json']]);
    const storage = {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => void backing.set(key, value),
      removeItem: (key: string) => void backing.delete(key),
      clear: () => backing.clear(),
      key: () => null,
      length: 0,
    } as unknown as Storage;

    const store = new LocalProgressStore(storage, 'k', 0);
    expect(store.getSnapshot().concepts).toEqual({});
  });

  it('fills in missing fields from a partial stored record', () => {
    const backing = new Map<string, string>([
      ['k', JSON.stringify({ version: 1, xp: { 'html-css': 5 } })],
    ]);
    const storage = {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => void backing.set(key, value),
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as unknown as Storage;

    const snapshot = new LocalProgressStore(storage, 'k', 0).getSnapshot();
    expect(snapshot.xp['html-css']).toBe(5);
    expect(snapshot.streak.current).toBe(0);
    expect(snapshot.concepts).toEqual({});
  });
});

describe('entitlement', () => {
  it('treats a null expiry as open-ended', () => {
    expect(isActive({ provider: 'bytelabs', scopes: ['course'], activeUntil: null })).toBe(true);
  });

  it('expires an entitlement once its date has passed', () => {
    const entitlement = {
      provider: 'bytelabs' as const,
      scopes: ['course' as const],
      activeUntil: '2026-01-01T00:00:00.000Z',
    };
    expect(isActive(entitlement, new Date('2025-12-01'))).toBe(true);
    expect(isActive(entitlement, new Date('2026-02-01'))).toBe(false);
  });

  it('grants a scope from any active provider, so a Kube bundle works unchanged', () => {
    const state = {
      entitlements: [
        { provider: 'bytelabs' as const, scopes: ['course' as const], activeUntil: '2020-01-01T00:00:00.000Z' },
        { provider: 'studying-kube' as const, scopes: ['course' as const, 'ground' as const], activeUntil: null },
      ],
    };
    expect(hasScope(state, 'course')).toBe(true);
    expect(hasScope(state, 'ground')).toBe(true);
    expect(hasScope(state, 'assist')).toBe(false);
  });

  it('opens everything in this build, which has no billing', () => {
    expect(hasScope(LOCAL_ENTITLEMENT_STATE, 'course')).toBe(true);
    expect(hasScope(LOCAL_ENTITLEMENT_STATE, 'assist')).toBe(true);
  });
});
