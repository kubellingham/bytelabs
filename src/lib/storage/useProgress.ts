'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { getProgressStore } from './local';
import { createLearnerState, type LearnerState } from './types';

/**
 * A single frozen snapshot for the server render. `useSyncExternalStore` requires
 * the server snapshot to be referentially stable or React re-renders forever.
 */
const SERVER_SNAPSHOT: LearnerState = createLearnerState(new Date(0));

export function useProgress(): LearnerState {
  const store = getProgressStore();
  return useSyncExternalStore(
    useCallback((listener) => store.subscribe(listener), [store]),
    useCallback(() => store.getSnapshot(), [store]),
    () => SERVER_SNAPSHOT,
  );
}

export function useProgressActions() {
  const store = getProgressStore();
  return useMemo(
    () => ({
      update: (recipe: (state: LearnerState) => LearnerState) => store.update(recipe),
      reset: () => store.reset(),
      flush: () => store.flush(),
    }),
    [store],
  );
}
