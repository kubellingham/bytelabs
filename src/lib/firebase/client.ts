import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function auth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

/**
 * Google sign-in via a popup. Returns null and quietly no-ops when
 * Firebase is not configured (the app also supports an
 * anonymous-fallback deployment); the caller can branch on the return.
 * Popup-blocked or user-closed rejects with a friendly-error code —
 * let it propagate so the caller shows the right message.
 */
export async function signInWithGoogle(): Promise<{ ok: boolean; reason?: string }> {
  const firebaseAuth = auth();
  if (!firebaseAuth) return { ok: false, reason: 'unconfigured' };
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(firebaseAuth, provider);
  return { ok: true };
}
