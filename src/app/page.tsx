'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Landing } from '@/components/landing/Landing';
import { useUser } from '@/lib/auth/useUser';

/**
 * The public front door.
 *
 * A signed-out visitor sees the Landing (Google sign-in, feature
 * cards). A signed-in visitor is redirected straight into /brief —
 * we don't build a dashboard interstitial. The unconfigured case
 * (Firebase env vars missing, e.g. a self-hosted dev box) also lands
 * in /brief so nothing is broken by an incomplete deploy.
 */
export default function HomePage() {
  const authState = useUser();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'signed-in' || authState.status === 'unconfigured') {
      router.replace('/brief');
    }
  }, [authState.status, router]);

  if (authState.status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </div>
    );
  }

  if (authState.status === 'signed-out') {
    return <Landing />;
  }

  // signed-in and unconfigured branches fall through — the effect
  // redirects; render a soft spinner while it does.
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
    </div>
  );
}
