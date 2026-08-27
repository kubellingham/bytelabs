/**
 * The concept registry.
 *
 * Concepts are the atoms the mastery engine tracks, and they are deliberately
 * finer-grained than a chapter: ghost text fades per concept, so a learner who has
 * written twenty flexbox containers and three grids should see the flexbox
 * scaffolding go first. A chapter-level tag could never express that.
 *
 * Skills group concepts for routing — the skill map and the Ground's tags both read
 * this, and a future Studying Kube syllabus filter will too.
 */

export interface Skill {
  id: string;
  label: string;
  trackId: string;
}

export interface Concept {
  id: string;
  label: string;
  skillId: string;
}

export const SKILLS: readonly Skill[] = [
  { id: 'document', label: 'Document structure', trackId: 'html-css' },
  { id: 'semantics', label: 'Semantic HTML', trackId: 'html-css' },
  { id: 'text', label: 'Text and outline', trackId: 'html-css' },
  { id: 'media', label: 'Images and media', trackId: 'html-css' },
  { id: 'forms', label: 'Forms', trackId: 'html-css' },
  { id: 'tables', label: 'Tables', trackId: 'html-css' },
  { id: 'links', label: 'Links and navigation', trackId: 'html-css' },
  { id: 'selectors', label: 'Selectors and the cascade', trackId: 'html-css' },
  { id: 'boxmodel', label: 'The box model', trackId: 'html-css' },
  { id: 'colour', label: 'Colour and contrast', trackId: 'html-css' },
  { id: 'typography', label: 'Typography', trackId: 'html-css' },
  { id: 'tokens', label: 'Custom properties', trackId: 'html-css' },
  { id: 'flexbox', label: 'Flexbox', trackId: 'html-css' },
  { id: 'grid', label: 'Grid', trackId: 'html-css' },
  { id: 'sizing', label: 'Sizing and spacing', trackId: 'html-css' },
  { id: 'responsive', label: 'Responsive design', trackId: 'html-css' },
  { id: 'states', label: 'Interface states', trackId: 'html-css' },
  { id: 'motion', label: 'Transitions and motion', trackId: 'html-css' },
  { id: 'a11y', label: 'Accessibility', trackId: 'html-css' },
  { id: 'seo', label: 'SEO and metadata', trackId: 'html-css' },
  { id: 'performance', label: 'Performance', trackId: 'html-css' },
  { id: 'devtools', label: 'DevTools', trackId: 'html-css' },
  { id: 'architecture', label: 'CSS architecture', trackId: 'html-css' },
];

