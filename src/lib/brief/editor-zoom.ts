'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Editor zoom — a per-learner font-size preference that applies to every
 * ByteLabs editor surface (the mini-lesson type step, the silhouette
 * rewrite).
 *
 * Persisted in localStorage so the choice sticks across refreshes and tasks
 * without an account. Exposed as an external store so any editor that
 * subscribes re-renders when the learner nudges the size — even from
 * another editor, in another tab.
 */

/** Font-size multipliers, small to large. Base font is 14px. */
export const ZOOM_LEVELS = [0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.75, 2.0] as const;

/** Default scale (14px). */
export const DEFAULT_ZOOM = 1.0;

const STORAGE_KEY = 'bytelabs.brief.v1.editor-zoom';

/**
 * Advance the zoom level by one step in the requested direction.
 *
 *  - 'in' returns the next larger level (or the current level if already
 *    at the largest).
 *  - 'out' returns the next smaller level.
 *  - 'reset' returns DEFAULT_ZOOM.
 *
 * The input `current` is snapped to the nearest known level first, so any
 * external value (a stale localStorage entry, a bad hand-set) is handled
 * safely.
 */
export function nextZoomLevel(current: number, direction: 'in' | 'out' | 'reset'): number {
  if (direction === 'reset') return DEFAULT_ZOOM;
  const idx = nearestLevelIndex(current);
  if (direction === 'in') return ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)]!;
  return ZOOM_LEVELS[Math.max(idx - 1, 0)]!;
}

function nearestLevelIndex(value: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < ZOOM_LEVELS.length; i += 1) {
    const dist = Math.abs((ZOOM_LEVELS[i] ?? DEFAULT_ZOOM) - value);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/* ---------- External store so every editor re-renders on change ---------- */

type Listener = () => void;
const listeners = new Set<Listener>();

function readCurrent(): number {
  if (typeof window === 'undefined') return DEFAULT_ZOOM;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ZOOM;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_ZOOM;
    return parsed;
  } catch {
    return DEFAULT_ZOOM;
  }
}

function writeCurrent(next: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* ignore */
  }
  for (const listener of listeners) listener();
}

/**
 * Hook: read the current editor zoom level and get action functions to
 * change it. React re-runs subscribers whenever the level moves, from any
 * editor in any tab of this browser (via storage events).
 */
export function useEditorZoom(): {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
} {
  const scale = useSyncExternalStore(
    subscribe,
    readCurrent,
    () => DEFAULT_ZOOM, // stable server snapshot
  );

  const zoomIn = useCallback(() => writeCurrent(nextZoomLevel(scale, 'in')), [scale]);
  const zoomOut = useCallback(() => writeCurrent(nextZoomLevel(scale, 'out')), [scale]);
  const reset = useCallback(() => writeCurrent(DEFAULT_ZOOM), []);

  return { scale, zoomIn, zoomOut, reset };
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/**
 * Turn a scale into a { fontSize, lineHeight } style object the caller can
 * spread onto both a `<textarea>` and its ghost `<pre>` to keep them
 * pixel-aligned in the silhouette editor.
 */
export function zoomStyle(scale: number): { fontSize: string; lineHeight: number } {
  return { fontSize: `${(14 * scale).toFixed(2)}px`, lineHeight: 1.6 };
}
