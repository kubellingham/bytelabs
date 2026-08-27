/**
 * The ambient assistant.
 *
 * Behaviour is per-zone, following the product brief: a brief whisper in the
 * Course, fuller support in the Ground's assisted mode, and silence in raw mode
 * until it is actually asked something. It never volunteers, never interrupts, and
 * never appears anywhere the learner did not open it.
 */

export const ASSIST_ZONES = ['course', 'ground-assisted', 'ground-raw'] as const;
export type AssistZone = (typeof ASSIST_ZONES)[number];

export interface AssistContext {
  zone: AssistZone;
  /** What the learner is working on, so the answer is about their actual screen. */
  title?: string;
  /** The concept the current step is teaching, when there is one. */
  concept?: string;
  /** The learner's current files. Trimmed server-side before sending. */
  files?: Record<string, string>;
}

export type AssistErrorReason = 'not-configured' | 'rate-limited' | 'failed';

export interface AssistErrorBody {
  error: AssistErrorReason;
  message: string;
}

export function isAssistZone(value: unknown): value is AssistZone {
  return typeof value === 'string' && (ASSIST_ZONES as readonly string[]).includes(value);
}
