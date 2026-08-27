import { describe, expect, it } from 'vitest';

import { allLessons, GROUND_SCENARIOS, TRACKS } from '@/content';
import { parseInline } from '@/lib/content/inline';
import type { Prose } from '@/lib/content/schema';

describe('parseInline', () => {
  it('leaves plain text alone', () => {
    expect(parseInline('just words')).toEqual([{ kind: 'text', text: 'just words' }]);
  });

  it('reads code spans', () => {
    expect(parseInline('use `<main>` once')).toEqual([
      { kind: 'text', text: 'use ' },
      { kind: 'code', text: '<main>' },
      { kind: 'text', text: ' once' },
    ]);
  });

  it('reads bold', () => {
    expect(parseInline('this is **important**')).toEqual([
      { kind: 'text', text: 'this is ' },
      { kind: 'strong', text: 'important' },
    ]);
  });

  it('reads italics, which used to leak through as literal asterisks', () => {
    expect(parseInline('information *about* the page')).toEqual([
      { kind: 'text', text: 'information ' },
      { kind: 'em', text: 'about' },
      { kind: 'text', text: ' the page' },
    ]);
  });

  it('does not let the italic rule claim a bold run', () => {
    expect(parseInline('**both** and *one*')).toEqual([
      { kind: 'strong', text: 'both' },
      { kind: 'text', text: ' and ' },
      { kind: 'em', text: 'one' },
    ]);
  });

  it('ignores a lone asterisk and multiplication', () => {
    expect(parseInline('2 * 3 is six')).toEqual([{ kind: 'text', text: '2 * 3 is six' }]);
  });

  it('keeps asterisks inside a code span intact', () => {
    expect(parseInline('the `*` selector')).toEqual([
      { kind: 'text', text: 'the ' },
      { kind: 'code', text: '*' },
      { kind: 'text', text: ' selector' },
    ]);
  });
});

describe('authored prose', () => {
  function proseOf(): { where: string; blocks: readonly Prose[] }[] {
    const out: { where: string; blocks: readonly Prose[] }[] = [];

    for (const { lesson, chapter } of allLessons()) {
      for (const step of lesson.steps) {
        if (step.kind === 'explain') out.push({ where: `${chapter.slug}/${lesson.slug}`, blocks: step.body });
      }
    }
    for (const track of TRACKS) {
      for (const unit of track.units) {
        if (unit.graduation) out.push({ where: unit.graduation.id, blocks: unit.graduation.brief });
      }
    }
    for (const scenario of GROUND_SCENARIOS) out.push({ where: scenario.id, blocks: scenario.brief });

    return out;
  }

  it('renders every piece of markup it contains', () => {
    const leaking: string[] = [];

    const check = (where: string, text: string) => {
      for (const token of parseInline(text)) {
        // A stray backtick or asterisk left in plain text means the author wrote
        // markup the renderer does not understand, and the learner sees the
        // punctuation. That is invisible in review and obvious on screen.
        if (token.kind === 'text' && /[`*]/.test(token.text)) {
          leaking.push(`${where}: ${text.slice(0, 70)}`);
        }
      }
    };

    for (const { where, blocks } of proseOf()) {
      for (const block of blocks) {
        if (block.kind === 'p' || block.kind === 'heading' || block.kind === 'note') {
          check(where, block.text);
        }
        if (block.kind === 'list') for (const item of block.items) check(where, item);
      }
    }

    expect(leaking).toEqual([]);
  });
});
