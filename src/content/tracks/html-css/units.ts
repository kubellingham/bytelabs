import type { ChapterInput, UnitInput } from '@/lib/content/schema';

/**
 * The HTML & CSS unit tree.
 *
 * Ordering is deliberate and documented in docs/curriculum/html-css.md — semantics
 * and DevTools in UnitInput 1, the cascade in UnitInput 3, responsive as a unit of its own,
 * accessibility woven throughout rather than appended at the end.
 *
 * UnitInput 1's lessons are authored; later units ship as visible roadmap.
 */

function chapter(
  id: string,
  slug: string,
  title: string,
  summary: string,
): ChapterInput {
  return { id, slug, title, summary, status: 'planned', lessons: [] };
}

export const UNIT_2: UnitInput = {
  id: 'htmlcss-u2',
  slug: 'content-and-meaning',
  title: 'Content and Meaning',
  intent: 'Everything a page can hold, said correctly.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u2-c1', 'lists', 'Lists', 'Ordered, unordered and description lists — and recognising that navigation is one.'),
    chapter('htmlcss-u2-c2', 'links', 'Links', 'Absolute, relative and in-page. Link text that means something out of context.'),
    chapter('htmlcss-u2-c3', 'images', 'Images', 'Alt text as content, dimensions that prevent layout shift, lazy loading.'),
    chapter('htmlcss-u2-c4', 'tables', 'Tables', 'Tabular data done properly — headers, scope, caption. And why tables are not a layout tool.'),
    chapter('htmlcss-u2-c5', 'form-controls', 'Forms — the controls', 'Inputs, labels, and why label association is non-negotiable.'),
    chapter('htmlcss-u2-c6', 'form-validation', 'Forms — asking correctly', 'Required fields, input types, native validation, and errors a person can act on.'),
  ],
};

export const UNIT_3: UnitInput = {
  id: 'htmlcss-u3',
  slug: 'styling-and-the-cascade',
  title: 'Styling and the Cascade',
  intent: 'Why CSS does what it does — the unit that stops it being a guessing game.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u3-c1', 'selectors', 'Selectors', 'Element, class, attribute, combinators — and why a class is nearly always the right answer.'),
    chapter('htmlcss-u3-c2', 'cascade', 'The cascade and specificity', 'Origin, layer, specificity, source order. Reading a conflict instead of guessing at it.'),
    chapter('htmlcss-u3-c3', 'box-model', 'The box model', 'Content, padding, border, margin, box-sizing — and margin collapse explained.'),
    chapter('htmlcss-u3-c4', 'colour', 'Colour', 'Hex, rgb, hsl and oklch, with contrast treated as a requirement.'),
    chapter('htmlcss-u3-c5', 'typography', 'Typography', 'Font stacks, a type scale, line height, and measure as a readability decision.'),
    chapter('htmlcss-u3-c6', 'custom-properties', 'Custom properties', 'Your first design tokens — defining, scoping and falling back.'),
  ],
};

export const UNIT_4: UnitInput = {
  id: 'htmlcss-u4',
  slug: 'layout',
  title: 'Layout',
  intent: 'Putting things where you meant them to go.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u4-c1', 'normal-flow', 'Normal flow', 'What the browser lays out before you touch anything.'),
    chapter('htmlcss-u4-c2', 'flexbox', 'Flexbox', 'The one-dimensional model — axes, alignment, distribution, wrapping.'),
    chapter('htmlcss-u4-c3', 'grid', 'Grid', 'The two-dimensional model — tracks, fr, minmax, named areas.'),
    chapter('htmlcss-u4-c4', 'sizing', 'Sizing', 'min, max, clamp and intrinsic sizing. Why a fixed width is a bug in waiting.'),
    chapter('htmlcss-u4-c5', 'spacing', 'Spacing', 'Gap, a spacing scale, and rhythm as a design decision.'),
    chapter('htmlcss-u4-c6', 'positioning', 'Positioning and stacking', 'Relative, absolute, sticky, fixed — and z-index as a stacking context.'),
  ],
};

