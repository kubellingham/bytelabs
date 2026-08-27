import { notFound } from 'next/navigation';

import { ScenarioRunner } from '@/components/ground/ScenarioRunner';
import { getScenario, GROUND_SCENARIOS } from '@/content';

export function generateStaticParams() {
  return GROUND_SCENARIOS.map((scenario) => ({ scenario: scenario.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ scenario: string }> }) {
  const scenario = getScenario((await params).scenario);
  return { title: scenario?.title ?? 'Scenario' };
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const scenario = getScenario((await params).scenario);
  if (!scenario) notFound();

  return (
    <main id="main">
      <ScenarioRunner scenario={scenario} />
    </main>
  );
}
