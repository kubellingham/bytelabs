import type { ScenarioInput } from '@/lib/content/schema';

/**
 * Ground scenarios.
 *
 * Each is authored once as a skill spec, a set of requirements, and a brief with
 * `{{placeholders}}`. Variants swap the client, the industry and the copy; the
 * requirements array is literally the same array for every variant, so no amount of
 * brief variety can drift the standard. That is what makes a library that feels
 * unbounded affordable to author.
 */

const PROFILE_CARD: ScenarioInput = {
  id: 'ground-profile-card',
  slug: 'profile-card',
  title: 'A profile card',
  tier: 'beginner',
  trackId: 'html-css',
  skills: ['semantics', 'text', 'media', 'selectors', 'boxmodel'],
  concepts: [
    'semantic-article',
    'heading-outline',
    'img-alt',
    'class-selectors',
    'box-model',
    'link-href',
  ],
  estimatedMinutes: 20,
  brief: [
    {
      kind: 'p',
      text: '{{clientName}} is a {{profession}} putting together a small personal site. They want a profile card for the top of the homepage — the sort of thing that introduces them in one glance.',
    },
    { kind: 'heading', text: 'What they want on it' },
    {
      kind: 'list',
      items: [
        'Their name, as the card’s heading',
        'A one-line description of what they do',
        'A photo of them',
        'A link to get in touch',
      ],
    },
    {
      kind: 'p',
      text: 'Keep it self-contained — this card will eventually get lifted onto other pages, so it should make sense on its own.',
    },
    {
      kind: 'note',
      text: 'There is no image file here, so point the src at any URL you like. What matters is that the alt text describes the person, not the file.',
    },
  ],
  variants: [
    {
      id: 'photographer',
      label: 'Freelance photographer',
      values: {
        clientName: 'Nadia Okonkwo',
        profession: 'freelance photographer',
        tagline: 'Documentary and portrait work, mostly in Manchester.',
        accent: '#2f5d50',
      },
    },
    {
      id: 'illustrator',
      label: 'Illustrator',
      values: {
        clientName: 'Tomás Reyes',
        profession: 'children’s book illustrator',
        tagline: 'Ink and gouache. Twelve books and counting.',
        accent: '#8a4a2b',
      },
    },
    {
      id: 'luthier',
      label: 'Instrument maker',
      values: {
        clientName: 'Ffion Pritchard',
        profession: 'violin maker and restorer',
        tagline: 'Building and repairing stringed instruments since 2009.',
        accent: '#5a3f7a',
      },
    },
    {
      id: 'chef',
      label: 'Private chef',
      values: {
        clientName: 'Marcus Bell',
        profession: 'private chef',
        tagline: 'Seasonal menus for small gatherings.',
        accent: '#7a2f3e',
      },
    },
  ],
  requirements: [
    {
      id: 'r1',
      label: 'The card is an article — it makes sense lifted out of the page',
      concepts: ['semantic-article'],
      checks: [{ kind: 'element', selector: 'article' }],
    },
    {
      id: 'r2',
      label: 'Their name is the card’s heading',
      concepts: ['heading-outline'],
      checks: [{ kind: 'text', selector: 'article h1, article h2', contains: '{{clientName}}' }],
    },
    {
      id: 'r3',
      label: 'A one-line description of what they do',
      concepts: ['paragraphs'],
      checks: [{ kind: 'text', selector: 'article p', nonEmpty: true }],
    },
    {
      id: 'r4',
      label: 'A photo, with alt text describing the person',
      concepts: ['img-alt'],
      checks: [
        { kind: 'element', selector: 'article img' },
        {
          kind: 'attribute',
          selector: 'article img',
          attribute: 'alt',
          nonEmpty: true,
          everyMatch: true,
        },
      ],
    },
    {
      id: 'r5',
      label: 'A link to get in touch',
      concepts: ['link-href'],
      checks: [
        { kind: 'attribute', selector: 'article a', attribute: 'href', nonEmpty: true },
      ],
    },
    {
      id: 'r6',
      label: 'The card is styled from your stylesheet, with padding of its own',
      concepts: ['class-selectors', 'box-model'],
      checks: [
        { kind: 'computedStyle', selector: 'article', property: 'padding-top', minNumber: 8 },
      ],
    },
  ],
  starterFiles: {
    'index.html':
      '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>{{clientName}}</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <main>\n      <!-- The card goes here. -->\n    </main>\n  </body>\n</html>\n',
    'styles.css': 'body {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  margin: 2rem;\n}\n',
  },
  /**
   * Assisted Mode's worked example. It solves the brief for whichever client the
   * learner was given, then fades to ghost so they write it themselves — and on a
   * second variant the brief is different enough that it is not muscle memory of
   * one page, but of the shape of a card.
   */
  walkthrough: [
    {
      id: 'w1',
      note: 'The card should make sense lifted onto another page, so it is an article rather than a div.',
      concepts: ['semantic-article'],
      edits: [
        {
          file: 'index.html',
          replace: '      <!-- The card goes here. -->\n',
          text: '      <article class="card">\n      </article>\n',
        },
      ],
      holdMs: 400,
    },
    {
      id: 'w2',
      note: 'Their name is what the card is about, so it is the heading — not a styled paragraph.',
      concepts: ['heading-outline'],
      edits: [
        {
          file: 'index.html',
          after: '      <article class="card">\n',
          text: '        <h1>{{clientName}}</h1>\n',
        },
      ],
    },
    {
      id: 'w3',
      note: 'The photo. The alt text describes the person, because that is what someone who cannot see it needs — not the filename.',
      concepts: ['img-alt', 'img-sizing'],
      edits: [
        {
          file: 'index.html',
          after: '        <h1>{{clientName}}</h1>\n',
          text: '        <img class="card__photo" src="https://placehold.co/240x240" alt="{{clientName}}, {{profession}}" width="240" height="240">\n',
        },
      ],
      holdMs: 300,
    },
    {
      id: 'w4',
      note: 'One line on what they do, and a way to reach them. Link text that means something on its own.',
      concepts: ['paragraphs', 'link-href', 'link-text'],
      edits: [
        {
          file: 'index.html',
          after: '" width="240" height="240">\n',
          text: '        <p>{{tagline}}</p>\n        <a href="mailto:hello@example.com">Email {{clientName}}</a>\n',
        },
      ],
    },
    {
      id: 'w5',
      note: 'Now the styling. A class selector, and padding so the card has room to breathe.',
      concepts: ['class-selectors', 'box-model'],
      edits: [
        {
          file: 'styles.css',
          text: '\n.card {\n  max-inline-size: 22rem;\n  padding: 1.5rem;\n  border: 1px solid #e4e4e9;\n  border-radius: 0.75rem;\n}\n',
        },
      ],
      holdMs: 300,
    },
    {
      id: 'w6',
      note: 'And the photo. aspect-ratio keeps its shape whatever the source image is, which stops the layout jumping as it loads.',
      concepts: ['img-sizing', 'declarations'],
      edits: [
        {
          file: 'styles.css',
          text: '\n.card__photo {\n  inline-size: 100%;\n  block-size: auto;\n  aspect-ratio: 1;\n  object-fit: cover;\n  border-radius: 0.5rem;\n}\n',
        },
      ],
    },
  ],
};

