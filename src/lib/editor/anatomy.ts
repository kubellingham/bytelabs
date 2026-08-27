import { StateEffect, StateField, type EditorState, type Extension } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';

/**
 * The breakdown layer.
 *
 * Once code has typed itself, the learner steps through it a piece at a time: the
 * fragment being explained lights up and everything else dims, so there is never
 * any doubt about which bit the words are talking about. Afterwards every
 * annotated fragment stays underlined and clickable, so "what was that again"
 * costs one click rather than a scroll back through the notes.
 *
 * Ranges are handed in already resolved — the editor's job is to draw them, not to
 * work out where they are.
 */

export interface AnatomyRange {
  id: string;
  from: number;
  to: number;
}

export interface AnatomyState {
  ranges: AnatomyRange[];
  /** The fragment currently being explained. Null while nothing is selected. */
  activeId: string | null;
  /**
   * Dim everything outside the active fragment. On during the stepped breakdown;
   * off afterwards, when the learner is browsing rather than being walked through.
   */
  dim: boolean;
  /** Underline the fragments and accept clicks on them. */
  interactive: boolean;
}

export const EMPTY_ANATOMY: AnatomyState = {
  ranges: [],
  activeId: null,
  dim: false,
  interactive: false,
};

export const setAnatomy = StateEffect.define<AnatomyState>();

const activeMark = Decoration.mark({ class: 'cm-anno-active' });
const dimMark = Decoration.mark({ class: 'cm-anno-dim' });
const idleMark = Decoration.mark({ class: 'cm-anno' });

function build(editorState: EditorState, state: AnatomyState): DecorationSet {
  if (state.ranges.length === 0) return Decoration.none;

  const length = editorState.doc.length;
  const clamp = (value: number) => Math.max(0, Math.min(length, value));
  const decorations = [];

  const active = state.ranges.find((range) => range.id === state.activeId) ?? null;

  if (state.interactive) {
    for (const range of state.ranges) {
      if (range.id === active?.id) continue;
      const from = clamp(range.from);
      const to = clamp(range.to);
      if (to > from) decorations.push(idleMark.range(from, to));
    }
  }

  if (active) {
    const from = clamp(active.from);
    const to = clamp(active.to);

    // The complement, as two marks. Cheaper and more exact than trying to fade the
    // whole editor and undo it for one span — opacity on a parent cannot be
    // cancelled by a child.
    if (state.dim) {
      if (from > 0) decorations.push(dimMark.range(0, from));
      if (to < length) decorations.push(dimMark.range(to, length));
    }
    if (to > from) decorations.push(activeMark.range(from, to));
  }

  return Decoration.set(decorations, true);
}

const anatomyStateField = StateField.define<AnatomyState>({
  create: () => EMPTY_ANATOMY,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setAnatomy)) return effect.value;
    }
    return value;
  },
});

const anatomyDecorationField = StateField.define<DecorationSet>({
  create: (editorState) => build(editorState, EMPTY_ANATOMY),
  update(value, transaction) {
    const changed = transaction.effects.some((effect) => effect.is(setAnatomy));
    if (!transaction.docChanged && !changed) return value;
    return build(transaction.state, transaction.state.field(anatomyStateField));
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** The annotation under a document offset, smallest first so nesting works. */
export function rangeAtOffset(state: AnatomyState, offset: number): AnatomyRange | null {
  let best: AnatomyRange | null = null;
  for (const range of state.ranges) {
    if (offset < range.from || offset > range.to) continue;
    if (!best || range.to - range.from <= best.to - best.from) best = range;
  }
  return best;
}

export function readAnatomy(view: EditorView): AnatomyState {
  return view.state.field(anatomyStateField, false) ?? EMPTY_ANATOMY;
}

export function anatomyExtension(): Extension {
  return [anatomyStateField, anatomyDecorationField];
}
