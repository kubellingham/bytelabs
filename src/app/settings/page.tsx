import { Page } from '@/components/shell/Page';

import { ThemeSettings } from '@/components/theme/ThemeSettings';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <Page>      <h1 className="mt-6 text-[length:var(--bl-step-4)] font-semibold text-ink">Settings</h1>
      <div className="mt-12">
        <ThemeSettings />
      </div>
    </Page>
  );
}
