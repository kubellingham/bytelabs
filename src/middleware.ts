import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route gate for the ship-ready ByteLabs.
 *
 * Only the Brief zone is real right now. Everything else on
 * /course and /ground redirects to those zones' coming-soon pages;
 * Kube-legacy zones (learn, warmup, practical, graduate, paths,
 * progress) redirect to /brief so nobody deep-links into a
 * half-shipped surface.
 *
 * Auth gating is done client-side by AppGate inside the Brief route
 * -- not here -- because Firebase auth state lives in the browser
 * and this middleware runs on the edge with no session cookie.
 */

const LEGACY_TO_BRIEF = [
  '/learn',
  '/warmup',
  '/practical',
  '/graduate',
  '/paths',
  '/progress',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Nested course/ground deep links → their zone's coming-soon.
  if (pathname.startsWith('/course/')) {
    return NextResponse.redirect(new URL('/course', request.url));
  }
  if (pathname.startsWith('/ground/')) {
    return NextResponse.redirect(new URL('/ground', request.url));
  }

  // Kube-legacy zones aren't part of ByteLabs today. Anyone who
  // deep-links to them lands in Brief instead.
  for (const prefix of LEGACY_TO_BRIEF) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return NextResponse.redirect(new URL('/brief', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/course/:path*',
    '/ground/:path*',
    '/learn/:path*',
    '/warmup/:path*',
    '/practical/:path*',
    '/graduate/:path*',
    '/paths/:path*',
    '/progress/:path*',
  ],
};
