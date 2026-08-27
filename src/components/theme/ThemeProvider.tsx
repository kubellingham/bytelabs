'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { msUntilNextThemeChange, resolveTheme } from '@/lib/theme/resolve';
import {
  getPrefersDark,
  getServerPrefersDark,
  getServerThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeToPrefersDark,
  subscribeToThemePreference,
} from '@/lib/theme/store';
import type { Skin, Theme, ThemeMode, ThemePreference } from '@/lib/theme/types';

interface ThemeContextValue extends ThemePreference {
  /** What is actually painted right now, after mode, skin and clock are resolved. */
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  setSkin: (skin: Skin) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreference,
    getServerThemePreference,
  );
  const prefersDark = useSyncExternalStore(
    subscribeToPrefersDark,
    getPrefersDark,
    getServerPrefersDark,
  );

  const [hour, setHour] = useState(() => new Date().getHours());

  const theme = resolveTheme({
    mode: preference.mode,
    skin: preference.skin,
    hour,
    prefersDark,
  });

  /*
   * Auto mode sleeps until the clock would actually produce a different answer
   * rather than polling — one timer per boundary crossing, not one per minute.
   */
  useEffect(() => {
    if (preference.mode !== 'auto') return;
    const timer = window.setTimeout(
      () => setHour(new Date().getHours()),
      Math.max(1_000, msUntilNextThemeChange(new Date())),
    );
    return () => window.clearTimeout(timer);
  }, [preference.mode, hour]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-skin', preference.skin);
  }, [theme, preference.skin]);

  const setMode = useCallback(
    (mode: ThemeMode) => setThemePreference({ ...getThemePreference(), mode }),
    [],
  );
  const setSkin = useCallback(
    (skin: Skin) => setThemePreference({ ...getThemePreference(), skin }),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ ...preference, theme, setMode, setSkin }),
    [preference, theme, setMode, setSkin],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