const CONTACT_FORM: ScenarioInput = {
  id: 'ground-contact-form',
  slug: 'contact-form',
  title: 'A contact form that works for everyone',
  tier: 'intermediate',
  trackId: 'html-css',
  skills: ['forms', 'a11y', 'semantics', 'selectors'],
  concepts: [
    'form-element',
    'label-association',
    'input-types',
    'native-validation',
    'focus-visible',
    'contrast',
  ],
  estimatedMinutes: 35,
  brief: [
    {
      kind: 'p',
      text: '{{clientName}} needs a contact form on their site. Their last one was built by somebody’s nephew and the practice manager cannot use it with a screen reader, so this time they have asked specifically that it work properly for everyone.',
    },
    { kind: 'heading', text: 'What the form needs to collect' },
    {
      kind: 'list',
      items: [
        'Full name',
        'Email address',
        '{{thirdField}}',
        'A message',
      ],
    },
    { kind: 'heading', text: 'What they were explicit about' },
    {
      kind: 'list',
      items: [
        'Every field must have a visible label that is genuinely associated with its input',
        'The browser should catch an empty required field before submitting',
        'The email field should bring up an email keyboard on a phone',
        'You must be able to see where you are when tabbing through with a keyboard',
      ],
    },
    {
      kind: 'note',
      text: 'Placeholder text is not a label. It disappears the moment someone types, and a screen reader may not announce it at all.',
    },
  ],
  variants: [
    {
      id: 'dental',
      label: 'Dental practice',
      values: {
        clientName: 'Marlow Dental Practice',
        industry: 'dental practice',
        thirdField: 'Phone number',
        subject: 'appointment enquiry',
      },
    },
    {
      id: 'vet',
      label: 'Veterinary surgery',
      values: {
        clientName: 'Brackendale Veterinary Surgery',
        industry: 'veterinary surgery',
        thirdField: 'Phone number',
        subject: 'appointment enquiry',
      },
    },
    {
      id: 'garage',
      label: 'Garage',
      values: {
        clientName: 'Halworth Motors',
        industry: 'garage',
        thirdField: 'Vehicle registration',
        subject: 'service booking',
      },
    },
    {
      id: 'studio',
      label: 'Yoga studio',
      values: {
        clientName: 'Still Point Studio',
        industry: 'yoga studio',
        thirdField: 'Phone number',
        subject: 'class enquiry',
      },
    },
  ],
  requirements: [
    {
      id: 'r1',
      label: 'A form element wrapping the fields',
      concepts: ['form-element'],
      checks: [{ kind: 'element', selector: 'form' }],
    },
    {
      id: 'r2',
      label: 'Four fields: name, email, {{thirdField}}, and a message',
      concepts: ['input-types'],
      checks: [
        { kind: 'element', selector: 'form input', min: 3 },
        { kind: 'element', selector: 'form textarea', min: 1 },
      ],
    },
    {
      id: 'r3',
      label: 'Every input and textarea has a label associated with it',
      concepts: ['label-association'],
      checks: [{ kind: 'labelledControl', selector: 'form input, form textarea' }],
    },
    {
      id: 'r4',
      label: 'The email field uses type="email"',
      concepts: ['input-types'],
      checks: [{ kind: 'element', selector: 'form input[type="email"]' }],
    },
    {
      id: 'r5',
      label: 'Required fields are marked required, so the browser catches them',
      concepts: ['native-validation'],
      checks: [{ kind: 'element', selector: 'form [required]', min: 3 }],
    },
    {
      id: 'r6',
      label: 'A submit button',
      concepts: ['form-element'],
      checks: [
        { kind: 'element', selector: 'form button, form input[type="submit"]' },
      ],
    },
    {
      id: 'r7',
      label: 'A visible focus style, so keyboard users can see where they are',
      concepts: ['focus-visible'],
      checks: [{ kind: 'focusIndicator', selector: 'form input' }],
    },
    {
      id: 'r8',
      label: 'The form does not overflow a narrow screen',
      concepts: ['no-fixed-widths'],
      checks: [{ kind: 'noOverflow', atWidth: 360 }],
    },
  ],
  starterFiles: {
    'index.html':
      '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Contact {{clientName}}</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <main>\n      <h1>Contact {{clientName}}</h1>\n      <!-- Build the form here. -->\n    </main>\n  </body>\n</html>\n',
    'styles.css':
      'body {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  margin: 2rem;\n}\n\n/* A visible focus style is part of the brief, not a nicety. */\n',
  },
};

