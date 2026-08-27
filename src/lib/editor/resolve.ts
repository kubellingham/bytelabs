/**
 * The line resolve state machine.
 *
 * The learner types freely — nothing is ever rejected, and no keystroke is wrong.
 * Each line simply moves from faint ghost to solid as it comes to match the target,
 * which is what makes the mechanic feel like the code resolving rather than a test
 * marking you.
 *
 * `diverged` exists so the UI can stop showing a misleading inline remainder. It is
 * rendered exactly like ordinary text — never red, never flagged.
 */

export type LineState = 'matched' | 'partial' | 'diverged' | 'untouched';

export interface LineResolution {
  state: LineState;
  /** For `partial`: the rest of the target line, shown faintly after the cursor. */
  remainder: string;
}

export interface Resolution {
  lines: LineResolution[];
  /** Target lines the learner has not reached yet, shown faintly below their work. */
  pending: string[];
  matchedCount: number;
  /** Target lines that carry any content — the denominator for progress. */
  meaningfulTarget: number;
}

/**
 * Indentation is taught, not enforced. A line whose content is right but whose
 * indentation is not still counts as matched: the ghost above it shows the correct
 * shape, which teaches without the frustration of a line that will not resolve.
 */
function isMatch(learner: string, target: string): boolean {
  if (learner.trimEnd() === target.trimEnd()) return true;
  const a = learner.trim();
  const b = target.trim();
  return a.length > 0 && a === b;
}

export function resolveLines(learnerText: string, targetText: string): Resolution {
  const learnerLines = learnerText.split('\n');
  const targetLines = targetText.split('\n');

  const lines: LineResolution[] = [];
  let matchedCount = 0;

  for (let i = 0; i < learnerLines.length; i += 1) {
    const learner = learnerLines[i] ?? '';
    const target = targetLines[i];

    if (target === undefined) {
      // Past the end of the target — the learner has gone their own way, which is
      // allowed. Nothing to ghost here.
      lines.push({ state: 'diverged', remainder: '' });
      continue;
    }

    if (isMatch(learner, target)) {
      lines.push({ state: 'matched', remainder: '' });
      if (target.trim().length > 0) matchedCount += 1;
      continue;
    }

    if (learner.length === 0) {
      lines.push({ state: 'untouched', remainder: target });
      continue;
    }

    if (target.startsWith(learner)) {
      lines.push({ state: 'partial', remainder: target.slice(learner.length) });
      continue;
    }

    lines.push({ state: 'diverged', remainder: '' });
  }

  const pending = targetLines.slice(learnerLines.length);
  const meaningfulTarget = targetLines.filter((line) => line.trim().length > 0).length;

  return { lines, pending, matchedCount, meaningfulTarget };
}

/** 0-1, for progress display. Blank target lines are not worth credit. */
export function completionRatio(resolution: Resolution): number {
  if (resolution.meaningfulTarget === 0) return 1;
  return Math.min(1, resolution.matchedCount / resolution.meaningfulTarget);
}

/**
 * Concepts credited by the lines that have just resolved. Compared against the
 * previous resolution so a concept is banked once, when its line first lands,
 * rather than on every keystroke afterwards.
 */
export function newlyMatchedConcepts(
  previous: Resolution | null,
  next: Resolution,
  lineConcepts: readonly string[][],
): string[] {
  const credited = new Set<string>();

  next.lines.forEach((line, index) => {
    if (line.state !== 'matched') return;
    if (previous?.lines[index]?.state === 'matched') return;
    for (const concept of lineConcepts[index] ?? []) credited.add(concept);
  });

  return [...credited];
}
