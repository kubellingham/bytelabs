import type { ChapterInput } from '@/lib/content/schema';

/** Unit 1, chapters 3-4. Semantics in Unit 1 is the whole point of the restructure. */

export const CHAPTER_3: ChapterInput = {
  id: 'htmlcss-u1-c3',
  slug: 'structure-that-means-something',
  title: 'Structure that means something',
  summary:
    'Choosing an element by what the content is, not by how you want it to look. The habit this chapter builds is the one you keep.',
  status: 'available',
  lessons: [
    {
      id: 'htmlcss-u1-c3-l1',
      slug: 'landmarks',
      title: 'Landmarks',
      summary: 'header, nav, main and footer — the four regions almost every page has.',
      estimatedMinutes: 9,
      concepts: ['semantic-header', 'semantic-nav', 'semantic-main', 'semantic-footer'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n  </head>\n  <body>\n  </body>\n</html>\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c3-l1-s1',
          title: 'The element you choose is a statement about meaning',
          concepts: ['semantic-header', 'semantic-main'],
          body: [
            {
              kind: 'p',
              text: 'You could build an entire website out of `<div>`. It would look identical. This is exactly why so many people do it, and exactly why so many websites are unusable for anyone not looking at a screen.',
            },
            {
              kind: 'p',
              text: 'A `<div>` says nothing. `<nav>` says *this is how you get around this site*. `<main>` says *this is the actual content, skip everything else to get here*. Those statements are read by screen readers, by search engines, by reading-mode, and by the next developer.',
            },
            {
              kind: 'p',
              text: 'Four landmarks cover most pages:',
            },
            {
              kind: 'list',
              items: [
                '`<header>` — introductory content for the page or a section. Usually the logo and site title.',
                '`<nav>` — a block of navigation links. Not every link, just the navigational ones.',
                '`<main>` — the unique content of *this* page. One per page, and never inside a header or footer.',
                '`<footer>` — closing content. Contact details, copyright, secondary links.',
              ],
            },
            {
              kind: 'note',
              text: 'A screen reader user can jump straight between landmarks. Build a page out of divs and you have taken that away without ever knowing you did.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c3-l1-s2',
          title: 'A page with real regions',
          beats: [
            {
              id: 'b1',
              note: 'The header comes first — who this is, at the top of the page.',
              concepts: ['semantic-header'],
              edits: [
                {
                  file: 'index.html',
                  after: '  <body>\n',
                  text: '    <header>\n      <h1>Ridgeway Bakery</h1>\n    </header>\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'Navigation goes inside the header here, because it belongs to the page as a whole.',
              concepts: ['semantic-nav', 'nav-is-a-list'],
              edits: [
                {
                  file: 'index.html',
                  after: '      <h1>Ridgeway Bakery</h1>\n',
                  text: '      <nav>\n        <ul>\n          <li><a href="/">Home</a></li>\n          <li><a href="/menu">Menu</a></li>\n          <li><a href="/visit">Visit</a></li>\n        </ul>\n      </nav>\n',
                },
              ],
              holdMs: 400,
            },
            {
              id: 'b3',
              note: 'Then main — the content unique to this page. Exactly one per page.',
              concepts: ['semantic-main'],
              edits: [
                {
                  file: 'index.html',
                  after: '    </header>\n',
                  text: '    <main>\n      <h2>Baked this morning</h2>\n      <p>Everything is made on site, starting at four.</p>\n    </main>\n',
                },
              ],
            },
            {
              id: 'b4',
              note: 'And the footer closes it out.',
              concepts: ['semantic-footer'],
              edits: [
                {
                  file: 'index.html',
                  after: '    </main>\n',
                  text: '    <footer>\n      <p>14 Ridgeway Road. Open 7am to 4pm.</p>\n    </footer>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c3-l1-s3',
          prompt: 'Build the four regions. Think about what each one is claiming as you type it.',
          files: ['index.html'],
          concepts: ['semantic-header', 'semantic-nav', 'semantic-main', 'semantic-footer'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c3-l1-s4',
          prompt: 'The page should have:',
          requirements: [
            {
              id: 'r1',
              label: 'A header region',
              concepts: ['semantic-header'],
              checks: [{ kind: 'element', selector: 'body header' }],
            },
            {
              id: 'r2',
              label: 'Navigation, marked up as a list of links',
              concepts: ['semantic-nav', 'nav-is-a-list'],
              checks: [
                { kind: 'element', selector: 'nav ul li a', min: 2 },
              ],
            },
            {
              id: 'r3',
              label: 'Exactly one main region',
              concepts: ['semantic-main'],
              checks: [{ kind: 'element', selector: 'main', min: 1, max: 1 }],
            },
            {
              id: 'r4',
              label: 'A footer region',
              concepts: ['semantic-footer'],
              checks: [{ kind: 'element', selector: 'body footer' }],
            },
          ],
        },
      ],
    },
    {
      id: 'htmlcss-u1-c3-l2',
      slug: 'sections-articles-and-div',
      title: 'Sections, articles, and when a div is right',
      summary: 'The three elements people get wrong most often, distinguished properly.',
      estimatedMinutes: 9,
      concepts: ['semantic-section', 'semantic-article', 'semantic-aside', 'div-honestly'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n  </head>\n  <body>\n    <main>\n    </main>\n  </body>\n</html>\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c3-l2-s1',
          title: 'One test tells them apart',
          concepts: ['semantic-article', 'semantic-section', 'div-honestly'],
          body: [
            {
              kind: 'p',
              text: 'These three get confused constantly, and one question separates them.',
            },
            {
              kind: 'p',
              text: '**`<article>`** — would this still make sense on its own, lifted out of the page entirely? A blog post, a product card, a comment, a news story. If you could syndicate it, it is an article.',
            },
            {
              kind: 'p',
              text: '**`<section>`** — is this a thematic grouping that would sensibly carry a heading? "Opening hours", "What we bake". A section almost always has a heading; if you cannot think of one, it is probably not a section.',
            },
            {
              kind: 'p',
              text: '**`<div>`** — you need a box to hang styling or layout on, and no element describes what is inside it. This is a completely legitimate use. A div is not a failure; reaching for it *first* is.',
            },
            {
              kind: 'p',
              text: 'And `<aside>` is for content related to the main content but not part of it — a pull quote, a related-links box, a sidebar.',
            },
            {
              kind: 'note',
              text: 'Rule of thumb: pick the most specific element that is true. If nothing is true, div.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c3-l2-s2',
          title: 'Choosing deliberately',
          beats: [
            {
              id: 'b1',
              note: 'A thematic grouping with a heading. That is a section.',
              concepts: ['semantic-section'],
              edits: [
                {
                  file: 'index.html',
                  after: '    <main>\n',
                  text: '      <section>\n        <h2>What we bake</h2>\n      </section>\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'Each of these would make sense on its own — lifted onto a menu, or into a search result. Articles.',
              concepts: ['semantic-article'],
              edits: [
                {
                  file: 'index.html',
                  after: '        <h2>What we bake</h2>\n',
                  text: '        <article>\n          <h3>Sourdough</h3>\n          <p>A three-day ferment. Out of the oven by seven.</p>\n        </article>\n        <article>\n          <h3>Almond croissants</h3>\n          <p>Made from yesterday’s croissants, which is the point.</p>\n        </article>\n',
                },
              ],
              holdMs: 400,
            },
            {
              id: 'b3',
              note: 'Related, but not part of the main content. An aside.',
              concepts: ['semantic-aside'],
              edits: [
                {
                  file: 'index.html',
                  after: '      </section>\n',
                  text: '      <aside>\n        <h2>Coming this winter</h2>\n        <p>Stollen orders open in November.</p>\n      </aside>\n',
                },
              ],
            },
            {
              id: 'b4',
              note: 'And here is a div, used honestly — a wrapper that exists only so the two articles can be laid out side by side later. Nothing about it is meaningful.',
              concepts: ['div-honestly'],
              edits: [
                {
                  file: 'index.html',
                  replace: '        <article>\n          <h3>Sourdough</h3>',
                  text: '        <div class="bakes">\n        <article>\n          <h3>Sourdough</h3>',
                },
              ],
            },
            {
              id: 'b5',
              note: 'Closing the wrapper. It carries a class, not meaning.',
              concepts: ['div-honestly'],
              edits: [
                {
                  file: 'index.html',
                  after: '          <p>Made from yesterday’s croissants, which is the point.</p>\n        </article>\n',
                  text: '        </div>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c3-l2-s3',
          prompt:
            'Write it out. For each element, ask the question before you type it — that is the habit this chapter is really teaching.',
          files: ['index.html'],
          concepts: ['semantic-section', 'semantic-article', 'semantic-aside', 'div-honestly'],
        },
      ],
    },
  ],
};

export const CHAPTER_4: ChapterInput = {
  id: 'htmlcss-u1-c4',
  slug: 'text-and-the-heading-outline',
  title: 'Text and the heading outline',
  summary: 'Headings are a document outline, not a set of font sizes. Emphasis carries meaning.',
  status: 'available',
  lessons: [
    {
      id: 'htmlcss-u1-c4-l1',
      slug: 'headings-are-an-outline',
      title: 'Headings are an outline',
      summary: 'Choosing a heading level by depth in the document, never by how big you want the text.',
      estimatedMinutes: 8,
      concepts: ['heading-outline'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n  </head>\n  <body>\n    <main>\n    </main>\n  </body>\n</html>\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c4-l1-s1',
          title: 'A table of contents you never have to write',
          concepts: ['heading-outline'],
          body: [
            {
              kind: 'p',
              text: 'Your headings, read in order and ignoring everything else, should form a sensible outline of the page — the way a contents list does. That is what `h1` through `h6` are for. The fact that they render at different sizes is a side effect, and one you will override with CSS within about two units.',
            },
            {
              kind: 'p',
              text: 'Two rules cover nearly everything:',
            },
            {
              kind: 'list',
              ordered: true,
              items: [
                'One `h1` per page. It says what the page is.',
                'Never skip a level going down. An `h2` may be followed by an `h3`, but not straight by an `h4`.',
              ],
            },
            {
              kind: 'p',
              text: 'Skipping levels is the common one, and it happens because somebody wanted smaller text. Screen reader users navigate by heading constantly — a broken outline is genuinely disorienting, in the way a book with chapters out of order would be.',
            },
            {
              kind: 'note',
              text: 'If a heading looks too big, that is a CSS problem with a CSS solution. Never solve it by picking the wrong level.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c4-l1-s2',
          title: 'An outline that holds up',
          beats: [
            {
              id: 'b1',
              note: 'The h1 says what the whole page is. There is only ever one.',
              concepts: ['heading-outline'],
              edits: [
                {
                  file: 'index.html',
                  after: '    <main>\n',
                  text: '      <h1>Our bread</h1>\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'A major division of the page is an h2 — one level down.',
              concepts: ['heading-outline'],
              edits: [
                {
                  file: 'index.html',
                  after: '      <h1>Our bread</h1>\n',
                  text: '      <section>\n        <h2>Sourdough</h2>\n        <p>Fermented for three days.</p>\n      </section>\n',
                },
              ],
            },
            {
              id: 'b3',
              note: 'A subdivision of that section is an h3. Down one more level, never two.',
              concepts: ['heading-outline'],
              edits: [
                {
                  file: 'index.html',
                  after: '        <p>Fermented for three days.</p>\n',
                  text: '        <h3>The starter</h3>\n        <p>Ours is eleven years old and has a name.</p>\n',
                },
              ],
            },
            {
              id: 'b4',
              note: 'Back up to a sibling section — an h2 again, because it sits at the same depth as the first one.',
              concepts: ['heading-outline'],
              edits: [
                {
                  file: 'index.html',
                  after: '      </section>\n',
                  text: '      <section>\n        <h2>Rye</h2>\n        <p>Dense, dark, and improved by a day in the tin.</p>\n      </section>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c4-l1-s3',
          prompt: 'Type the outline out. Read the headings back on their own when you are done.',
          files: ['index.html'],
          concepts: ['heading-outline'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c4-l1-s4',
          prompt: 'Checking the outline:',
          requirements: [
            {
              id: 'r1',
              label: 'Exactly one h1',
              concepts: ['heading-outline'],
              checks: [{ kind: 'headingOutline', singleH1: true }],
            },
            {
              id: 'r2',
              label: 'No heading level is skipped',
              concepts: ['heading-outline'],
              checks: [{ kind: 'headingOutline' }],
            },
            {
              id: 'r3',
              label: 'At least two sections, each with a heading',
              concepts: ['semantic-section'],
              checks: [{ kind: 'element', selector: 'section h2', min: 2 }],
            },
          ],
        },
      ],
    },
    {
      id: 'htmlcss-u1-c4-l2',
      slug: 'emphasis-that-means-something',
      title: 'Emphasis that means something',
      summary: 'strong and em carry meaning. b and i carry appearance. The difference is audible.',
      estimatedMinutes: 6,
      concepts: ['paragraphs', 'emphasis-meaning'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n  </head>\n  <body>\n    <main>\n      <h1>Ordering</h1>\n    </main>\n  </body>\n</html>\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c4-l2-s1',
          title: 'Bold is not a meaning',
          concepts: ['emphasis-meaning'],
          body: [
            {
              kind: 'p',
              text: '`<strong>` and `<b>` both render bold. `<em>` and `<i>` both render italic. They are not interchangeable, and the difference is the same one running through this whole chapter: meaning versus appearance.',
            },
            {
              kind: 'list',
              items: [
                '`<strong>` — this is **important**. A screen reader may change its tone.',
                '`<em>` — this word is **stressed**, and stressing a different word changes the sentence.',
                '`<b>` — draw the eye, no importance implied. A keyword in a summary.',
                '`<i>` — set apart for a technical reason. A Latin name, a ship, a word in another language.',
              ],
            },
            {
              kind: 'p',
              text: 'In practice: if you would say it louder, `strong`. If you would lean on the word, `em`. If you just want it to look different, that is a CSS decision, not an HTML one.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c4-l2-s2',
          title: 'Saying it out loud',
          beats: [
            {
              id: 'b1',
              note: 'A plain paragraph to work with.',
              concepts: ['paragraphs'],
              edits: [
                {
                  file: 'index.html',
                  after: '      <h1>Ordering</h1>\n',
                  text: '      <p>Celebration cakes need three days’ notice.</p>\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'Three days is the part that will cause a problem if missed. That is importance — strong.',
              concepts: ['emphasis-meaning'],
              edits: [
                {
                  file: 'index.html',
                  replace: 'three days’ notice',
                  text: '<strong>three days’ notice</strong>',
                },
              ],
            },
            {
              id: 'b3',
              note: 'And here the stress changes the meaning of the sentence — em, not italics for decoration.',
              concepts: ['emphasis-meaning'],
              edits: [
                {
                  file: 'index.html',
                  after: '      <p>Celebration cakes need <strong>three days’ notice</strong>.</p>\n',
                  text: '      <p>We can usually manage a next-day order, but we cannot <em>promise</em> one.</p>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c4-l2-s3',
          prompt: 'Write both paragraphs, marking up the emphasis as you go.',
          files: ['index.html'],
          concepts: ['paragraphs', 'emphasis-meaning'],
        },
      ],
    },
  ],
};
