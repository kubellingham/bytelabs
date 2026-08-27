import { StateEffect, StateField, type EditorState, type Extension } from '@codemirror/state';
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view';

import { ghostLevelForConcepts, type GhostLevel } from '@/lib/mastery';

import { resolveLines, type Resolution } from './resolve';

/**
 * Ghost text as a CodeMirror decoration layer.
 *
 * The learner's document is the only real document — the ghost never occupies it,
 * so every keystroke is theirs and nothing has to be "accepted". What is drawn is
 * the *difference* between what they have written and the target: the remainder of
 * the line they are on, and the lines they have not reached.
 */

export interface GhostState {
  target: string;
  /** Concepts owed to each target line, from the beat plan. */
  lineConcepts: string[][];
  /** Current mastery per concept, driving how faint each line is. */
  strengths: Record<string, number>;
  enabled: boolean;
}

export const EMPTY_GHOST: GhostState = {
  target: '',
  lineConcepts: [],
  strengths: {},
  enabled: false,
};

export const setGhost = StateEffect.define<GhostState>();

class RemainderWidget extends WidgetType {
  constructor(
    private readonly text: string,
    private readonly level: GhostLevel,
  ) {
    super();
  }

  override eq(other: RemainderWidget): boolean {
    return other.text === this.text && other.level === this.level;
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = `cm-ghost cm-ghost-l${this.level}`;
    span.textContent = this.text;
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

class PendingWidget extends WidgetType {
  constructor(
    private readonly lines: string[],
    private readonly levels: GhostLevel[],
  ) {
    super();
  }

  override eq(other: PendingWidget): boolean {
    return (
      other.lines.length === this.lines.length &&
      other.lines.every((line, i) => line === this.lines[i]) &&
      other.levels.every((level, i) => level === this.levels[i])
    );
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.setAttribute('aria-hidden', 'true');
    this.lines.forEach((line, index) => {
      const div = document.createElement('span');
      div.className = `cm-ghost-pending cm-ghost-l${this.levels[index] ?? 0}`;
      // A zero-width space keeps a blank ghost line from collapsing to nothing.
      div.textContent = line.length > 0 ? line : '​';
      wrapper.appendChild(div);
    });
    return wrapper;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

function levelForLine(state: GhostState, index: number): GhostLevel {
  return ghostLevelForConcepts(state.lineConcepts[index] ?? [], state.strengths);
}

function buildDecorations(editorState: EditorState, state: GhostState): DecorationSet {
  if (!state.enabled || state.target.length === 0) return Decoration.none;

  const doc = editorState.doc;
  const resolution: Resolution = resolveLines(doc.toString(), state.target);
  const decorations = [];

  resolution.lines.forEach((line, index) => {
    if (line.remainder.length === 0) return;
    if (index + 1 > doc.lines) return;

    const docLine = doc.line(index + 1);
    decorations.push(
      Decoration.widget({
        widget: new RemainderWidget(line.remainder, levelForLine(state, index)),
        side: 1,
      }).range(docLine.to),
    );
  });

  if (resolution.pending.length > 0) {
    const offset = resolution.lines.length;
    decorations.push(
      Decoration.widget({
        widget: new PendingWidget(
          resolution.pending,
          resolution.pending.map((_, i) => levelForLine(state, offset + i)),
        ),
        side: 1,
        block: true,
      }).range(doc.length),
    );
  }

  return Decoration.set(decorations, true);
}

const ghostStateField = StateField.define<GhostState>({
  create: () => EMPTY_GHOST,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setGhost)) return effect.value;
    }
    return value;
  },
});

/**
 * Decorations come from a StateField rather than a view-computed facet because the
 * pending-lines widget is a *block* widget, and CodeMirror only accepts block
 * decorations from directly-provided sources. Computing them from the view throws
 * at runtime — which is exactly what it did before this was a field.
 *
 * Rebuilding on every document change is affordable: a lesson file is a few hundred
 * characters and the work is a line-by-line string comparison.
 */
const ghostDecorationField = StateField.define<DecorationSet>({
  create: (editorState) => buildDecorations(editorState, EMPTY_GHOST),
  update(value, transaction) {
    const changedGhost = transaction.effects.some((effect) => effect.is(setGhost));
    if (!transaction.docChanged && !changedGhost) return value;
    // ghostStateField is listed first in the extension array, so it has already
    // taken this transaction's effect into account by the time this runs.
    return buildDecorations(transaction.state, transaction.state.field(ghostStateField));
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function ghostExtension(): Extension {
  return [ghostStateField, ghostDecorationField];
}

export { ghostStateField };
