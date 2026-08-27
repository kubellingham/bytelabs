import type { TrackInput, UnitInput } from '@/lib/content/schema';

import { CHAPTER_1, CHAPTER_2 } from './unit-1-chapters-1-2';
import { CHAPTER_3, CHAPTER_4 } from './unit-1-chapters-3-4';
import { CHAPTER_5, CHAPTER_6 } from './unit-1-chapters-5-6';
import { LATER_UNITS } from './units';

/**
 * UnitInput 1's graduation.
 *
 * It is presented as a client brief, not a test. There is no ghost text, no
 * assistant, and no score — only requirements that are not ticked yet. Everything
 * it asks for was taught in the six chapters above.
 */
const UNIT_1: UnitInput = {
  id: 'htmlcss-u1',
  slug: 'the-document',
  title: 'The Document',
  intent:
    'What a page actually is, and the habit of saying what you mean. Semantics and DevTools from the first chapter, because the habits formed here are the ones that stick.',
  status: 'available',
  chapters: [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5, CHAPTER_6],
  graduation: {
    id: 'htmlcss-u1-grad',
    title: 'Fernbank Studio',
    brief: [
      {
        kind: 'p',
        text: 'Fernbank Studio is a two-person ceramics workshop. They have written their content and want the page structured properly before a designer touches it. No styling is needed beyond linking the stylesheet — this is about structure.',
      },
      { kind: 'heading', text: 'What they sent' },
      {
        kind: 'list',
        items: [
          'Studio name: Fernbank Studio',
          'Navigation: Home, Work, Classes, Contact',
          'Page heading: Hand-thrown stoneware, made in Peckham',
          'Two things they make: Tableware, and Vases — each with a short description',
          'A note about their winter classes, which is related but not part of the main content',
          'Footer: 3 Fernbank Mews, London. Open Thursday to Sunday.',
        ],
      },
      {
        kind: 'p',
        text: 'Build the document. Correct outline, correct landmarks, correct element for each piece of content.',
      },
    ],
    starterFiles: {
      'index.html': '',
      'styles.css': '/* Linked, but styling is not what this brief is about. */\n',
    },
    requirements: [
      {
        id: 'g1',
        label: 'The document declares its language',
        concepts: ['html-lang'],
        checks: [{ kind: 'attribute', selector: 'html', attribute: 'lang', nonEmpty: true }],
      },
      {
        id: 'g2',
        label: 'Character encoding and viewport are both set',
        concepts: ['charset', 'viewport-meta'],
        checks: [
          { kind: 'attribute', selector: 'meta[charset]', attribute: 'charset', nonEmpty: true },
          {
            kind: 'attribute',
            selector: 'meta[name="viewport"]',
            attribute: 'content',
            contains: 'width=device-width',
          },
        ],
      },
      {
        id: 'g3',
        label: 'The page has a title',
        concepts: ['page-title'],
        checks: [{ kind: 'text', selector: 'title', nonEmpty: true }],
      },
      {
        id: 'g4',
        label: 'A stylesheet is linked',
        concepts: ['link-stylesheet'],
        checks: [
          { kind: 'attribute', selector: 'link[rel="stylesheet"]', attribute: 'href', nonEmpty: true },
        ],
      },
      {
        id: 'g5',
        label: 'The four landmarks are present: header, nav, main, footer',
        concepts: ['semantic-header', 'semantic-nav', 'semantic-main', 'semantic-footer'],
        checks: [
          { kind: 'element', selector: 'header' },
          { kind: 'element', selector: 'nav' },
          { kind: 'element', selector: 'main', min: 1, max: 1 },
          { kind: 'element', selector: 'footer' },
        ],
      },
      {
        id: 'g6',
        label: 'Navigation is a list of four links',
        concepts: ['nav-is-a-list', 'link-href'],
        checks: [{ kind: 'element', selector: 'nav ul li a', min: 4 }],
      },
      {
        id: 'g7',
        label: 'One h1, and no heading level is skipped',
        concepts: ['heading-outline'],
        checks: [{ kind: 'headingOutline', singleH1: true }],
      },
      {
        id: 'g8',
        label: 'The two things they make are marked up as articles',
        concepts: ['semantic-article'],
        checks: [{ kind: 'element', selector: 'main article', min: 2 }],
      },
      {
        id: 'g9',
        label: 'Each article has its own heading',
        concepts: ['heading-outline', 'semantic-article'],
        checks: [{ kind: 'element', selector: 'article h3, article h2', min: 2 }],
      },
      {
        id: 'g10',
        label: 'The classes note is an aside — related, but not the main content',
        concepts: ['semantic-aside'],
        checks: [{ kind: 'element', selector: 'aside' }],
      },
      {
        id: 'g11',
        label: 'The footer carries the address',
        concepts: ['semantic-footer'],
        checks: [{ kind: 'text', selector: 'footer', contains: 'Fernbank Mews' }],
      },
    ],
  },
};

export const HTML_CSS_TRACK: TrackInput = {
  id: 'html-css',
  slug: 'html-css',
  title: 'HTML & CSS',
  subtitle: 'The entry point. Structure and appearance, taught as one thing.',
  language: 'html-css',
  promise:
    'You can build a real, accessible, responsive webpage from scratch — without copying anything.',
  status: 'available',
  units: [UNIT_1, ...LATER_UNITS],
};
