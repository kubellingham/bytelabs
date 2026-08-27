import { WarmupSession } from '@/components/warmup/WarmupSession';

export const metadata = { title: 'Warm-up' };

export default function WarmupPage() {
  return (
    <main id="main">
      <WarmupSession />
    </main>
  );
}
