'use client';

import { useTheme } from '@/components/theme/ThemeProvider';
import { LIGHT_FROM_HOUR, LIGHT_UNTIL_HOUR } from '@/lib/theme/resolve';
import { FIXED_DARK_SKINS, SKINS, THEME_MODES, type Skin, type ThemeMode } from '@/lib/theme/types';

const MODE_COPY: Record<ThemeMode, { label: string; note: string }> = {
  auto: {
    label: 'Follow the clock',
    note: `Light from ${LIGHT_FROM_HOUR}am, darker from ${LIGHT_UNTIL_HOUR - 12}pm. No toggle to remember.`,
  },
  system: { label: 'Follow the system', note: 'Whatever your operating system is set to.' },
  light: { label: 'Always light', note: 'Pinned, whatever the time.' },
  dark: { label: 'Always dark', note: 'Pinned, whatever the time.' },
};

const SKIN_COPY: Record<Skin, { label: string; note: string }> = {
  default: { label: 'Default', note: 'Clean and quiet. Easy to sit with for an hour.' },
  ocean: { label: 'Ocean', note: 'Cooler, a little softer on the eyes.' },
  terminal: { label: 'Terminal', note: 'Green on near-black. Dark only.' },
  neon: { label: 'Neon', note: 'High chroma, late night. Dark only.' },
  contrast: { label: 'High contrast', note: 'Maximum contrast, heavier borders.' },
};

/**
 * Theme and skin.
 *
 * The layout never changes — only the skin does. Two skins define a single palette
 * and say so rather than silently ignoring the light/dark choice.
 */
export function ThemeSettings() {
  const { mode, skin, theme, setMode, setSkin } = useTheme();
  const skinIsFixed = FIXED_DARK_SKINS.has(skin);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Light and dark</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {THEME_MODES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`rounded-xl border px-4 py-3 text-start transition-colors ${
                mode === option
                  ? 'border-accent bg-accent-soft/60'
                  : 'border-line bg-surface hover:border-accent/40'
              }`}
            >
              <p className="font-medium text-ink">{MODE_COPY[option].label}</p>
              <p className="mt-0.5 text-sm text-muted">{MODE_COPY[option].note}</p>
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm text-subtle">
          {skinIsFixed
            ? `The ${SKIN_COPY[skin].label} skin only has one palette, so this has no effect while it is on.`
            : `Currently showing ${theme}.`}
        </p>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.14em] text-subtle uppercase">Skin</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SKINS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSkin(option)}
              aria-pressed={skin === option}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
                skin === option
                  ? 'border-accent bg-accent-soft/60'
                  : 'border-line bg-surface hover:border-accent/40'
              }`}
            >
              <span
                aria-hidden="true"
                data-skin={option}
                data-theme={FIXED_DARK_SKINS.has(option) ? 'dark' : 'light'}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-bg"
              >
                <span className="size-4 rounded-full bg-accent" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-ink">{SKIN_COPY[option].label}</span>
                <span className="block text-sm text-muted">{SKIN_COPY[option].note}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
