import { THEME_STORAGE_KEY } from './boot';
import {
  DEFAULT_THEME_PREFERENCE,
  isSkin,
  isThemeMode,
  type ThemePreference,
} from './types';

/**
 * localStorage and matchMedia are external stores, so they are read through
 * `useSyncExternalStore` rather than mirrored into state inside an effect.
 * Snapshots must be referentially stable or React re-renders forever, hence the
 * cached `current`.
 */

let current: ThemePreference | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): ThemePreference {
  if (!raw) return DEFAULT_THEME_PREFERENCE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_THEME_PREFERENCE;
    const candidate = parsed as Record<string, unknown>;
    return {
      mode: isThemeMode(candidate.mode) ? candidate.mode : DEFAULT_THEME_PREFERENCE.mode,
      skin: isSkin(candidate.skin) ? candidate.skin : DEFAULT_THEME_PREFERENCE.skin,
    };
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function getThemePreference(): ThemePreference {
  if (current) return current;
  if (typeof window === 'undefined') {
    current = DEFAULT_THEME_PREFERENCE;
    return current;
  }
  try {
    current = parse(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    current = DEFAULT_THEME_PREFERENCE;
  }
  return current;
}

export function getServerThemePreference(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE;
}

export function setThemePreference(next: ThemePreference): void {
  current = next;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A locked-down browser still gets a working theme for this session.
  }
  for (const listener of listeners) listener();
}

export function subscribeToThemePreference(listener: () => void): () => void {
  listeners.add(listener);

  // Keep two ByteLabs tabs in agreement about the skin.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    current = parse(event.newValue);
    listener();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function getPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(DARK_QUERY).matches;
}

export function getServerPrefersDark(): boolean {
  return false;
}

export function subscribeToPrefersDark(listener: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
