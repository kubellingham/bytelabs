import { recordConcepts } from '@/lib/mastery';
import type { LearnerState, WorkspaceFiles } from '@/lib/storage/types';

/** Local calendar date, not UTC — a streak should follow the learner's own day. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
  };
  return Math.round((parse(b) - parse(a)) / (24 * 60 * 60 * 1000));
}

/**
 * Marks today as active.
 *
 * A broken streak resets to 1 and nothing else happens — no lost-progress warning,
 * no offer to buy it back. The brief is explicit that this rewards the people who
 * keep showing up without punishing the ones who don't.
 */
export function touchStreak(state: LearnerState, now: Date = new Date()): LearnerState {
  const today = localDateKey(now);
  const last = state.streak.lastActiveDate;

  if (last === today) return state;

  const current = last !== null && daysBetween(last, today) === 1 ? state.streak.current + 1 : 1;

  return {
    ...state,
    streak: {
      current,
      longest: Math.max(current, state.streak.longest),
      lastActiveDate: today,
    },
    lastActiveAt: now.toISOString(),
  };
}

/** XP is reflection, never a gate. It shows where time has gone. */
export function awardXp(state: LearnerState, key: string, amount: number): LearnerState {
  if (amount <= 0) return state;
  return { ...state, xp: { ...state.xp, [key]: (state.xp[key] ?? 0) + amount } };
}

export function saveWorkspace(
  state: LearnerState,
  key: string,
  files: WorkspaceFiles,
): LearnerState {
  return { ...state, workspaces: { ...state.workspaces, [key]: files } };
}

export function advanceLesson(
  state: LearnerState,
  lessonId: string,
  stepIndex: number,
): LearnerState {
  const existing = state.lessons[lessonId];
  if (existing && existing.furthestStep >= stepIndex) return state;

  return {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        furthestStep: stepIndex,
        completedAt: existing?.completedAt ?? null,
        passes: existing?.passes ?? 0,
      },
    },
  };
}

export function completeLesson(
  state: LearnerState,
  lessonId: string,
  trackId: string,
  concepts: readonly string[],
  now: Date = new Date(),
): LearnerState {
  const existing = state.lessons[lessonId];
  const passes = (existing?.passes ?? 0) + 1;

  let next: LearnerState = {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        furthestStep: existing?.furthestStep ?? 0,
        completedAt: now.toISOString(),
        passes,
      },
    },
  };

  next = recordConcepts(next, concepts, 'success', now);
  next = touchStreak(next, now);
  // A repeat pass is worth less than the first, but never nothing — the brief
  // wants repetition to feel worth doing.
  next = awardXp(next, trackId, passes === 1 ? 40 : 15);

  return next;
}

/**
 * Records a requirement going green.
 *
 * Requirements are only ever added, never removed: a learner who satisfies a
 * requirement and then keeps editing has still demonstrated it, and watching a tick
 * disappear mid-edit would read as punishment.
 */
export function satisfyRequirement(
  state: LearnerState,
  scope: { kind: 'unit'; id: string } | { kind: 'scenario'; id: string; variantId: string },
  requirementId: string,
  concepts: readonly string[],
  now: Date = new Date(),
): LearnerState {
  let next = state;

  if (scope.kind === 'unit') {
    const unit = state.units[scope.id] ?? { graduatedAt: null, satisfiedRequirements: [] };
    if (unit.satisfiedRequirements.includes(requirementId)) return state;
    next = {
      ...state,
      units: {
        ...state.units,
        [scope.id]: {
          ...unit,
          satisfiedRequirements: [...unit.satisfiedRequirements, requirementId],
        },
      },
    };
  } else {
    const scenario = state.scenarios[scope.id] ?? {
      variantId: scope.variantId,
      satisfiedRequirements: [],
      completedAt: null,
      attempts: 0,
      mode: 'assisted' as const,
    };
    if (scenario.satisfiedRequirements.includes(requirementId)) return state;
    next = {
      ...state,
      scenarios: {
        ...state.scenarios,
        [scope.id]: {
          ...scenario,
          satisfiedRequirements: [...scenario.satisfiedRequirements, requirementId],
        },
      },
    };
  }

  next = recordConcepts(next, concepts, 'success', now);
  return touchStreak(next, now);
}

export function graduateUnit(
  state: LearnerState,
  unitId: string,
  trackId: string,
  now: Date = new Date(),
): LearnerState {
  const unit = state.units[unitId] ?? { graduatedAt: null, satisfiedRequirements: [] };
  if (unit.graduatedAt) return state;

  const next: LearnerState = {
    ...state,
    units: { ...state.units, [unitId]: { ...unit, graduatedAt: now.toISOString() } },
  };

  return awardXp(touchStreak(next, now), trackId, 250);
}

export function isUnitGraduated(state: LearnerState, unitId: string): boolean {
  return state.units[unitId]?.graduatedAt !== null && state.units[unitId] !== undefined;
}
