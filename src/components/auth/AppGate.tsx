'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useUser } from '@/lib/auth/useUser';

/**
 * Auth wrapper for the app zones (currently /brief).
 *
 * Signed-in and unconfigured (self-host / dev without Firebase) both
 * pass through — the app also supports the anonymous-fallback
 * deployment shape. Signed-out gets redirected to the public landing
 * at `/`. Loading shows a soft spinner rather than a flash of
 * gated content or a login form.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const authState = useUser();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'signed-out') {
      router.replace('/');
    }
  }, [authState.status, router]);

  if (authState.status === 'loading' || authState.status === 'signed-out') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div
          role="status"
          aria-label="Loading"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </div>
    );
  }

  return <>{children}</>;
}
