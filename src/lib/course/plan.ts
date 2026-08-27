import { planBeats, type BeatPlan } from '@/lib/content/beats';
import type { Lesson, WorkspaceFiles } from '@/lib/content/schema';

/**
 * Resolves a lesson into what each step needs at runtime.
 *
 * Steps are planned in sequence rather than independently, so a lesson with more
 * than one demo builds on itself: the second demo starts where the first finished,
 * and a practice step resets only the files it practises, back to the state
 * immediately before the demo that produced them.
 */

export type PlannedStep =
  | { kind: 'explain'; files: WorkspaceFiles }
  | { kind: 'demo'; plan: BeatPlan; from: WorkspaceFiles; to: WorkspaceFiles }
  | {
      kind: 'practice';
      /** What the editor starts from — the practised files wound back. */
      from: WorkspaceFiles;
      /** What the ghost shows. */
      target: WorkspaceFiles;
      lineConcepts: Record<string, string[][]>;
    }
  | { kind: 'check'; files: WorkspaceFiles };

export function planLesson(lesson: Lesson): PlannedStep[] {
  let files: WorkspaceFiles = { ...lesson.startFiles };
  let beforeLastDemo: WorkspaceFiles = { ...lesson.startFiles };
  let lineConcepts: Record<string, string[][]> = {};

  return lesson.steps.map((step): PlannedStep => {
    switch (step.kind) {
      case 'demo': {
        beforeLastDemo = { ...files };
        const plan = planBeats(files, step.beats);
        const from = { ...files };
        files = plan.result;
        lineConcepts = plan.lineConcepts;
        return { kind: 'demo', plan, from, to: plan.result };
      }

      case 'practice': {
        const from: WorkspaceFiles = { ...files };
        for (const path of step.files) {
          from[path] = beforeLastDemo[path] ?? '';
        }
        return { kind: 'practice', from, target: { ...files }, lineConcepts };
      }

      case 'explain':
        return { kind: 'explain', files: { ...files } };

      case 'check':
        return { kind: 'check', files: { ...files } };
    }
  });
}