export const CONCEPTS: readonly Concept[] = [
  // Unit 1 — The Document
  { id: 'render-pipeline', label: 'How a browser builds a page', skillId: 'document' },
  { id: 'doctype', label: 'The doctype', skillId: 'document' },
  { id: 'html-lang', label: 'Declaring the document language', skillId: 'document' },
  { id: 'head-body', label: 'Head versus body', skillId: 'document' },
  { id: 'charset', label: 'Character encoding', skillId: 'document' },
  { id: 'viewport-meta', label: 'The viewport meta tag', skillId: 'document' },
  { id: 'page-title', label: 'The page title', skillId: 'seo' },

  { id: 'semantic-header', label: 'header', skillId: 'semantics' },
  { id: 'semantic-nav', label: 'nav', skillId: 'semantics' },
  { id: 'semantic-main', label: 'main', skillId: 'semantics' },
  { id: 'semantic-section', label: 'section', skillId: 'semantics' },
  { id: 'semantic-article', label: 'article', skillId: 'semantics' },
  { id: 'semantic-aside', label: 'aside', skillId: 'semantics' },
  { id: 'semantic-footer', label: 'footer', skillId: 'semantics' },
  { id: 'div-honestly', label: 'When div is the right answer', skillId: 'semantics' },

  { id: 'heading-outline', label: 'Headings as an outline', skillId: 'text' },
  { id: 'paragraphs', label: 'Paragraphs', skillId: 'text' },
  { id: 'emphasis-meaning', label: 'strong and em versus b and i', skillId: 'text' },

  { id: 'link-stylesheet', label: 'Linking a stylesheet', skillId: 'document' },
  { id: 'external-css', label: 'Why CSS lives in its own file', skillId: 'architecture' },
  { id: 'first-selectors', label: 'Writing a first selector', skillId: 'selectors' },
  { id: 'declarations', label: 'Property and value', skillId: 'selectors' },

  { id: 'devtools-inspect', label: 'Inspecting an element', skillId: 'devtools' },
  { id: 'devtools-computed', label: 'Reading computed styles', skillId: 'devtools' },
  { id: 'devtools-live-edit', label: 'Editing styles live', skillId: 'devtools' },

  // Unit 2 — Content and Meaning
  { id: 'lists', label: 'Ordered and unordered lists', skillId: 'text' },
  { id: 'nav-is-a-list', label: 'Navigation is a list', skillId: 'links' },
  { id: 'link-href', label: 'Link destinations', skillId: 'links' },
  { id: 'link-text', label: 'Link text that means something', skillId: 'a11y' },
  { id: 'img-alt', label: 'Alt text as content', skillId: 'a11y' },
  { id: 'img-sizing', label: 'Image dimensions and layout shift', skillId: 'media' },
  { id: 'table-structure', label: 'Table structure', skillId: 'tables' },
  { id: 'form-element', label: 'The form element', skillId: 'forms' },
  { id: 'label-association', label: 'Associating labels with controls', skillId: 'forms' },
  { id: 'input-types', label: 'Input types', skillId: 'forms' },
  { id: 'native-validation', label: 'Native validation', skillId: 'forms' },
  { id: 'fieldset-legend', label: 'Grouping with fieldset', skillId: 'forms' },

  // Unit 3 — Styling and the Cascade
  { id: 'class-selectors', label: 'Class selectors', skillId: 'selectors' },
  { id: 'combinators', label: 'Combinators', skillId: 'selectors' },
  { id: 'specificity', label: 'Specificity', skillId: 'selectors' },
  { id: 'cascade-order', label: 'The cascade', skillId: 'selectors' },
  { id: 'inheritance', label: 'Inheritance', skillId: 'selectors' },
  { id: 'box-model', label: 'The box model', skillId: 'boxmodel' },
  { id: 'box-sizing', label: 'box-sizing', skillId: 'boxmodel' },
  { id: 'colour-notation', label: 'Colour notation', skillId: 'colour' },
  { id: 'contrast', label: 'Contrast as a requirement', skillId: 'a11y' },
  { id: 'font-stacks', label: 'Font families and stacks', skillId: 'typography' },
  { id: 'type-scale', label: 'A type scale', skillId: 'typography' },
  { id: 'line-height', label: 'Line height and measure', skillId: 'typography' },
  { id: 'custom-properties', label: 'Custom properties', skillId: 'tokens' },

  // Unit 4 — Layout
  { id: 'normal-flow', label: 'Normal flow', skillId: 'boxmodel' },
  { id: 'display-types', label: 'Display types', skillId: 'boxmodel' },
  { id: 'flex-container', label: 'Flex containers', skillId: 'flexbox' },
  { id: 'flex-alignment', label: 'Flex alignment', skillId: 'flexbox' },
  { id: 'flex-items', label: 'Flex item sizing', skillId: 'flexbox' },
  { id: 'grid-tracks', label: 'Grid tracks', skillId: 'grid' },
  { id: 'grid-areas', label: 'Grid template areas', skillId: 'grid' },
  { id: 'intrinsic-sizing', label: 'Intrinsic sizing', skillId: 'sizing' },
  { id: 'clamp', label: 'clamp, min and max', skillId: 'sizing' },
  { id: 'gap-spacing', label: 'Gap and spacing rhythm', skillId: 'sizing' },
  { id: 'positioning', label: 'Positioning', skillId: 'boxmodel' },
  { id: 'stacking-context', label: 'Stacking contexts', skillId: 'boxmodel' },

  // Unit 5 — Responsive and Adaptive
  { id: 'fluid-type', label: 'Fluid typography', skillId: 'responsive' },
  { id: 'auto-fit-grid', label: 'Auto-fitting grids', skillId: 'responsive' },
  { id: 'media-queries', label: 'Media queries', skillId: 'responsive' },
  { id: 'content-breakpoints', label: 'Breakpoints from content', skillId: 'responsive' },
  { id: 'container-queries', label: 'Container queries', skillId: 'responsive' },
  { id: 'logical-properties', label: 'Logical properties', skillId: 'responsive' },
  { id: 'prefers-color-scheme', label: 'prefers-color-scheme', skillId: 'responsive' },
  { id: 'prefers-reduced-motion', label: 'prefers-reduced-motion', skillId: 'a11y' },
  { id: 'responsive-images', label: 'Responsive images', skillId: 'media' },
  { id: 'no-fixed-widths', label: 'Avoiding fixed widths', skillId: 'responsive' },

  // Unit 6 — Interface Craft
  { id: 'pseudo-hover', label: 'Hover states', skillId: 'states' },
  { id: 'focus-visible', label: 'focus-visible', skillId: 'a11y' },
  { id: 'pseudo-structural', label: 'Structural pseudo-classes', skillId: 'states' },
  { id: 'has-selector', label: 'The :has() selector', skillId: 'selectors' },
  { id: 'pseudo-elements', label: 'Pseudo-elements', skillId: 'states' },
  { id: 'state-coverage', label: 'Covering every state', skillId: 'states' },
  { id: 'transitions', label: 'Transitions', skillId: 'motion' },
  { id: 'keyframes', label: 'Keyframe animations', skillId: 'motion' },
  { id: 'theming', label: 'Theming with tokens', skillId: 'tokens' },

  // Unit 7 — Accessible, Findable, Fast
  { id: 'accessibility-tree', label: 'The accessibility tree', skillId: 'a11y' },
  { id: 'aria-when-not', label: 'When not to use ARIA', skillId: 'a11y' },
  { id: 'keyboard-order', label: 'Keyboard order and focus', skillId: 'a11y' },
  { id: 'skip-links', label: 'Skip links', skillId: 'a11y' },
  { id: 'screen-readers', label: 'Testing with a screen reader', skillId: 'a11y' },
  { id: 'meta-description', label: 'Meta description', skillId: 'seo' },
  { id: 'open-graph', label: 'Open Graph', skillId: 'seo' },
  { id: 'structured-data', label: 'Structured data', skillId: 'seo' },
  { id: 'image-optimisation', label: 'Image optimisation', skillId: 'performance' },
  { id: 'layout-shift', label: 'Cumulative layout shift', skillId: 'performance' },

  // Unit 8 — Real World
  { id: 'multi-page', label: 'Multi-page architecture', skillId: 'architecture' },
  { id: 'cascade-layers', label: 'Cascade layers', skillId: 'architecture' },
  { id: 'naming-conventions', label: 'Naming conventions', skillId: 'architecture' },
  { id: 'reading-mdn', label: 'Reading MDN and the spec', skillId: 'architecture' },
  { id: 'progressive-enhancement', label: 'Progressive enhancement', skillId: 'architecture' },
];

const conceptsById = new Map(CONCEPTS.map((concept) => [concept.id, concept]));
const skillsById = new Map(SKILLS.map((skill) => [skill.id, skill]));

export function getConcept(id: string): Concept | undefined {
  return conceptsById.get(id);
}

export function getSkill(id: string): Skill | undefined {
  return skillsById.get(id);
}

export function conceptsForSkill(skillId: string): Concept[] {
  return CONCEPTS.filter((concept) => concept.skillId === skillId);
}

/** Every concept id referenced by content must exist here; a test enforces it. */
export function isKnownConcept(id: string): boolean {
  return conceptsById.has(id);
}
