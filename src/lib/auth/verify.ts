import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

function firebaseProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

export interface AuthResult {
  uid: string;
  email: string | null;
}

export async function verifyIdToken(token: string): Promise<AuthResult | null> {
  const projectId = firebaseProjectId();
  if (!projectId) return null;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    return { uid: payload.sub, email };
  } catch {
    return null;
  }
}

export async function getAuthFromRequest(
  req: Request,
): Promise<AuthResult | null> {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match?.[1]) return null;
  return verifyIdToken(match[1]);
}

export async function requireAuth(
  req: Request,
): Promise<
  | { ok: true; auth: AuthResult }
  | { ok: false; response: Response }
> {
  const result = await getAuthFromRequest(req);
  if (!result) {
    return {
      ok: false,
      response: Response.json({ error: 'Not signed in.' }, { status: 401 }),
    };
  }
  return { ok: true, auth: result };
}