export const UNIT_5: UnitInput = {
  id: 'htmlcss-u5',
  slug: 'responsive-and-adaptive',
  title: 'Responsive and Adaptive',
  intent: 'One page, every screen, and every person’s settings.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u5-c1', 'fluid-by-default', 'Responsive by default', 'How far fluid type and intrinsic sizing get you before a media query is needed.'),
    chapter('htmlcss-u5-c2', 'media-queries', 'Media queries', 'Breakpoints chosen from where your content breaks, not from a list of devices.'),
    chapter('htmlcss-u5-c3', 'container-queries', 'Container queries', 'Components that respond to their container instead of the viewport.'),
    chapter('htmlcss-u5-c4', 'logical-properties', 'Logical properties', 'Inline and block instead of left and right, and why that is the right default.'),
    chapter('htmlcss-u5-c5', 'preference-queries', 'User preference queries', 'Colour scheme, reduced motion, contrast — respecting a deliberate choice.'),
    chapter('htmlcss-u5-c6', 'responsive-images', 'Responsive images', 'srcset, sizes, picture, and art direction.'),
  ],
};

export const UNIT_6: UnitInput = {
  id: 'htmlcss-u6',
  slug: 'interface-craft',
  title: 'Interface Craft',
  intent: 'Making it feel like somebody built it on purpose.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u6-c1', 'pseudo-classes', 'Pseudo-classes', 'hover, focus-visible, active, disabled, nth-child, not, has.'),
    chapter('htmlcss-u6-c2', 'pseudo-elements', 'Pseudo-elements', 'before, after, marker, selection — and why generated content is never real content.'),
    chapter('htmlcss-u6-c3', 'states', 'States', 'Hover, focus, active, disabled, loading, empty, error. Where “it works” becomes “it’s finished”.'),
    chapter('htmlcss-u6-c4', 'transitions', 'Transitions', 'Timing, easing, what is cheap to animate, and honouring reduced motion.'),
    chapter('htmlcss-u6-c5', 'keyframes', 'Keyframe animations', 'Building a sequence, and restraint.'),
    chapter('htmlcss-u6-c6', 'theming', 'Theming with custom properties', 'Light, dark and alternate skins — the system ByteLabs itself runs on.'),
  ],
};

export const UNIT_7: UnitInput = {
  id: 'htmlcss-u7',
  slug: 'accessible-findable-fast',
  title: 'Accessible, Findable, Fast',
  intent: 'The three things that separate a page from a professional page.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u7-c1', 'accessibility-tree', 'Beyond semantics', 'The accessibility tree, roles and names — and the first rule of ARIA.'),
    chapter('htmlcss-u7-c2', 'keyboard', 'Keyboard and focus', 'Tab order, focus traps, skip links, and managing focus when content changes.'),
    chapter('htmlcss-u7-c3', 'screen-readers', 'Hearing your own page', 'Using a screen reader well enough to test your own work.'),
    chapter('htmlcss-u7-c4', 'visual-a11y', 'Visual accessibility', 'Contrast, target size, zoom to 200%, motion safety.'),
    chapter('htmlcss-u7-c5', 'seo', 'SEO through markup', 'Title, description, outline, canonical, Open Graph, structured data.'),
    chapter('htmlcss-u7-c6', 'performance', 'Performance', 'Image formats, layout shift, render-blocking CSS, and measuring rather than guessing.'),
  ],
};

export const UNIT_8: UnitInput = {
  id: 'htmlcss-u8',
  slug: 'real-world',
  title: 'Real World',
  intent: 'Everything, at once, for a client.',
  status: 'planned',
  graduation: null,
  chapters: [
    chapter('htmlcss-u8-c1', 'multi-page', 'Multi-page architecture', 'Shared structure, consistent navigation, and the duplication problem.'),
    chapter('htmlcss-u8-c2', 'css-architecture', 'CSS architecture', 'Cascade layers, naming, file organisation, and styles that survive a second author.'),
    chapter('htmlcss-u8-c3', 'source-of-truth', 'Reading the source of truth', 'MDN, the specification, caniuse, and DevTools as the final arbiter.'),
    chapter('htmlcss-u8-c4', 'progressive-enhancement', 'Progressive enhancement', '@supports, fallbacks, and degrading rather than breaking.'),
    chapter('htmlcss-u8-c5', 'shipping', 'Shipping', 'Validation, accessibility pass, performance pass, cross-browser check.'),
  ],
};

export const LATER_UNITS: readonly UnitInput[] = [
  UNIT_2,
  UNIT_3,
  UNIT_4,
  UNIT_5,
  UNIT_6,
  UNIT_7,
  UNIT_8,
];
