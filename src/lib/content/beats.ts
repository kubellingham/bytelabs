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
  /**
   * Concepts owed to each line of each resulting file, derived from which beat
   * wrote it. Ghost opacity is per-line, so the mastery engine needs the tags at
   * line granularity — a lesson-level tag could never fade flexbox before grid.
   */
  lineConcepts: Record<string, string[][]>;
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
 * Per-character record of which beat wrote it, spliced in step with the text so
 * later edits shift ownership exactly as they shift content.
 */
type Ownership = Record<string, (string | null)[]>;

function applyOwnership(ownership: Ownership, edit: PlannedEdit, beatId: string): void {
  const current = ownership[edit.file] ?? [];
  const inserted: (string | null)[] = new Array<string | null>(edit.text.length).fill(beatId);
  current.splice(edit.offset, edit.removedLength, ...inserted);
  ownership[edit.file] = current;
}

/** Collapses per-character ownership into the concepts owed to each line. */
function lineConceptsFrom(
  files: WorkspaceFiles,
  ownership: Ownership,
  conceptsByBeat: Map<string, string[]>,
): Record<string, string[][]> {
  const out: Record<string, string[][]> = {};

  for (const [file, contents] of Object.entries(files)) {
    const owners = ownership[file] ?? [];
    const lines: string[][] = [];
    let offset = 0;

    for (const line of contents.split('\n')) {
      const seen = new Set<string>();
      for (let i = 0; i < line.length; i += 1) {
        const beatId = owners[offset + i];
        if (!beatId) continue;
        for (const concept of conceptsByBeat.get(beatId) ?? []) seen.add(concept);
      }
      lines.push([...seen]);
      offset += line.length + 1; // + the newline
    }

    out[file] = lines;
  }

  return out;
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
  const ownership: Ownership = {};
  const conceptsByBeat = new Map<string, string[]>();

  for (const [file, contents] of Object.entries(startFiles)) {
    // Starter content belongs to no beat, so it carries no concepts of its own.
    ownership[file] = new Array<string | null>(contents.length).fill(null);
  }

  for (const beat of beats) {
    conceptsByBeat.set(beat.id, beat.concepts);
    const edits: PlannedEdit[] = [];

    for (const edit of beat.edits) {
      const resolved = resolveEdit(beat.id, files, edit);
      edits.push(resolved);
      if (!ownership[resolved.file]) {
        ownership[resolved.file] = new Array<string | null>(
          (files[resolved.file] ?? '').length,
        ).fill(null);
      }
      applyOwnership(ownership, resolved, beat.id);
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

  return {
    beats: planned,
    result: files,
    lineConcepts: lineConceptsFrom(files, ownership, conceptsByBeat),
  };
}

/** Total characters typed across a plan — used to estimate a demo's running time. */
export function plannedCharacterCount(plan: BeatPlan): number {
  return plan.beats.reduce(
    (total, beat) => total + beat.edits.reduce((sum, edit) => sum + edit.text.length, 0),
    0,
  );
}
