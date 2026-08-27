import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

/**
 * The editor reads the same design tokens as the rest of the app, so a skin change
 * repaints the code too — no separate editor theme to keep in sync, and no moment
 * where the editor is still light while the page has gone dark.
 */
export const byteLabsEditorTheme = EditorView.theme({
  '&': {
    color: 'var(--bl-text)',
    backgroundColor: 'var(--bl-code-bg)',
    fontSize: '0.875rem',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--bl-font-mono)',
    padding: '1rem 0',
    caretColor: 'var(--bl-accent)',
    lineHeight: '1.7',
  },
  '.cm-scroller': {
    fontFamily: 'var(--bl-font-mono)',
    overflow: 'auto',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--bl-accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--bl-code-selection)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bl-code-bg)',
    color: 'var(--bl-code-gutter)',
    border: 'none',
    paddingInlineEnd: '0.5rem',
  },
  '.cm-activeLine': { backgroundColor: 'var(--bl-code-active-line)' },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--bl-code-active-line)',
    color: 'var(--bl-text-muted)',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 0.25rem 0 1rem' },

  /*
   * Ghost text. Four steps rather than a continuous opacity: the level comes from
   * the mastery engine, and a value that drifts slightly between sessions would read
   * as flicker rather than as progress.
   */
  '.cm-ghost': {
    color: 'var(--bl-ghost)',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  '.cm-ghost-l0': { opacity: '1' },
  '.cm-ghost-l1': { opacity: '0.68' },
  '.cm-ghost-l2': { opacity: '0.4' },
  '.cm-ghost-l3': { opacity: '0.16' },
  '.cm-ghost-pending': {
    display: 'block',
    color: 'var(--bl-ghost)',
    fontFamily: 'var(--bl-font-mono)',
    whiteSpace: 'pre',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  '.cm-line-matched': { backgroundColor: 'transparent' },

  /*
   * The breakdown. An annotated fragment is underlined so it reads as something
   * you can ask about; the one being explained is lit, and the rest of the file
   * recedes rather than disappearing — context you can still see past.
   */
  '.cm-anno': {
    borderBottom: '1px dashed var(--bl-border-strong)',
    cursor: 'help',
  },
  '.cm-anno:hover': {
    backgroundColor: 'var(--bl-code-active-line)',
  },
  '.cm-anno-active': {
    backgroundColor: 'var(--bl-accent-soft)',
    borderRadius: '3px',
    boxShadow: '0 0 0 2px var(--bl-accent-soft)',
    borderBottom: '2px solid var(--bl-accent)',
  },
  '.cm-anno-dim': {
    opacity: '0.3',
    transition: 'opacity 220ms ease',
  },
});

export const byteLabsHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.tagName, color: 'var(--bl-syn-tag)' },
    { tag: tags.angleBracket, color: 'var(--bl-syn-punct)' },
    { tag: tags.attributeName, color: 'var(--bl-syn-attr)' },
    { tag: tags.attributeValue, color: 'var(--bl-syn-string)' },
    { tag: tags.string, color: 'var(--bl-syn-string)' },
    { tag: tags.comment, color: 'var(--bl-syn-comment)', fontStyle: 'italic' },
    { tag: tags.keyword, color: 'var(--bl-syn-keyword)' },
    { tag: tags.propertyName, color: 'var(--bl-syn-attr)' },
    { tag: tags.number, color: 'var(--bl-syn-number)' },
    { tag: tags.unit, color: 'var(--bl-syn-number)' },
    { tag: tags.className, color: 'var(--bl-syn-keyword)' },
    { tag: tags.punctuation, color: 'var(--bl-syn-punct)' },
    { tag: tags.operator, color: 'var(--bl-syn-punct)' },
    { tag: tags.variableName, color: 'var(--bl-text)' },
  ]),
);
