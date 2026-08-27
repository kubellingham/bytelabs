import type { Annotation, WorkspaceFiles } from './schema';

/**
 * Resolving annotations to positions.
 *
 * Positions are found by searching the document on screen, never stored as
 * offsets. That is deliberate: the learner's own document is a different string
 * from the demo's, but the moment they type `href="styles.css"` the annotation for
 * it locates itself in *their* file too. One definition, working in both places,
 * and nothing to keep in sync.
 *
 * An unresolved annotation is normal rather than exceptional — the fragment simply
 * has not been typed yet — so this reports it instead of throwing.
 */

export interface ResolvedAnnotation {
  annotation: Annotation;
  file: string;
  /** Character offsets within that file. */
  from: number;
  to: number;
}

/** Finds the nth occurrence of `needle`, 1-based. -1 when there are fewer. */
export function nthIndexOf(haystack: string, needle: string, occurrence: number): number {
  let index = -1;
  for (let i = 0; i < occurrence; i += 1) {
    index = haystack.indexOf(needle, index + 1);
    if (index === -1) return -1;
  }
  return index;
}

export function resolveAnnotation(
  annotation: Annotation,
  files: WorkspaceFiles,
  defaultFile: string,
): ResolvedAnnotation | null {
  const file = annotation.file ?? defaultFile;
  const contents = files[file];
  if (contents === undefined) return null;

  const from = nthIndexOf(contents, annotation.find, annotation.occurrence);
  if (from === -1) return null;

  return { annotation, file, from, to: from + annotation.find.length };
}

/**
 * Resolves a list in order, keeping only the ones currently present.
 *
 * Order is preserved so the breakdown reads the way it was authored — left to
 * right through the line, rather than jumping about.
 */
export function resolveAnnotations(
  annotations: readonly Annotation[],
  files: WorkspaceFiles,
  defaultFile: string,
): ResolvedAnnotation[] {
  const resolved: ResolvedAnnotation[] = [];
  for (const annotation of annotations) {
    const found = resolveAnnotation(annotation, files, defaultFile);
    if (found) resolved.push(found);
  }
  return resolved;
}

/** The file a beat writes to first, used when an annotation does not name one. */
export function defaultFileForBeat(edits: readonly { file: string }[]): string {
  return edits[0]?.file ?? 'index.html';
}

/**
 * Every annotation in a demo, flattened in beat order.
 *
 * The breakdown runs over the whole demo once the typing has finished, so a
 * learner sees the code appear as a piece of work and *then* takes it apart —
 * which is the order a person explaining something at a whiteboard would use.
 */
export function annotationsForBeats(
  beats: readonly { annotations: readonly Annotation[]; edits: readonly { file: string }[] }[],
): { annotation: Annotation; defaultFile: string }[] {
  return beats.flatMap((beat) =>
    beat.annotations.map((annotation) => ({
      annotation,
      defaultFile: defaultFileForBeat(beat.edits),
    })),
  );
}

/** The annotation whose range contains an offset, for click-to-recall. */
export function annotationAt(
  resolved: readonly ResolvedAnnotation[],
  file: string,
  offset: number,
): ResolvedAnnotation | null {
  // Last match wins, so a nested fragment beats the larger one containing it —
  // clicking `href` should explain href, not the whole tag.
  let best: ResolvedAnnotation | null = null;
  for (const entry of resolved) {
    if (entry.file !== file) continue;
    if (offset < entry.from || offset > entry.to) continue;
    if (!best || entry.to - entry.from <= best.to - best.from) best = entry;
  }
  return best;
}
