export const SKINS = ['default', 'ocean', 'terminal', 'neon', 'contrast'] as const;
export type Skin = (typeof SKINS)[number];

export type Theme = 'light' | 'dark';

/**
 * `auto` is the ByteLabs default: the app reads the clock and shifts from light
 * to dark as evening comes, with no toggle to hunt for. `system` defers to the OS
 * instead, and the two explicit values pin it.
 */
export const THEME_MODES = ['auto', 'system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export interface ThemePreference {
  mode: ThemeMode;
  skin: Skin;
}

export const DEFAULT_THEME_PREFERENCE: ThemePreference = {
  mode: 'auto',
  skin: 'default',
};

/** Skins that define one palette only; data-theme has no effect on them. */
export const FIXED_DARK_SKINS: ReadonlySet<Skin> = new Set<Skin>(['terminal', 'neon']);

export function isSkin(value: unknown): value is Skin {
  return typeof value === 'string' && (SKINS as readonly string[]).includes(value);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}
