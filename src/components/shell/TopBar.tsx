'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useProgress } from '@/lib/storage/useProgress';
import { useUser } from '@/lib/auth/useUser';
import { SignOutButton } from '@/components/auth/AuthGate';

/**
 * The persistent navigation.
 *
 * The two zones are named in the bar itself — The Course and The Ground — because
 * they are the product's own words for the two things you can be doing, and a
 * learner who cannot see them has to remember where they are. Everything else is
 * secondary and sits to the right.
 */
const LINKS = [
  { href: '/course', label: 'The Course', match: ['/course', '/learn', '/graduate'] },
  { href: '/ground', label: 'The Ground', match: ['/ground'] },
  { href: '/brief', label: 'The Brief', match: ['/brief'] },
  { href: '/warmup', label: 'Warm-up', match: ['/warmup'] },
  { href: '/progress', label: 'Progress', match: ['/progress'] },
] as const;

export function TopBar() {
  const pathname = usePathname();
  const progress = useProgress();
  const authState = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-8 py-3">
        <Link
          href="/"
          className="shrink-0 font-mono text-xs tracking-[0.2em] text-accent uppercase"
        >
          ByteLabs
        </Link>

        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active = link.match.some((prefix) => pathname.startsWith(prefix));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active ? 'bg-raised font-medium text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {progress.streak.current > 0 ? (
            <p className="text-xs text-subtle">
              <span className="font-medium text-muted">{progress.streak.current}</span> day
              {progress.streak.current === 1 ? '' : 's'}
            </p>
          ) : null}
          <Link
            href="/settings"
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Settings
          </Link>
          {authState.status === 'signed-in' && <SignOutButton />}
        </div>
      </div>
    </header>
  );
}
