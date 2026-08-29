'use client';

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useUser } from '@/lib/auth/useUser';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const authState = useUser();

  if (authState.status === 'loading') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (authState.status === 'unconfigured') {
    return <>{children}</>;
  }

  if (authState.status === 'signed-out') {
    return <SignInForm />;
  }

  return <>{children}</>;
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const firebaseAuth = auth();
      if (!firebaseAuth) {
        setError('Firebase is not configured.');
        return;
      }
      if (mode === 'sign-in') {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h2 className="text-center text-lg font-medium">
        {mode === 'sign-in' ? 'Sign in to ByteLabs' : 'Create your account'}
      </h2>
      <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
        Same account as Studying Kube
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        {error && (
          <p className="text-sm text-red-500" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        {mode === 'sign-in' ? (
          <>
            No account?{' '}
            <button
              onClick={() => { setMode('sign-up'); setError(null); }}
              className="font-medium text-[var(--color-accent)]"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have one?{' '}
            <button
              onClick={() => { setMode('sign-in'); setError(null); }}
              className="font-medium text-[var(--color-accent)]"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      onClick={() => {
        const firebaseAuth = auth();
        if (firebaseAuth) void signOut(firebaseAuth);
      }}
      className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
    >
      Sign out
    </button>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/user-not-found': return 'No account with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}
