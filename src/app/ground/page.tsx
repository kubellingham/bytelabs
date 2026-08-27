import { Page } from '@/components/shell/Page';

import { ScenarioLibrary } from '@/components/ground/ScenarioLibrary';
import { GROUND_SCENARIOS } from '@/content';

export const metadata = { title: 'The Ground' };

export default function GroundPage() {
  return (
    <Page>
      <h1 className="mt-6 text-[length:var(--bl-step-4)] font-semibold text-ink">The Ground</h1>
      <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">
        No lessons, no unlocks, nothing to fail. A client, a brief, and whatever you already
        know.
      </p>
      <p className="measure mt-4 text-sm text-subtle">
        Every scenario comes with a different client each time you take it, so coming back to
        one is practice rather than recital. Pick whatever you feel like building.
      </p>

      <div className="mt-10">
        <ScenarioLibrary scenarios={GROUND_SCENARIOS} />
      </div>
    </Page>
  );
}
