import { Page } from '@/components/shell/Page';

import { SkillMap } from '@/components/dashboard/SkillMap';

export const metadata = { title: 'Skill map' };

export default function SkillsPage() {
  return (
    <Page>      <h1 className="mt-6 text-[length:var(--bl-step-4)] font-semibold text-ink">Your skill map</h1>
      <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">
        Built from what you have actually written, and how long ago. Nothing here is a score,
        and none of it is compared to anyone.
      </p>
      <div className="mt-12">
        <SkillMap />
      </div>
    </Page>
  );
}
