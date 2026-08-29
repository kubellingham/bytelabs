'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User };

let currentState: AuthState = { status: 'loading' };
const listeners = new Set<() => void>();
let unsubFirebase: (() => void) | null = null;

function ensureSubscription() {
  if (unsubFirebase) return;
  if (typeof window === 'undefined') return;
  unsubFirebase = onAuthStateChanged(auth(), (user) => {
    currentState = user
      ? { status: 'signed-in', user }
      : { status: 'signed-out' };
    for (const l of listeners) l();
  });
}

function subscribe(listener: () => void): () => void {
  ensureSubscription();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: AuthState = { status: 'loading' };

export function useUser(): AuthState {
  return useSyncExternalStore(
    useCallback((l) => subscribe(l), []),
    () => currentState,
    () => SERVER_STATE,
  );
}

export async function getIdToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const user = auth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}
