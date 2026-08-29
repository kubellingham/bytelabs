import { auth } from '@/lib/firebase/client';

export async function authedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const firebaseAuth = auth();
  if (!firebaseAuth) throw new Error('Firebase not configured');
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}
