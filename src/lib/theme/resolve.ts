import { FIXED_DARK_SKINS, type Skin, type Theme, type ThemeMode } from './types';

/**
 * Hour (local, 0-23) at which the app starts and stops being light.
 * Daylight hours are deliberately generous: the point is a room that dims in the
 * evening, not a strict day/night switch.
 */
export const LIGHT_FROM_HOUR = 7;
export const LIGHT_UNTIL_HOUR = 18;

/** The clock-driven half of `auto`. Exported alone so it can be tested directly. */
export function themeForHour(hour: number): Theme {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  return h >= LIGHT_FROM_HOUR && h < LIGHT_UNTIL_HOUR ? 'light' : 'dark';
}

export interface ResolveInput {
  mode: ThemeMode;
  skin: Skin;
  /** Local hour, 0-23. Only consulted for `auto`. */
  hour: number;
  /** Whether the OS reports a dark preference. Only consulted for `system`. */
  prefersDark: boolean;
}

/**
 * Single source of truth for what ends up on <html data-theme>. A skin with only
 * one palette always reports the palette it actually has, so the rest of the app
 * never has to special-case it.
 */
export function resolveTheme({ mode, skin, hour, prefersDark }: ResolveInput): Theme {
  if (FIXED_DARK_SKINS.has(skin)) return 'dark';

  switch (mode) {
    case 'light':
      return 'light';
    case 'dark':
      return 'dark';
    case 'system':
      return prefersDark ? 'dark' : 'light';
    case 'auto':
      return themeForHour(hour);
  }
}

/**
 * How long until `auto` would produce a different answer, in milliseconds.
 * Lets the provider sleep until the boundary instead of polling the clock.
 */
export function msUntilNextThemeChange(now: Date): number {
  const current = themeForHour(now.getHours());
  const next = new Date(now);
  next.setMinutes(0, 0, 0);

  for (let i = 1; i <= 24; i += 1) {
    next.setHours(next.getHours() + 1);
    if (themeForHour(next.getHours()) !== current) {
      return next.getTime() - now.getTime();
    }
  }
  return 60 * 60 * 1000;
}
