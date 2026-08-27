import type { ChapterInput } from '@/lib/content/schema';

/**
 * Unit 1, chapters 5-6.
 *
 * ChapterInput 5 is the reason the workspace is multi-file from the first commit: a
 * lesson called "Connecting CSS" is meaningless with one editor pane.
 */

export const CHAPTER_5: ChapterInput = {
  id: 'htmlcss-u1-c5',
  slug: 'connecting-css',
  title: 'Connecting CSS',
  summary: 'A second file, linked to the first — and the first thing you change and watch change.',
  status: 'available',
  lessons: [
    {
      id: 'htmlcss-u1-c5-l1',
      slug: 'linking-a-stylesheet',
      title: 'Linking a stylesheet',
      summary: 'Why the styles live in their own file, and how the browser is told to go and get it.',
      estimatedMinutes: 8,
      concepts: ['link-stylesheet', 'external-css'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n  </head>\n  <body>\n    <main>\n      <h1>Ridgeway Bakery</h1>\n      <p>Sourdough, pastries, and coffee from seven.</p>\n    </main>\n  </body>\n</html>\n',
        'styles.css': '',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c5-l1-s1',
          title: 'Two files, one page',
          concepts: ['external-css', 'link-stylesheet'],
          body: [
            {
              kind: 'p',
              text: 'You can write CSS in three places: inline on an element, in a `<style>` block in the head, or in a separate file. Only one of those scales, and it is the one you will use for the rest of your career.',
            },
            {
              kind: 'p',
              text: 'A separate stylesheet means one file styles every page on the site. Change the heading colour once and forty pages update. It also means the browser can cache it — download it on the first page, reuse it on every page after.',
            },
            {
              kind: 'code',
              language: 'html',
              code: '<link rel="stylesheet" href="styles.css">',
            },
            {
              kind: 'p',
              text: 'Three parts. `link` is the element. `rel="stylesheet"` says what the relationship is — this file is styling for this page. `href` says where to find it, relative to the HTML file.',
            },
            {
              kind: 'note',
              text: 'If your styles are not applying, this line is the first thing to check. A typo in the filename fails silently — there is no error, the page just looks unstyled.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c5-l1-s2',
          title: 'Connecting the two',
          beats: [
            {
              id: 'b1',
              note: 'The link goes in the head, after the title. The browser fetches it while it is still parsing the page.',
              concepts: ['link-stylesheet'],
              annotations: [
                {
                  id: "h-link",
                  find: "<link",
                  label: "The element that connects this page to another file.",
                  concepts: ["link-stylesheet"],
                },
                {
                  id: "h-rel",
                  find: "rel=\"stylesheet\"",
                  label: "What the relationship is: the file at the other end is styling for this page.",
                  concepts: ["link-stylesheet"],
                },
                {
                  id: "h-href",
                  find: "href=\"styles.css\"",
                  label: "Where to find it, relative to this HTML file. A typo here fails silently \u2014 the page just looks unstyled.",
                  concepts: ["link-stylesheet"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '    <title>Ridgeway Bakery</title>\n',
                  text: '    <link rel="stylesheet" href="styles.css">\n',
                },
              ],
              holdMs: 400,
            },
            {
              id: 'b2',
              note: 'Now over in styles.css. A selector picks what to style, and the braces hold what to do to it.',
              concepts: ['first-selectors'],
              annotations: [
                {
                  id: "h-selector",
                  find: "body",
                  label: "The selector: which elements this rule applies to. Here, the body element.",
                  concepts: ["first-selectors"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  text: 'body {\n}\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b3',
              note: 'Inside, declarations — a property, a colon, a value, a semicolon. Watch the preview as this lands.',
              concepts: ['declarations'],
              annotations: [
                {
                  id: "h-decl",
                  find: "font-family: system-ui, sans-serif;",
                  label: "A declaration: property, colon, value, semicolon. That shape is the whole of CSS.",
                  concepts: ["declarations"],
                },
                {
                  id: "h-lh",
                  find: "line-height: 1.6;",
                  label: "1.6 times the font size. A number with no unit scales with whatever size the text ends up.",
                  concepts: ["declarations"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  after: 'body {\n',
                  text: '  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  color: #26262f;\n',
                },
              ],
            },
            {
              id: 'b4',
              note: 'A second rule, targeting a different element. The whole of CSS is this shape repeated.',
              concepts: ['first-selectors', 'declarations'],
              annotations: [
                {
                  id: "h-h1sel",
                  find: "h1 {",
                  label: "A second rule for a different element. CSS is this shape, repeated.",
                  concepts: ["first-selectors"],
                },
                {
                  id: "h-hex",
                  find: "color: #7a3e1d;",
                  label: "A hex colour \u2014 red, green and blue, two digits each.",
                  concepts: ["declarations"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  text: '\nh1 {\n  color: #7a3e1d;\n  font-size: 2.5rem;\n}\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c5-l1-s3',
          prompt:
            'Link the stylesheet and write both rules. You are editing two files now — the tabs are above the editor.',
          files: ['index.html', 'styles.css'],
          concepts: ['link-stylesheet', 'first-selectors', 'declarations'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c5-l1-s4',
          prompt: 'The stylesheet should be doing something:',
          requirements: [
            {
              id: 'r1',
              label: 'A stylesheet is linked from the head',
              concepts: ['link-stylesheet'],
              checks: [
                {
                  kind: 'attribute',
                  selector: 'link[rel="stylesheet"]',
                  attribute: 'href',
                  nonEmpty: true,
                },
              ],
            },
            {
              id: 'r2',
              label: 'The body has a line height set',
              concepts: ['declarations'],
              checks: [
                { kind: 'computedStyle', selector: 'body', property: 'line-height', minNumber: 1 },
              ],
            },
            {
              id: 'r3',
              label: 'The heading is not the browser default colour',
              concepts: ['first-selectors'],
              checks: [
                { kind: 'computedStyle', selector: 'h1', property: 'color', equals: 'rgb(122, 62, 29)' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'htmlcss-u1-c5-l2',
      slug: 'your-first-rules',
      title: 'Your first rules',
      summary: 'Selecting by element and by class, and the anatomy of a declaration.',
      estimatedMinutes: 8,
      concepts: ['first-selectors', 'class-selectors', 'declarations'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <main>\n      <h1>Ridgeway Bakery</h1>\n      <p>Sourdough, pastries, and coffee from seven.</p>\n      <p>Closed Mondays.</p>\n    </main>\n  </body>\n</html>\n',
        'styles.css': 'body {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n}\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c5-l2-s1',
          title: 'Selecting everything, or selecting this one',
          concepts: ['class-selectors'],
          body: [
            {
              kind: 'p',
              text: 'An element selector styles every element of that type on the page. `p { }` means *all* paragraphs. That is useful for setting a baseline, and useless when you want one paragraph to be different.',
            },
            {
              kind: 'p',
              text: 'That is what classes are for. You put `class="lead"` on the element and select it with `.lead` — a dot, then the name. The dot is how CSS knows you mean a class rather than an element.',
            },
            {
              kind: 'p',
              text: 'You will use classes far more than anything else. They are reusable, they say what a thing *is* rather than where it happens to be, and they keep specificity low — which will matter enormously in Unit 3.',
            },
            {
              kind: 'note',
              text: 'Name a class for what the content is, not what it looks like. `.lead` survives a redesign. `.big-orange-text` does not.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c5-l2-s2',
          title: 'Element, then class',
          beats: [
            {
              id: 'b1',
              note: 'An element selector first — a baseline for every paragraph.',
              concepts: ['first-selectors'],
              annotations: [
                {
                  id: "i-psel",
                  find: "p {",
                  label: "An element selector: every paragraph on the page, with no exceptions.",
                  concepts: ["first-selectors"],
                },
                {
                  id: "i-measure",
                  find: "max-inline-size: 60ch;",
                  label: "About 60 characters per line. Long lines are genuinely harder to read.",
                  concepts: ["declarations"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  text: '\np {\n  margin-block: 0 1rem;\n  max-inline-size: 60ch;\n}\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'Now mark up the paragraph we want to treat differently. A class is just an attribute.',
              concepts: ['class-selectors'],
              annotations: [
                {
                  id: "i-class",
                  find: "class=\"lead\"",
                  label: "A class is just an attribute. Name it for what the content is, not for how it looks.",
                  concepts: ["class-selectors"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  replace: '<p>Sourdough, pastries, and coffee from seven.</p>',
                  text: '<p class="lead">Sourdough, pastries, and coffee from seven.</p>',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b3',
              note: 'And select it with a dot. This rule applies to that paragraph only — and to any other element you give the same class.',
              concepts: ['class-selectors', 'declarations'],
              annotations: [
                {
                  id: "i-dot",
                  find: ".lead {",
                  label: "The dot means class. This rule applies to anything carrying class=\"lead\", and nothing else.",
                  concepts: ["class-selectors"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  text: '\n.lead {\n  font-size: 1.25rem;\n  color: #55555f;\n}\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c5-l2-s3',
          prompt: 'Add the class in the HTML and write both rules.',
          files: ['index.html', 'styles.css'],
          concepts: ['first-selectors', 'class-selectors', 'declarations'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c5-l2-s4',
          prompt: 'Both selectors should be working:',
          requirements: [
            {
              id: 'r1',
              label: 'A paragraph carries the lead class',
              concepts: ['class-selectors'],
              checks: [{ kind: 'element', selector: 'p.lead' }],
            },
            {
              id: 'r2',
              label: 'The lead paragraph is larger than the others',
              concepts: ['class-selectors'],
              checks: [
                { kind: 'computedStyle', selector: 'p.lead', property: 'font-size', minNumber: 17 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const CHAPTER_6: ChapterInput = {
  id: 'htmlcss-u1-c6',
  slug: 'devtools',
  title: 'DevTools: inspect and read the box',
  summary:
    'The highest-leverage skill in the whole track. A learner who can inspect can teach themselves anything.',
  status: 'available',
  lessons: [
    {
      id: 'htmlcss-u1-c6-l1',
      slug: 'inspecting-an-element',
      title: 'Inspecting an element',
      summary: 'Opening DevTools on your own page and seeing the tree the browser actually built.',
      estimatedMinutes: 9,
      concepts: ['devtools-inspect', 'devtools-computed', 'devtools-live-edit'],
      startFiles: {
        'index.html':
          '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Ridgeway Bakery</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <main>\n      <h1>Ridgeway Bakery</h1>\n      <p class="lead">Sourdough, pastries, and coffee from seven.</p>\n    </main>\n  </body>\n</html>\n',
        'styles.css':
          'body {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n}\n\n.lead {\n  font-size: 1.25rem;\n}\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c6-l1-s1',
          title: 'Stop guessing and go and look',
          concepts: ['devtools-inspect'],
          body: [
            {
              kind: 'p',
              text: 'This is the most useful chapter in Unit 1, and most courses never mention it. Every browser ships with a full set of tools for looking inside a page — and the difference between a developer who uses them and one who does not is the difference between diagnosing and guessing.',
            },
            {
              kind: 'p',
              text: 'Right-click anything in the preview and choose **Inspect**, or press **F12**. You get the DOM tree the browser actually built — not the text you wrote, but the parsed result, including anything the browser corrected for you.',
            },
            {
              kind: 'heading',
              text: 'The three panels that matter',
            },
            {
              kind: 'list',
              items: [
                '**Elements** — the live DOM tree. Click an element to select it; it highlights on the page.',
                '**Styles** — every rule matching the selected element, in cascade order. Rules that lost are struck through, which is the cascade made visible.',
                '**Computed** — the final value of every property after all rules resolved. When "why is this grey" has no obvious answer, this panel has it.',
              ],
            },
            {
              kind: 'p',
              text: 'You can also edit directly in there. Change a colour, add a property, watch the page update. Nothing you type is saved — refresh and it is gone — which makes it the safest possible place to experiment.',
            },
            {
              kind: 'note',
              text: 'The box model diagram at the bottom of the Computed panel shows content, padding, border and margin as nested rectangles with real numbers. When Unit 3 covers the box model, that diagram is where it becomes concrete.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c6-l1-s2',
          title: 'Something worth inspecting',
          beats: [
            {
              id: 'b1',
              note: 'Two rules that both target the same paragraph. One of them is going to win.',
              concepts: ['cascade-order'],
              annotations: [
                {
                  id: "j-pcolour",
                  find: "color: #444450;",
                  label: "Sets the colour of every paragraph \u2014 including the lead one.",
                  concepts: ["cascade-order"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  text: '\np {\n  color: #444450;\n}\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'And a class rule setting the same property to something different. Inspect the paragraph after this lands — the Styles panel will show one of these struck through.',
              concepts: ['devtools-computed', 'specificity'],
              annotations: [
                {
                  id: "j-leadcolour",
                  find: "color: #7a3e1d;",
                  label: "The same property, set again by a more specific selector. One of these wins \u2014 the Styles panel shows which, and strikes through the loser.",
                  concepts: ["specificity"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  after: '.lead {\n  font-size: 1.25rem;\n',
                  text: '  color: #7a3e1d;\n',
                },
              ],
              holdMs: 500,
            },
            {
              id: 'b3',
              note: 'Add some padding, then look at the box model diagram in the Computed panel. Content, padding, border, margin — with real numbers on your actual element.',
              concepts: ['devtools-computed', 'box-model'],
              annotations: [
                {
                  id: "j-padding",
                  find: "padding: 1rem 1.25rem;",
                  label: "Space inside the box, between the border and the text. This is what the box model diagram is measuring.",
                  concepts: ["box-model"],
                },
              ],
              edits: [
                {
                  file: 'styles.css',
                  after: '  color: #7a3e1d;\n',
                  text: '  padding: 1rem 1.25rem;\n  background: #f6f1ea;\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c6-l1-s3',
          prompt:
            'Write these rules out, then actually open DevTools on the preview and find the struck-through declaration. This one is worth doing rather than reading.',
          files: ['styles.css'],
          concepts: ['devtools-inspect', 'devtools-computed'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c6-l1-s4',
          prompt: 'The page should give you something to inspect:',
          requirements: [
            {
              id: 'r1',
              label: 'Two rules compete for the lead paragraph’s colour',
              concepts: ['specificity'],
              checks: [
                { kind: 'computedStyle', selector: 'p.lead', property: 'color', equals: 'rgb(122, 62, 29)' },
              ],
            },
            {
              id: 'r2',
              label: 'The lead paragraph has padding you can see in the box model',
              concepts: ['box-model'],
              checks: [
                { kind: 'computedStyle', selector: 'p.lead', property: 'padding-top', minNumber: 8 },
              ],
            },
          ],
        },
      ],
    },
  ],
};
