'use client';

import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  anatomyExtension,
  EMPTY_ANATOMY,
  rangeAtOffset,
  readAnatomy,
  setAnatomy,
  type AnatomyState,
} from '@/lib/editor/anatomy';
import { EMPTY_GHOST, ghostExtension, setGhost, type GhostState } from '@/lib/editor/ghost';
import { byteLabsEditorTheme, byteLabsHighlighting } from '@/lib/editor/theme';

function languageFor(path: string): Extension {
  if (/\.css$/i.test(path)) return css();
  /*
   * Tag auto-closing is off deliberately.
   *
   * It is a fine convenience in a normal IDE, but here it takes away the reps that
   * are the entire point — a learner who never types `</h1>` never learns to — and
   * it actively fights the ghost mechanic: typing `<html lang="en">` becomes
   * `<html lang="en"></html>`, which no longer matches the line being practised.
   */
  return html({ autoCloseTags: false });
}

export interface CodeEditorProps {
  path: string;
  value: string;
  onChange: (value: string) => void;
  ghost?: GhostState;
  /** Resolved annotation ranges plus which one is being explained. */
  anatomy?: AnatomyState;
  /** Fired when the learner clicks an annotated fragment to ask what it is. */
  onPickAnnotation?: (id: string) => void;
  readOnly?: boolean;
  ariaLabel?: string;
}

/**
 * One CodeMirror instance for one file.
 *
 * The view is created once and kept. Changes from outside — the typing animation
 * writing into the document, a reset — arrive as transactions rather than by
 * recreating the editor, so cursor position and undo history survive. The change
 * callback lives in a compartment so a new callback identity reconfigures the
 * listener instead of tearing the whole editor down.
 */
export function CodeEditor({
  path,
  value,
  onChange,
  ghost,
  anatomy,
  onPickAnnotation,
  readOnly = false,
  ariaLabel,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<EditorView | null>(null);

  const listener = useMemo(() => new Compartment(), []);
  const editable = useMemo(() => new Compartment(), []);
  const picker = useMemo(() => new Compartment(), []);

  const extensions = useMemo<Extension[]>(
    () => [
      lineNumbers(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      indentUnit.of('  '),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      languageFor(path),
      byteLabsHighlighting,
      byteLabsEditorTheme,
      ghostExtension(),
      anatomyExtension(),
      EditorView.lineWrapping,
      editable.of(EditorState.readOnly.of(false)),
      listener.of([]),
      picker.of([]),
    ],
    [path, listener, editable, picker],
  );

  // `value` seeds the document here and is reconciled by the effect below; it is
  // deliberately not a dependency, or every keystroke would rebuild the editor.
  const seed = useRef(value);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const instance = new EditorView({
      state: EditorState.create({ doc: seed.current, extensions }),
      parent: node,
    });
    setView(instance);

    return () => {
      instance.destroy();
      setView(null);
    };
  }, [extensions]);

  useEffect(() => {
    view?.dispatch({
      effects: listener.reconfigure(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
      ),
    });
  }, [view, listener, onChange]);

  useEffect(() => {
    view?.dispatch({ effects: editable.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [view, editable, readOnly]);

  useEffect(() => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: { anchor: Math.min(value.length, view.state.selection.main.anchor) },
    });
  }, [view, value]);

  useEffect(() => {
    view?.dispatch({ effects: setGhost.of(ghost ?? EMPTY_GHOST) });
  }, [view, ghost]);

  useEffect(() => {
    view?.dispatch({ effects: setAnatomy.of(anatomy ?? EMPTY_ANATOMY) });
  }, [view, anatomy]);

  // Clicking an annotated fragment asks what it is. In its own compartment so a
  // new callback reconfigures the handler rather than rebuilding the editor.
  useEffect(() => {
    if (!view) return;
    view.dispatch({
      effects: picker.reconfigure(
        onPickAnnotation
          ? EditorView.domEventHandlers({
              mousedown(event, instance) {
                const state = readAnatomy(instance);
                if (!state.interactive || state.ranges.length === 0) return false;

                const offset = instance.posAtCoords({ x: event.clientX, y: event.clientY });
                if (offset === null) return false;

                const hit = rangeAtOffset(state, offset);
                if (!hit) return false;

                event.preventDefault();
                onPickAnnotation(hit.id);
                return true;
              },
            })
          : [],
      ),
    });
  }, [view, picker, onPickAnnotation]);

  return (
    <div
      ref={host}
      aria-label={ariaLabel ?? `${path} editor`}
      className="h-full min-h-0 overflow-hidden"
    />
  );
}
