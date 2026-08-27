import type { CheckItem, CheckOutcome } from './checker';

export const RUNNER_ORIGIN = '*';

/** Parent -> sandbox. */
export interface EvaluateMessage {
  source: 'bytelabs';
  type: 'evaluate';
  runId: number;
  items: CheckItem[];
}

/** Sandbox -> parent. */
export interface ResultsMessage {
  source: 'bytelabs-sandbox';
  type: 'results';
  runId: number;
  outcomes: CheckOutcome[];
}

export interface ReadyMessage {
  source: 'bytelabs-sandbox';
  type: 'ready';
}

/** A runtime error from the learner's own script. Surfaced, never swallowed. */
export interface ErrorMessage {
  source: 'bytelabs-sandbox';
  type: 'error';
  message: string;
  line?: number;
}

export type SandboxMessage = ResultsMessage | ReadyMessage | ErrorMessage;

export function isSandboxMessage(data: unknown): data is SandboxMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { source?: unknown }).source === 'bytelabs-sandbox'
  );
}
