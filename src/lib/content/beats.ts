import type { Beat, Edit, WorkspaceFiles } from './schema';

export class BeatAnchorError extends Error {
  constructor(
    readonly beatId: string,
    readonly file: string,
    readonly anchor: string,
    readonly mode: 'after' | 'replace',
  ) {
    super(
      `Beat "${beatId}" could not ${mode} anchor ${JSON.stringify(anchor)} in "${file}".`,
    );
    this.name = 'BeatAnchorError';
  }
}

/** An edit with its anchor resolved to a concrete offset in the file at that moment. */
export interface PlannedEdit {
  file: string;
  /** Character offset at which typing begins. */
  offset: number;
  /** The characters that get typed, one at a time. */
  text: string;
  /** Characters removed at `offset` first — non-zero only for `replace` edits. */
  removedLength: number;
}

export interface PlannedBeat {
  id: string;
  note: string;
  concepts: string[];
  edits: PlannedEdit[];
  charMs?: number | undefined;
  holdMs?: number | undefined;
}

export interface BeatPlan {
  beats: PlannedBeat[];
  /** Files as they stand once every beat has played. This becomes the ghost. */
  result: WorkspaceFiles;
}

function resolveEdit(beatId: string, files: WorkspaceFiles, edit: Edit): PlannedEdit {
  const current = files[edit.file] ?? '';

  if (edit.replace !== undefined) {
    const offset = current.indexOf(edit.replace);
    if (offset === -1) throw new BeatAnchorError(beatId, edit.file, edit.replace, 'replace');
    return { file: edit.file, offset, text: edit.text, removedLength: edit.replace.length };
  }

  if (edit.after !== undefined) {
    const found = current.indexOf(edit.after);
    if (found === -1) throw new BeatAnchorError(beatId, edit.file, edit.after, 'after');
    return {
      file: edit.file,
      offset: found + edit.after.length,
      text: edit.text,
      removedLength: 0,
    };
  }

  return { file: edit.file, offset: current.length, text: edit.text, removedLength: 0 };
}

function applyPlanned(files: WorkspaceFiles, edit: PlannedEdit): WorkspaceFiles {
  const current = files[edit.file] ?? '';
  const next =
    current.slice(0, edit.offset) +
    edit.text +
    current.slice(edit.offset + edit.removedLength);
  return { ...files, [edit.file]: next };
}

/**
 * Resolves every beat's anchors against the file state at the moment that beat
 * plays, and reports the final files.
 *
 * The player replays the plan character by character; the content test runs the
 * same function to prove a lesson's beats actually produce the code it claims to
 * teach. A stale anchor therefore fails CI rather than quietly teaching the wrong
 * thing.
 */
export function planBeats(startFiles: WorkspaceFiles, beats: readonly Beat[]): BeatPlan {
  let files: WorkspaceFiles = { ...startFiles };
  const planned: PlannedBeat[] = [];

  for (const beat of beats) {
    const edits: PlannedEdit[] = [];
    for (const edit of beat.edits) {
      const resolved = resolveEdit(beat.id, files, edit);
      edits.push(resolved);
      files = applyPlanned(files, resolved);
    }
    planned.push({
      id: beat.id,
      note: beat.note,
      concepts: beat.concepts,
      edits,
      charMs: beat.charMs,
      holdMs: beat.holdMs,
    });
  }

  return { beats: planned, result: files };
}

/** Total characters typed across a plan — used to estimate a demo's running time. */
export function plannedCharacterCount(plan: BeatPlan): number {
  return plan.beats.reduce(
    (total, beat) => total + beat.edits.reduce((sum, edit) => sum + edit.text.length, 0),
    0,
  );
}
