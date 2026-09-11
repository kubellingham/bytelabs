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
 * (Firebase env vars missing) ALSO sees the Landing: the marketing
 * is the front door for everyone, and the Google button already
 * knows how to fall through to /brief when there's no auth backend.
 */
export default function HomePage() {
  const authState = useUser();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'signed-in') {
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

  if (authState.status === 'signed-out' || authState.status === 'unconfigured') {
    return <Landing />;
  }

  // signed-in falls through — the effect redirects; soft spinner
  // while it does.
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
    </div>
  );
}
