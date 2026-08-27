import { WarmupSession } from '@/components/warmup/WarmupSession';
import { TopBar } from '@/components/shell/TopBar';

export const metadata = { title: 'Warm-up' };

export default function WarmupPage() {
  return (
    <>
      <TopBar />
      <main id="main">
        <WarmupSession />
      </main>
    </>
  );
}
