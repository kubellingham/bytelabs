import type { Scenario } from '@/lib/content/schema';
import { localDateKey } from '@/lib/progress';

/**
 * Scheduled scenarios.
 *
 * The daily challenge and the weekly brief are ordinary scenarios chosen
 * deterministically from the date, so everyone gets the same one on the same day
 * without a server deciding it — and the same learner reloading gets the same
 * thing rather than rerolling for something easier.
 */

function hash(input: string): number {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

export function dayKey(date: Date = new Date()): string {
  return localDateKey(date);
}

/** ISO-8601 week, so a "week" starts on Monday rather than wherever the year did. */
export function weekKey(date: Date = new Date()): string {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (target.getDay() + 6) % 7; // Monday = 0
  target.setDate(target.getDate() - day + 3); // the Thursday of this week
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000) -
        ((firstThursday.getDay() + 6) % 7) / 7,
    );
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function pick<T>(items: readonly T[], key: string): T | null {
  if (items.length === 0) return null;
  return items[hash(key) % items.length] ?? null;
}

/** Small enough to fit in a day that was not going to include studying. */
export function dailyScenario(
  scenarios: readonly Scenario[],
  date: Date = new Date(),
): Scenario | null {
  const eligible = scenarios.filter((s) => s.tier !== 'elite');
  return pick(eligible.length > 0 ? eligible : scenarios, `daily:${dayKey(date)}`);
}

/** A bigger piece of work, for someone with a free afternoon. */
export function weeklyScenario(
  scenarios: readonly Scenario[],
  date: Date = new Date(),
): Scenario | null {
  const eligible = scenarios.filter((s) => s.tier !== 'beginner');
  return pick(eligible.length > 0 ? eligible : scenarios, `weekly:${weekKey(date)}`);
}
