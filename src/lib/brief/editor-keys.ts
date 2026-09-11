/**
 * Code-editor keybinding behaviour for the plain `<textarea>` editors used
 * across The Brief (the mini-lesson type step, the silhouette rewrite).
 *
 * The rules match what a Python-writing student sees in VS Code with no
 * plug-ins:
 *   - Tab inserts INDENT_SPACES (4) spaces at the cursor. When there is a
 *     selection, the spaces replace it — no jumping to the next form field.
 *   - Enter preserves the current line's leading whitespace. When the line
 *     (up to the cursor, whitespace-trimmed) ends with `:`, add another
 *     INDENT_SPACES worth of spaces — VS Code does this for Python because
 *     `:` opens a new block.
 *
 * The function is pure so it's trivial to test and reuse; the caller wires
 * the returned `{ next, cursor }` back into React state and restores the
 * cursor with a rAF callback after the re-render.
 */

export const INDENT_SPACES = 4;
const INDENT = ' '.repeat(INDENT_SPACES);

export interface EditorKeyResult {
  /** The next full source text. */
  next: string;
  /** Where the cursor should land after applying `next`. */
  cursor: number;
}

/**
 * Apply Tab / Enter behaviour for a code editor.
 *
 * Returns null when the event is one this helper does not handle — the
 * caller should leave the default browser behaviour (typing a character,
 * arrow keys, etc.) untouched.
 */
export function applyCodeEditorKey(
  event: { key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  source: string,
  selectionStart: number,
  selectionEnd: number,
): EditorKeyResult | null {
  // Never handle any Ctrl/Meta chord — those belong to the caller (Ctrl+Enter
  // to run, Cmd+A to select all, etc.).
  if (event.ctrlKey || event.metaKey) return null;

  if (event.key === 'Tab' && !event.shiftKey) {
    const next = source.slice(0, selectionStart) + INDENT + source.slice(selectionEnd);
    return { next, cursor: selectionStart + INDENT.length };
  }

  if (event.key === 'Enter') {
    const lineStart = lastLineStart(source, selectionStart);
    const currentLineToCursor = source.slice(lineStart, selectionStart);
    const indent = leadingWhitespace(currentLineToCursor);
    const trimmed = currentLineToCursor.trimEnd();
    const extra = trimmed.endsWith(':') ? INDENT : '';
    const insert = '\n' + indent + extra;
    const next = source.slice(0, selectionStart) + insert + source.slice(selectionEnd);
    return { next, cursor: selectionStart + insert.length };
  }

  return null;
}

function lastLineStart(source: string, cursor: number): number {
  const previousNewline = source.lastIndexOf('\n', cursor - 1);
  return previousNewline < 0 ? 0 : previousNewline + 1;
}

function leadingWhitespace(text: string): string {
  const match = /^[\t ]*/.exec(text);
  return match ? match[0] : '';
}
