import Link from 'next/link';

import { CourseHome } from '@/components/course/CourseHome';
import { Page } from '@/components/shell/Page';

export const metadata = {
  title: 'The Course',
  description: 'Curriculum built by ByteLabs. Structure, then style, then logic.',
};

export default function CoursePage() {
  return (
    <Page>
      <p className="font-mono text-[11px] tracking-[0.2em] text-subtle uppercase">The Course</p>
      <h1 className="mt-2 text-[length:var(--bl-step-4)] font-semibold text-ink">
        Pick a language and start writing it.
      </h1>
      <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">
        Every lesson is written by ByteLabs — shown to you first, then typed by you, then built
        from a brief with no help at all.
      </p>

      <div className="mt-12">
        <CourseHome />
      </div>

      <p className="mt-14 text-sm text-subtle">
        Want to build something instead of being taught?{' '}
        <Link href="/ground" className="text-accent hover:underline">
          The Ground
        </Link>{' '}
        has no lessons and nothing to fail.
      </p>
    </Page>
  );
}
