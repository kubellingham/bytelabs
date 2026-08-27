import Link from 'next/link';

import { ThemeSettings } from '@/components/theme/ThemeSettings';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-8 py-16">
      <Link
        href="/"
        className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase hover:underline"
      >
        ← ByteLabs
      </Link>
      <h1 className="mt-6 text-[length:var(--bl-step-4)] font-semibold text-ink">Settings</h1>
      <div className="mt-12">
        <ThemeSettings />
      </div>
    </main>
  );
}
