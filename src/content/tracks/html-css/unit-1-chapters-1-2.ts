import type { ChapterInput } from '@/lib/content/schema';

/**
 * Unit 1, chapters 1-2. Authored content.
 *
 * Beats are written in the order a person would actually type the code, and each
 * note explains only the lines that appear alongside it — the doc's concurrent
 * typing mechanic. Concepts are tagged per beat so ghost fade is per-concept.
 */

export const CHAPTER_1: ChapterInput = {
  id: 'htmlcss-u1-c1',
  slug: 'how-browsers-build-a-page',
  title: 'How the browser builds a page',
  summary:
    'Request, parse, tree, paint. Everything else in this track is an intervention somewhere in that pipeline.',
  status: 'available',
  lessons: [
    {
      id: 'htmlcss-u1-c1-l1',
      slug: 'from-text-to-pixels',
      title: 'From text to pixels',
      summary: 'What actually happens between a file on a server and something on your screen.',
      estimatedMinutes: 7,
      concepts: ['render-pipeline'],
      startFiles: { 'index.html': '' },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c1-l1-s1',
          title: 'A browser is a machine that turns text into pixels',
          concepts: ['render-pipeline'],
          body: [
            {
              kind: 'p',
              text: 'An HTML file is just text. There is nothing visual about it. Every heading, every image, every carefully aligned column starts life as characters in a file, and a browser is the machine that turns those characters into something a person can look at.',
            },
            {
              kind: 'p',
              text: 'It happens in a fixed order, every single time:',
            },
            {
              kind: 'list',
              ordered: true,
              items: [
                'The browser **requests** your file and gets back text.',
                'It **parses** that text and builds the **DOM** — a tree of objects, one per element.',
                'It does the same for your CSS, producing the **CSSOM**.',
                'It combines the two into a **render tree** — what is visible, and how it should look.',
                'It works out where everything goes (**layout**), then draws it (**paint**).',
              ],
            },
            {
              kind: 'p',
              text: 'That list is worth remembering, because everything you learn from here is an intervention at one of those stages. HTML changes the tree. CSS changes how the tree looks. Layout is where flexbox and grid live. And when something looks wrong, knowing which stage broke is most of the diagnosis.',
            },
            {
              kind: 'note',
              text: 'You will meet this pipeline again in Unit 7, when the question becomes how to make it fast.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c1-l1-s2',
          title: 'The smallest page that works',
          beats: [
            {
              id: 'b1',
              note: 'Every page starts by telling the browser what kind of document this is. One line, no closing tag, always first.',
              concepts: ['doctype'],
              annotations: [
                {
                  id: "a-doctype",
                  find: "<!doctype html>",
                  label: "Not a tag \u2014 an instruction. It puts the browser into standards mode rather than a 1990s compatibility mode.",
                  concepts: ["doctype"],
                },
              ],
              edits: [{ file: 'index.html', text: '<!doctype html>\n' }],
              holdMs: 400,
            },
            {
              id: 'b2',
              note: 'Then the root element wraps everything. The lang attribute tells a screen reader which language to pronounce, so it is not optional.',
              concepts: ['html-lang'],
              annotations: [
                {
                  id: "a-html-open",
                  find: "<html lang=\"en\">",
                  label: "The root element. Everything else on the page lives inside it.",
                  concepts: ["html-lang"],
                },
                {
                  id: "a-lang",
                  find: "lang=\"en\"",
                  label: "The language of the content. A screen reader uses it to decide how to pronounce the words.",
                  concepts: ["html-lang"],
                },
                {
                  id: "a-html-close",
                  find: "</html>",
                  label: "The closing tag. Everything you open has to be closed, and in the reverse order you opened it.",
                  concepts: ["head-body"],
                },
              ],
              edits: [{ file: 'index.html', text: '<html lang="en">\n</html>\n' }],
              holdMs: 400,
            },
            {
              id: 'b3',
              note: 'The head holds information about the page. None of it is drawn on screen.',
              concepts: ['head-body'],
              annotations: [
                {
                  id: "a-head",
                  find: "<head>",
                  label: "Information about the page. Nothing in here is ever drawn on screen.",
                  concepts: ["head-body"],
                },
                {
                  id: "a-title",
                  find: "<title>My first page</title>",
                  label: "The browser tab, the bookmark name, and the first line of a search result.",
                  concepts: ["page-title"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '<html lang="en">\n',
                  text: '  <head>\n    <title>My first page</title>\n  </head>\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b4',
              note: 'And the body holds what a person actually sees. Two children, that is the whole shape of an HTML document.',
              concepts: ['head-body'],
              annotations: [
                {
                  id: "a-body",
                  find: "<body>",
                  label: "Everything a person sees. The head describes the page; the body is the page.",
                  concepts: ["head-body"],
                },
                {
                  id: "a-h1",
                  find: "<h1>Hello.</h1>",
                  label: "An element in full: an opening tag, the content, a closing tag.",
                  concepts: ["heading-outline"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '  </head>\n',
                  text: '  <body>\n    <h1>Hello.</h1>\n  </body>\n',
                },
              ],
            },
            {
              id: 'b5',
              note: 'That is a complete, valid webpage. Look at the preview — the browser has parsed those characters into a tree and painted it.',
              concepts: ['render-pipeline'],
              annotations: [
                {
                  id: "a-p",
                  find: "<p>This started as text in a file.</p>",
                  label: "A paragraph. The same shape again \u2014 open, content, close.",
                  concepts: ["paragraphs"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '    <h1>Hello.</h1>\n',
                  text: '    <p>This started as text in a file.</p>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c1-l1-s3',
          prompt:
            'Your turn. Type it out — the faint text is there if you need it, and it is not marking you.',
          files: ['index.html'],
          concepts: ['doctype', 'html-lang', 'head-body'],
        },
      ],
    },
    {
      id: 'htmlcss-u1-c1-l2',
      slug: 'the-dom-is-a-tree',
      title: 'The DOM is a tree',
      summary: 'Why nesting matters, and what "parent" and "child" mean once the page is parsed.',
      estimatedMinutes: 8,
      concepts: ['render-pipeline', 'head-body'],
      startFiles: {
        'index.html': '<!doctype html>\n<html lang="en">\n  <head>\n    <title>Structure</title>\n  </head>\n  <body>\n  </body>\n</html>\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c1-l2-s1',
          title: 'Indentation is not decoration',
          concepts: ['render-pipeline'],
          body: [
            {
              kind: 'p',
              text: 'When the browser parses your HTML it does not end up with a list of elements. It ends up with a **tree**: every element has exactly one parent, and any number of children.',
            },
            {
              kind: 'p',
              text: 'That tree is called the DOM, and it is the thing everything else talks to. CSS selectors walk it. JavaScript queries it. A screen reader reads it. When you indent your HTML you are drawing that tree so a human can see it too.',
            },
            {
              kind: 'code',
              language: 'html',
              code: '<body>          <!-- parent -->\n  <header>      <!-- child of body -->\n    <h1>...</h1> <!-- child of header, grandchild of body -->\n  </header>\n</body>',
            },
            {
              kind: 'p',
              text: 'Nesting is a claim about meaning: it says *this thing belongs inside that thing*. Get the nesting wrong and the browser will still render something, but the relationships you described will be the wrong ones.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c1-l2-s2',
          title: 'Building a small tree',
          beats: [
            {
              id: 'b1',
              note: 'Start with a container inside the body. Everything we add next will be a child of this.',
              concepts: ['div-honestly'],
              annotations: [
                {
                  id: "a-article",
                  find: "<article>",
                  label: "A child of body, and about to become the parent of everything indented inside it.",
                  concepts: ["semantic-article"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '  <body>\n',
                  text: '    <article>\n    </article>\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'A heading goes inside it. Note the indentation — two more spaces, because it is one level deeper in the tree.',
              concepts: ['heading-outline'],
              annotations: [
                {
                  id: "a-nested-h1",
                  find: "<h1>A short history of the tree</h1>",
                  label: "Two levels deep: a child of article, a grandchild of body.",
                  concepts: ["heading-outline"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '    <article>\n',
                  text: '      <h1>A short history of the tree</h1>\n',
                },
              ],
            },
            {
              id: 'b3',
              note: 'Then two paragraphs, siblings of the heading. Same parent, same indentation.',
              concepts: ['paragraphs'],
              annotations: [
                {
                  id: "a-sibling",
                  find: "<p>Every element sits inside exactly one other element.</p>",
                  label: "A sibling of the heading \u2014 same parent, same indentation.",
                  concepts: ["paragraphs"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '      <h1>A short history of the tree</h1>\n',
                  text: '      <p>Every element sits inside exactly one other element.</p>\n      <p>That is the whole idea.</p>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c1-l2-s3',
          prompt: 'Build the same tree. Watch your indentation — it is how you read the nesting back.',
          files: ['index.html'],
          concepts: ['heading-outline', 'paragraphs'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c1-l2-s4',
          prompt: 'Before you move on:',
          requirements: [
            {
              id: 'r1',
              label: 'An article element inside the body',
              concepts: ['semantic-article'],
              checks: [{ kind: 'element', selector: 'body > article' }],
            },
            {
              id: 'r2',
              label: 'A heading inside the article',
              concepts: ['heading-outline'],
              checks: [{ kind: 'element', selector: 'article h1' }],
            },
            {
              id: 'r3',
              label: 'Two paragraphs inside the article',
              concepts: ['paragraphs'],
              checks: [{ kind: 'element', selector: 'article p', min: 2 }],
            },
          ],
        },
      ],
    },
  ],
};

export const CHAPTER_2: ChapterInput = {
  id: 'htmlcss-u1-c2',
  slug: 'your-first-document',
  title: 'Your first document',
  summary: 'The parts every page needs, and what each one is actually for.',
  status: 'available',
  lessons: [
    {
      id: 'htmlcss-u1-c2-l1',
      slug: 'the-document-skeleton',
      title: 'The document skeleton',
      summary: 'Doctype, root, head, body — written from memory by the end of this lesson.',
      estimatedMinutes: 7,
      concepts: ['doctype', 'html-lang', 'head-body'],
      startFiles: { 'index.html': '' },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c2-l1-s1',
          title: 'Four parts, in the same order, every time',
          concepts: ['doctype', 'head-body'],
          body: [
            {
              kind: 'p',
              text: 'Every HTML document you will ever write has the same four parts in the same order. You will type this skeleton so many times that it stops being a thing you think about — which is exactly the point.',
            },
            {
              kind: 'list',
              items: [
                '`<!doctype html>` — tells the browser to use modern standards rather than a 1990s compatibility mode.',
                '`<html lang="en">` — the root. Everything lives inside it. `lang` tells assistive technology how to pronounce the content.',
                '`<head>` — information *about* the page. Never rendered.',
                '`<body>` — the content itself. Everything a person sees.',
              ],
            },
            {
              kind: 'note',
              text: 'Leaving off the doctype does not break the page outright. It quietly puts the browser into a legacy mode where some CSS behaves differently. That is a far worse failure than an obvious one.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c2-l1-s2',
          title: 'The skeleton, from nothing',
          beats: [
            {
              id: 'b1',
              note: 'Doctype first. Always.',
              concepts: ['doctype'],
              annotations: [
                {
                  id: "b-doctype",
                  find: "<!doctype html>",
                  label: "First line, every time. No closing tag, because it is an instruction rather than an element.",
                  concepts: ["doctype"],
                },
              ],
              edits: [{ file: 'index.html', text: '<!doctype html>\n' }],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'The root element, with its language declared.',
              concepts: ['html-lang'],
              annotations: [
                {
                  id: "b-lang",
                  find: "lang=\"en\"",
                  label: "Not optional. Without it, assistive technology has to guess which language to read.",
                  concepts: ["html-lang"],
                },
              ],
              edits: [{ file: 'index.html', text: '<html lang="en">\n</html>\n' }],
              holdMs: 300,
            },
            {
              id: 'b3',
              note: 'Head, then body. Two children of the root, in that order.',
              concepts: ['head-body'],
              annotations: [
                {
                  id: "b-head",
                  find: "<head>",
                  label: "Head first, then body. Always in that order.",
                  concepts: ["head-body"],
                },
                {
                  id: "b-body",
                  find: "<body>",
                  label: "The visible half of the document.",
                  concepts: ["head-body"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '<html lang="en">\n',
                  text: '  <head>\n  </head>\n  <body>\n  </body>\n',
                },
              ],
            },
            {
              id: 'b4',
              note: 'The title is the one thing the head needs before anything else. It is the browser tab, the bookmark, and the first line of a search result.',
              concepts: ['page-title'],
              annotations: [
                {
                  id: "b-title",
                  find: "<title>Ridgeway Bakery</title>",
                  label: "Shown in the tab, saved as the bookmark name, and read out first by a screen reader.",
                  concepts: ["page-title"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '  <head>\n',
                  text: '    <title>Ridgeway Bakery</title>\n',
                },
              ],
            },
            {
              id: 'b5',
              note: 'And something in the body, so there is proof it works.',
              concepts: ['heading-outline'],
              annotations: [
                {
                  id: "b-h1",
                  find: "<h1>Ridgeway Bakery</h1>",
                  label: "The first thing in the body, so there is something to see.",
                  concepts: ["heading-outline"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '  <body>\n',
                  text: '    <h1>Ridgeway Bakery</h1>\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c2-l1-s3',
          prompt: 'From the top. This is the one you want in your fingers.',
          files: ['index.html'],
          concepts: ['doctype', 'html-lang', 'head-body', 'page-title'],
        },
      ],
    },
    {
      id: 'htmlcss-u1-c2-l2',
      slug: 'what-goes-in-the-head',
      title: 'What goes in the head',
      summary: 'Character encoding and the viewport tag — two lines that prevent two whole categories of bug.',
      estimatedMinutes: 8,
      concepts: ['charset', 'viewport-meta', 'page-title'],
      startFiles: {
        'index.html': '<!doctype html>\n<html lang="en">\n  <head>\n    <title>Ridgeway Bakery</title>\n  </head>\n  <body>\n    <h1>Ridgeway Bakery</h1>\n  </body>\n</html>\n',
      },
      steps: [
        {
          kind: 'explain',
          id: 'htmlcss-u1-c2-l2-s1',
          title: 'Two lines you will copy forever, explained once',
          concepts: ['charset', 'viewport-meta'],
          body: [
            {
              kind: 'p',
              text: 'Almost every page you have ever viewed has these two lines in its head, and almost nobody who copies them could tell you what they do. Ten seconds now saves a confusing afternoon later.',
            },
            {
              kind: 'heading',
              text: 'charset',
            },
            {
              kind: 'p',
              text: '`<meta charset="utf-8">` tells the browser how to decode the bytes in your file into characters. Without it, an apostrophe or an accented letter can arrive as mojibake — `caf€™` instead of `café`. It goes first in the head, before anything with text in it.',
            },
            {
              kind: 'heading',
              text: 'viewport',
            },
            {
              kind: 'p',
              text: 'By default a phone browser pretends to be about 980px wide and shrinks the whole page to fit, because that is what made 2007-era desktop sites usable. The viewport tag says: do not do that, this page knows how to be narrow.',
            },
            {
              kind: 'note',
              text: 'Without the viewport tag, every responsive style you write in Unit 5 is ignored on a phone. It is the single most common reason a "responsive" site is not.',
            },
          ],
        },
        {
          kind: 'demo',
          id: 'htmlcss-u1-c2-l2-s2',
          title: 'A head that is actually finished',
          beats: [
            {
              id: 'b1',
              note: 'Encoding first, before any content the browser might have to decode.',
              concepts: ['charset'],
              annotations: [
                {
                  id: "c-charset-tag",
                  find: "<meta charset=\"utf-8\">",
                  label: "How to turn the bytes in your file back into characters. It goes first, before anything with text in it.",
                  concepts: ["charset"],
                },
                {
                  id: "c-charset-val",
                  find: "charset=\"utf-8\"",
                  label: "utf-8 covers every character you are realistically going to write \u2014 accents, dashes, emoji.",
                  concepts: ["charset"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '  <head>\n',
                  text: '    <meta charset="utf-8">\n',
                },
              ],
              holdMs: 300,
            },
            {
              id: 'b2',
              note: 'Then the viewport, so narrow screens are treated as narrow screens.',
              concepts: ['viewport-meta'],
              annotations: [
                {
                  id: "c-vp-name",
                  find: "name=\"viewport\"",
                  label: "Names which browser behaviour this meta tag is about.",
                  concepts: ["viewport-meta"],
                },
                {
                  id: "c-vp-width",
                  find: "width=device-width",
                  label: "Use the real width of the screen, instead of pretending to be a 980px desktop.",
                  concepts: ["viewport-meta"],
                },
                {
                  id: "c-vp-scale",
                  find: "initial-scale=1",
                  label: "Start at actual size rather than zoomed out to fit.",
                  concepts: ["viewport-meta"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '    <meta charset="utf-8">\n',
                  text: '    <meta name="viewport" content="width=device-width, initial-scale=1">\n',
                },
              ],
            },
            {
              id: 'b3',
              note: 'And a description. It is not rendered on the page, but it is often the sentence under your link in a search result.',
              concepts: ['meta-description'],
              annotations: [
                {
                  id: "c-desc",
                  find: "name=\"description\"",
                  label: "Never drawn on the page, but often the sentence shown under your link in search results.",
                  concepts: ["meta-description"],
                },
              ],
              edits: [
                {
                  file: 'index.html',
                  after: '    <title>Ridgeway Bakery</title>\n',
                  text: '    <meta name="description" content="A neighbourhood bakery on Ridgeway Road. Sourdough, pastries, and coffee from 7am.">\n',
                },
              ],
            },
          ],
        },
        {
          kind: 'practice',
          id: 'htmlcss-u1-c2-l2-s3',
          prompt: 'Write the head out in full.',
          files: ['index.html'],
          concepts: ['charset', 'viewport-meta', 'meta-description'],
        },
        {
          kind: 'check',
          id: 'htmlcss-u1-c2-l2-s4',
          prompt: 'A finished head has all of these:',
          requirements: [
            {
              id: 'r1',
              label: 'Character encoding declared',
              concepts: ['charset'],
              checks: [
                { kind: 'attribute', selector: 'meta[charset]', attribute: 'charset', nonEmpty: true },
              ],
            },
            {
              id: 'r2',
              label: 'A viewport meta tag',
              concepts: ['viewport-meta'],
              checks: [
                {
                  kind: 'attribute',
                  selector: 'meta[name="viewport"]',
                  attribute: 'content',
                  contains: 'width=device-width',
                },
              ],
            },
            {
              id: 'r3',
              label: 'A page title that is not empty',
              concepts: ['page-title'],
              checks: [{ kind: 'text', selector: 'title', nonEmpty: true }],
            },
            {
              id: 'r4',
              label: 'A meta description',
              concepts: ['meta-description'],
              checks: [
                {
                  kind: 'attribute',
                  selector: 'meta[name="description"]',
                  attribute: 'content',
                  nonEmpty: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
