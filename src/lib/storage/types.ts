export type ConceptId = string;
export type LessonId = string;
export type UnitId = string;
export type TrackId = string;
export type ScenarioId = string;
export type SkillId = string;

/** A learner's files for one lesson or scenario. Path -> contents. */
export type WorkspaceFiles = Record<string, string>;

export interface ConceptMastery {
  /** How many times the learner has met this concept in any surface. */
  exposures: number;
  /** How many of those went well — a matched practice line, a satisfied requirement. */
  successes: number;
  /** ISO timestamp of the most recent encounter. */
  lastSeenAt: string;
  /**
   * Retention at `lastSeenAt`, 0-1. Read through `currentStrength()` rather than
   * directly: this value does not include decay since that timestamp.
   */
  strengthAtLastSeen: number;
}

export interface LessonProgress {
  /** Highest step index the learner has reached. */
  furthestStep: number;
  completedAt: string | null;
  /** How many times the whole lesson has been worked through. */
  passes: number;
}

export interface UnitProgress {
  /** Set when the unit's graduation scenario had every requirement satisfied. */
  graduatedAt: string | null;
  /** Requirement ids satisfied so far, so partial progress survives a reload. */
  satisfiedRequirements: string[];
}

export interface ScenarioProgress {
  /** Which parameterised variant this learner was given. Stable once assigned. */
  variantId: string;
  satisfiedRequirements: string[];
  completedAt: string | null;
  attempts: number;
  mode: 'assisted' | 'raw';
}

export interface StreakState {
  /** Local calendar dates (YYYY-MM-DD) the learner did something on. */
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface WarmupState {
  lastSessionAt: string | null;
  sessionsCompleted: number;
}

export interface LearnerState {
  version: number;
  createdAt: string;
  lastActiveAt: string;
  lessons: Record<LessonId, LessonProgress>;
  units: Record<UnitId, UnitProgress>;
  concepts: Record<ConceptId, ConceptMastery>;
  scenarios: Record<ScenarioId, ScenarioProgress>;
  /** Keyed by `lesson:<id>` or `scenario:<id>`. The substrate a portfolio reads. */
  workspaces: Record<string, WorkspaceFiles>;
  /** Keyed by track id and by skill id. Reflection only — never gates anything. */
  xp: Record<string, number>;
  streak: StreakState;
  warmup: WarmupState;
  /** Keyed by `daily:<YYYY-MM-DD>` / `weekly:<YYYY-Www>`. */
  scheduled: Record<string, { scenarioId: ScenarioId; completedAt: string | null }>;
}

export const STATE_VERSION = 1;

export function createLearnerState(now: Date = new Date()): LearnerState {
  const iso = now.toISOString();
  return {
    version: STATE_VERSION,
    createdAt: iso,
    lastActiveAt: iso,
    lessons: {},
    units: {},
    concepts: {},
    scenarios: {},
    workspaces: {},
    xp: {},
    streak: { current: 0, longest: 0, lastActiveDate: null },
    warmup: { lastSessionAt: null, sessionsCompleted: 0 },
    scheduled: {},
  };
}

/**
 * Synchronous and snapshot-based so it plugs straight into `useSyncExternalStore`.
 *
 * A remote adapter (Supabase, or Studying Kube's account service) implements the
 * same surface and syncs write-behind — the UI never learns the difference, which
 * is the whole point of the interface existing this early.
 */
export interface ProgressStore {
  getSnapshot(): LearnerState;
  subscribe(listener: () => void): () => void;
  /** Applies a pure update. Returning the same reference skips the notify. */
  update(recipe: (state: LearnerState) => LearnerState): void;
  reset(): void;
}
