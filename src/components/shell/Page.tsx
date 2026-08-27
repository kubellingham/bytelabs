import type { ReactNode } from 'react';

import { TopBar } from './TopBar';

/**
 * The standard page frame: persistent navigation, then content.
 *
 * The three workspace surfaces — a lesson, a graduation, a scenario — deliberately
 * do not use this. They are full-height split panes where a second bar would eat
 * the editor, so they carry a compact breadcrumb of their own instead.
 */
export function Page({
  children,
  width = 'default',
}: {
  children: ReactNode;
  width?: 'default' | 'wide';
}) {
  return (
    <>
      <TopBar />
      <main
        id="main"
        className={`mx-auto px-8 py-12 ${width === 'wide' ? 'max-w-6xl' : 'max-w-4xl'}`}
      >
        {children}
      </main>
    </>
  );
}
