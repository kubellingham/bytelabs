import Link from 'next/link';

import { BriefPasteForm } from '@/components/brief/BriefPasteForm';
import { Page } from '@/components/shell/Page';

export const metadata = { title: 'The Brief · ByteLabs' };

export default function BriefLandingPage() {
  return (
    <Page>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          The Brief
        </p>
        <h1 className="mt-3 text-[length:var(--bl-step-3)] font-semibold text-ink">
          Paste what you were told.<br />Get the room to do it.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          Bring a syllabus, a practical sheet, three loose questions from your lecturer — any
          shape. ByteLabs turns it into a session: one task at a time, an editor, a runner, and a
          verdict that only says pass when it actually passes.
        </p>

        <BriefPasteForm />

        <p className="mt-8 text-sm text-subtle">
          The Course and{' '}
          <Link href="/ground" className="underline decoration-line hover:text-ink">
            The Ground
          </Link>{' '}
          are for material we authored. The Brief is for material you bring.
        </p>
      </div>
    </Page>
  );
}