const LANDING_PAGE: ScenarioInput = {
  id: 'ground-landing-page',
  slug: 'landing-page',
  title: 'A landing page, start to finish',
  tier: 'elite',
  trackId: 'html-css',
  skills: ['semantics', 'grid', 'flexbox', 'responsive', 'forms', 'a11y', 'typography'],
  concepts: [
    'semantic-header',
    'semantic-nav',
    'semantic-main',
    'semantic-footer',
    'grid-tracks',
    'auto-fit-grid',
    'no-fixed-widths',
    'label-association',
    'heading-outline',
    'custom-properties',
  ],
  estimatedMinutes: 90,
  brief: [
    {
      kind: 'p',
      text: '{{clientName}} is a {{industry}} operating across {{region}}. They have no website at all — everything comes through word of mouth — and they want a single page that explains what they do and gives people a way to get in touch.',
    },
    { kind: 'heading', text: 'The brief' },
    {
      kind: 'list',
      items: [
        'A navigation bar linking to the sections of the page',
        'A hero section with a clear headline and a call to action',
        'A services grid — {{serviceCount}} services, each with a name and a short description',
        'A contact form',
        'A footer with their address',
      ],
    },
    { kind: 'heading', text: 'Non-negotiables' },
    {
      kind: 'list',
      items: [
        'It has to work from a 320px phone to a wide desktop, with no horizontal scrolling at any width',
        'No fixed pixel widths on layout containers',
        'Correct heading outline — they have been told this matters for search',
        'The form fields must be properly labelled',
      ],
    },
    {
      kind: 'p',
      text: 'This is the full job. Take your time with it — there is no ghost text and no hints here.',
    },
  ],
  variants: [
    {
      id: 'logistics',
      label: 'Logistics company',
      values: {
        clientName: 'Aldergate Logistics',
        industry: 'family-run logistics company',
        region: 'the North West',
        serviceCount: 'four',
        heroLine: 'Freight that turns up when we said it would.',
      },
    },
    {
      id: 'roofing',
      label: 'Roofing contractor',
      values: {
        clientName: 'Kestrel Roofing',
        industry: 'roofing contractor',
        region: 'Devon and Cornwall',
        serviceCount: 'four',
        heroLine: 'Roofs that outlast the guarantee.',
      },
    },
    {
      id: 'accountants',
      label: 'Accountancy practice',
      values: {
        clientName: 'Whitlow & Pike',
        industry: 'accountancy practice',
        region: 'the Midlands',
        serviceCount: 'four',
        heroLine: 'Straight answers about your numbers.',
      },
    },
    {
      id: 'landscaping',
      label: 'Landscaping firm',
      values: {
        clientName: 'Sorrel & Stone',
        industry: 'landscaping and groundworks firm',
        region: 'East Anglia',
        serviceCount: 'four',
        heroLine: 'Gardens built to be walked on.',
      },
    },
  ],
  requirements: [
    {
      id: 'r1',
      label: 'Page landmarks: header, nav, main and footer',
      concepts: ['semantic-header', 'semantic-nav', 'semantic-main', 'semantic-footer'],
      checks: [
        { kind: 'element', selector: 'header' },
        { kind: 'element', selector: 'nav' },
        { kind: 'element', selector: 'main', min: 1, max: 1 },
        { kind: 'element', selector: 'footer' },
      ],
    },
    {
      id: 'r2',
      label: 'Navigation links to sections of the page',
      concepts: ['nav-is-a-list', 'link-href'],
      checks: [
        { kind: 'element', selector: 'nav a[href^="#"]', min: 2 },
      ],
    },
    {
      id: 'r3',
      label: 'A hero section with a headline and a call to action',
      concepts: ['heading-outline'],
      checks: [
        { kind: 'element', selector: 'main h1' },
        { kind: 'element', selector: 'main a[href], main button', min: 1 },
      ],
    },
    {
      id: 'r4',
      label: 'A services grid with four services, each named and described',
      concepts: ['grid-tracks', 'semantic-article'],
      checks: [
        { kind: 'element', selector: 'main article, main li.service', min: 4 },
      ],
    },
    {
      id: 'r5',
      label: 'The services are laid out with grid or flexbox, not stacked by default',
      concepts: ['grid-tracks', 'flex-container'],
      mode: 'any',
      checks: [
        {
          kind: 'computedStyle',
          selector: '[class*="service"]',
          property: 'display',
          contains: 'grid',
          atWidth: 1200,
        },
        {
          kind: 'computedStyle',
          selector: '[class*="service"]',
          property: 'display',
          contains: 'flex',
          atWidth: 1200,
        },
      ],
    },
    {
      id: 'r6',
      label: 'A contact form with properly labelled fields',
      concepts: ['form-element', 'label-association'],
      checks: [
        { kind: 'element', selector: 'form' },
        { kind: 'labelledControl', selector: 'form input, form textarea' },
      ],
    },
    {
      id: 'r7',
      label: 'One h1, and no heading level skipped',
      concepts: ['heading-outline'],
      checks: [{ kind: 'headingOutline', singleH1: true }],
    },
    {
      id: 'r8',
      label: 'No horizontal scrolling at 320px',
      concepts: ['no-fixed-widths', 'intrinsic-sizing'],
      checks: [{ kind: 'noOverflow', atWidth: 320 }],
    },
    {
      id: 'r9',
      label: 'No horizontal scrolling at 768px',
      concepts: ['no-fixed-widths', 'intrinsic-sizing'],
      checks: [{ kind: 'noOverflow', atWidth: 768 }],
    },
    {
      id: 'r10',
      label: 'The footer carries their address',
      concepts: ['semantic-footer'],
      checks: [{ kind: 'text', selector: 'footer', nonEmpty: true }],
    },
  ],
  starterFiles: {
    'index.html':
      '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>{{clientName}}</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n  </body>\n</html>\n',
    'styles.css': '/* Yours from here. */\n',
  },
};

export const SCENARIOS: readonly ScenarioInput[] = [PROFILE_CARD, CONTACT_FORM, LANDING_PAGE];
