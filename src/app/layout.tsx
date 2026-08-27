import type { Metadata, Viewport } from 'next';

import { NarrowScreenNotice } from '@/components/shell/NarrowScreenNotice';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { themeBootScript } from '@/lib/theme/boot';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ByteLabs',
    template: '%s · ByteLabs',
  },
  description:
    'Where CS students and developers go to actually write code — shown enough to start, practiced enough to remember.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets data-theme/data-skin before first paint so no palette flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="bl-scroll min-h-dvh">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
          >
            Skip to content
          </a>
          {children}
          <NarrowScreenNotice />
        </ThemeProvider>
      </body>
    </html>
  );
}
