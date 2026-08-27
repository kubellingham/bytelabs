'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import type { BeatPlan } from '@/lib/content/beats';
import type { WorkspaceFiles } from '@/lib/content/schema';

/**
 * The concurrent typing mechanic.
 *
 * Code appears character by character at a human pace while the note that explains
 * those specific lines sits alongside it. Not the whole file at once — the brief is
 * explicit that the code responds to the words.
 */

const DEFAULT_CHAR_MS = 15;
/** After a newline, as if the person paused to look at what they just wrote. */
const NEWLINE_PAUSE_MS = 90;
/** After closing a tag or a declaration. */
const PUNCTUATION_PAUSE_MS = 35;

type Op =
  | { kind: 'beat'; index: number }
  | { kind: 'delete'; file: string; offset: number; length: number }
  | { kind: 'char'; file: string; offset: number; char: string; charMs: number }
  | { kind: 'hold'; ms: number };

function buildOps(plan: BeatPlan): Op[] {
  const ops: Op[] = [];

  plan.beats.forEach((beat, index) => {
    ops.push({ kind: 'beat', index });

    for (const edit of beat.edits) {
      if (edit.removedLength > 0) {
        ops.push({
          kind: 'delete',
          file: edit.file,
          offset: edit.offset,
          length: edit.removedLength,
        });
      }
      for (let i = 0; i < edit.text.length; i += 1) {
        ops.push({
          kind: 'char',
          file: edit.file,
          offset: edit.offset + i,
          char: edit.text[i] ?? '',
          charMs: beat.charMs ?? DEFAULT_CHAR_MS,
        });
      }
    }

    if (beat.holdMs) ops.push({ kind: 'hold', ms: beat.holdMs });
  });

  return ops;
}

/**
 * Jitter, because uniform timing reads as a machine printing rather than a person
 * writing — and the brief calls that out specifically.
 */
function delayFor(op: Extract<Op, { kind: 'char' }>): number {
  const jitter = 0.55 + Math.random() * 1.15;
  let delay = op.charMs * jitter;
  if (op.char === '\n') delay += NEWLINE_PAUSE_MS;
  else if (op.char === '>' || op.char === ';' || op.char === '}') delay += PUNCTUATION_PAUSE_MS;
  return delay;
}

export interface TypingPlayback {
  files: WorkspaceFiles;
  /** Index of the beat currently being typed, or -1 before playback starts. */
  beatIndex: number;
  done: boolean;
  /** Jump to the end. Always available — nobody should be held hostage by an animation. */
  skip: () => void;
  restart: () => void;
}

export function useTypingPlayback(
  plan: BeatPlan,
  startFiles: WorkspaceFiles,
  options: { active: boolean; reducedMotion?: boolean } = { active: false },
): TypingPlayback {
  const ops = useMemo(() => buildOps(plan), [plan]);
  const [files, setFiles] = useState<WorkspaceFiles>(startFiles);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [done, setDone] = useState(false);
  const [generation, setGeneration] = useState(0);

  const skip = useCallback(() => {
    setFiles(plan.result);
    setBeatIndex(plan.beats.length - 1);
    setDone(true);
  }, [plan]);

  const restart = useCallback(() => {
    setFiles(startFiles);
    setBeatIndex(-1);
    setDone(false);
    setGeneration((value) => value + 1);
  }, [startFiles]);

  useEffect(() => {
    if (!options.active || done) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cursor = 0;
    let working: WorkspaceFiles = { ...startFiles };

    const finishNow = () => {
      if (cancelled) return;
      setFiles(plan.result);
      setBeatIndex(plan.beats.length - 1);
      setDone(true);
    };

    const step = () => {
      if (cancelled) return;

      if (cursor >= ops.length) {
        setFiles(working);
        setDone(true);
        return;
      }

      const op = ops[cursor];
      cursor += 1;
      if (!op) return step();

      switch (op.kind) {
        case 'beat':
          setBeatIndex(op.index);
          return step();

        case 'delete': {
          const current = working[op.file] ?? '';
          working = {
            ...working,
            [op.file]: current.slice(0, op.offset) + current.slice(op.offset + op.length),
          };
          setFiles(working);
          timer = setTimeout(step, 40);
          return;
        }

        case 'char': {
          const current = working[op.file] ?? '';
          working = {
            ...working,
            [op.file]: current.slice(0, op.offset) + op.char + current.slice(op.offset),
          };
          setFiles(working);
          timer = setTimeout(step, delayFor(op));
          return;
        }

        case 'hold':
          timer = setTimeout(step, op.ms);
          return;
      }
    };

    // Somebody who asked the OS not to animate gets the finished code straight away.
    timer = options.reducedMotion ? setTimeout(finishNow, 0) : setTimeout(step, 350);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ops, options.active, options.reducedMotion, plan, startFiles, done, generation]);

  return { files, beatIndex, done, skip, restart };
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(listener: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * The OS preference, read as the external store it is rather than mirrored into
 * state inside an effect.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, () => false);
}
