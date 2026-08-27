# Track 1 — HTML & CSS

*The entry point. Every new ByteLabs learner starts here.*

HTML and CSS are taught as one track because they are one thing in practice. HTML is the
structure, CSS is the appearance, and you cannot meaningfully teach either with the other absent.

**Promise:** *You can build a real, accessible, responsive webpage from scratch — without copying
anything.*

**Shape:** 8 units · ~48 chapters · a graduation scenario at the end of every unit.

---

## What changed from the first draft, and why

The original six-unit outline had five structural problems. They are recorded here because the
reasoning matters more than the result.

| Problem | Why it mattered | Fix |
|---|---|---|
| Semantics and accessibility in Unit 6 | Five units of `<div>` habit, then one unit trying to undo it | Semantics is Unit 1; accessibility is woven through every unit, with Unit 7 going deeper |
| No forms chapter | The Ground's own intermediate scenario is a contact form the course never taught | Forms are a full chapter in Unit 2 |
| Cascade and specificity in Unit 5 | Learners hit "why isn't this applying" in Unit 2 and had no model to reason with | Moved to Unit 3, immediately after selectors |
| No DevTools anywhere | The single highest-leverage beginner skill was absent | Unit 1, chapter 6 |
| Responsive as one media-query chapter | Teaches build-fixed-then-patch, a 2014 workflow | Its own unit, taught as fluid-by-default |

Also added: tables, responsive images, container queries, logical properties, user-preference
queries, cascade layers, and a chapter on reading the specification. Removed: "recreate a mockup
with pixel accuracy", which is neither checkable nor a good goal.

---

## Unit 1 — The Document

*What a page actually is, and the habit of saying what you mean.*

A complete beginner should finish this unit able to write a correctly structured, semantically
meaningful page, and to open DevTools and look at it. Nobody is lost, and nobody has learned a
habit they will have to unlearn.

1. **How the browser builds a page** — request, parse, DOM, CSSOM, render tree, paint. Why this
   matters: everything later in the track is an intervention somewhere in this pipeline.
2. **Your first document** — doctype, `<html lang>`, `<head>`, `<body>`. What each part is for,
   including `charset` and the viewport meta, and why `lang` is not optional.
3. **Structure that means something** — `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`,
   `<aside>`, `<footer>`. Choosing an element by what the content *is*, not how it should look.
   `<div>` introduced honestly, as the element you use when nothing truer exists.
4. **Text and the heading outline** — `<h1>`–`<h6>` as a document outline rather than font sizes,
   `<p>`, and `<strong>`/`<em>` versus `<b>`/`<i>` — meaning versus appearance.
5. **Connecting CSS** — external stylesheets, `<link>`, and why the stylesheet is a separate file.
   First selectors, first declarations, first thing the learner changes and sees change.
6. **DevTools: inspect and read the box** — inspecting an element, reading computed styles,
   editing live, finding which rule won. The chapter that makes every later chapter cheaper.

**Graduation:** *A client sends a content outline for a small business page. Build the document
structure — correct outline, correct semantics, stylesheet linked. No styling required.*

---

## Unit 2 — Content and Meaning

*Everything a page can hold, said correctly.*

1. **Lists** — ordered, unordered, description lists. Recognising that navigation is a list.
2. **Links** — absolute, relative, in-page anchors, `mailto`. Link text that means something out
   of context, and why "click here" fails a screen reader user.
3. **Images** — `alt` as content rather than decoration, empty `alt` for decorative images,
   dimensions and `aspect-ratio` to stop layout shift, `loading="lazy"`.
4. **Tables** — for tabular data, properly: `<thead>`, `<tbody>`, `<th scope>`, `<caption>`. And
   the honest note that tables are not a layout tool.
5. **Forms, part one — the controls** — `<form>`, `<label>` and why association is non-negotiable,
   input types, `<textarea>`, `<select>`, `<fieldset>`/`<legend>`.
6. **Forms, part two — asking correctly** — `required`, `type`, `pattern`, `autocomplete`,
   native validation, and error messages a person can act on.

**Graduation:** *Build a content-complete page for a local business: an article with images, a
navigation list, a data table of opening hours, and a working, labelled contact form.*

---

## Unit 3 — Styling and the Cascade

*Why CSS does what it does.*

The unit that turns CSS from a guessing game into a system.

1. **Selectors** — element, class, id, attribute, grouping, combinators. When a class is the right
   answer, which is nearly always.
2. **The cascade, specificity and inheritance** — origin, layer, specificity, source order. Reading
   a specificity conflict in DevTools. Why `!important` is a symptom rather than a fix.
3. **The box model** — content, padding, border, margin, `box-sizing`, and margin collapse
   explained rather than worked around.
4. **Colour** — hex, `rgb`, `hsl`, `oklch`, and contrast treated as a requirement rather than a
   preference. Checking a contrast ratio in DevTools.
5. **Typography** — families and stacks, the fluid type scale, `line-height`, measure, and why
   line length is a readability decision.
6. **Custom properties** — your first design tokens. Defining, using, scoping, and falling back.
   Introduced here because everything after this unit is easier with them.

**Graduation:** *A semantic page is provided, unstyled. Style it into a designed article using a
token layer — no magic numbers, and all text meeting contrast requirements.*

---

## Unit 4 — Layout

*Putting things where you meant them to go.*

1. **Normal flow** — block, inline, inline-block, and what the browser lays out before you touch
   anything. Most layout bugs are a fight with flow that nobody realised they were having.
2. **Flexbox** — the one-dimensional model: main and cross axis, `justify-content`, `align-items`,
   `flex-grow`/`shrink`/`basis`, wrapping.
3. **Grid** — the two-dimensional model: tracks, `fr`, `repeat()`, `minmax()`, line placement,
   named template areas.
4. **Sizing** — `min()`, `max()`, `clamp()`, intrinsic sizing (`min-content`, `fit-content`), and
   why a fixed width is usually a bug in waiting.
5. **Spacing** — `gap`, a consistent spacing scale, and spacing as a design decision rather than
   a series of one-off margins.
6. **Positioning and stacking** — relative, absolute, sticky, fixed, and `z-index` as a stacking
   context rather than a bigger-number contest.

**Graduation:** *Build a three-section page layout from a design brief that holds up from 320px to
1600px — with no fixed widths anywhere.*

---

## Unit 5 — Responsive and Adaptive

*One page, every screen, and every person's settings.*

The doc's original curriculum spent one chapter here. It deserves a unit, because responsive is a
default posture rather than a feature you add at the end.

1. **Responsive by default** — fluid type with `clamp()`, `auto-fit`/`auto-fill` grids, percentage
   and intrinsic sizing. How far you get before a media query is needed at all.
2. **Media queries** — syntax, and choosing breakpoints from where *your content* breaks rather
   than from a list of device widths. Mobile-first as a default rather than a rule.
3. **Container queries** — components that respond to their container instead of the viewport.
   The thing that makes a component library genuinely reusable.
4. **Logical properties** — `inline`/`block` instead of left/right/top/bottom, and why that is the
   correct default in a world with more than one writing direction.
5. **User preference queries** — `prefers-color-scheme`, `prefers-reduced-motion`,
   `prefers-contrast`, `forced-colors`. Respecting a setting somebody chose deliberately.
6. **Responsive images** — `srcset`, `sizes`, `<picture>` and art direction, and modern formats.

**Graduation:** *Take a working fixed-width layout and make it genuinely responsive across three
form factors — without horizontal scroll at any width, and honouring reduced-motion.*

---

## Unit 6 — Interface Craft

*Making it feel like someone built it on purpose.*

1. **Pseudo-classes** — `:hover`, `:focus`, `:focus-visible` and the difference that matters,
   `:active`, `:disabled`, `:nth-child`, `:not`, `:has`.
2. **Pseudo-elements** — `::before`, `::after`, `::marker`, `::selection`, and the rule that
   generated content is never content that matters.
3. **States** — covering hover, focus, active, disabled, loading, empty and error for every
   interactive thing. The unit where "it works" becomes "it's finished".
4. **Transitions** — properties, duration, easing, delay; what is cheap to animate and what causes
   layout thrash; honouring `prefers-reduced-motion`.
5. **Keyframe animations** — `@keyframes`, timing, and restraint.
6. **Theming with custom properties** — light, dark and alternate skins driven by tokens. Exactly
   the system ByteLabs itself runs on.

**Graduation:** *Build a component library of five reusable UI pieces from specification — every
interactive state covered, fully themeable, keyboard operable.*

---

## Unit 7 — Accessible, Findable, Fast

*The three things that separate a page from a professional page.*

Accessibility has been present since Unit 1. This unit goes deeper and gets rigorous.

1. **Accessibility beyond semantics** — the accessibility tree, roles, names, ARIA when it helps
   and the first rule of ARIA: don't, if a real element will do.
2. **Keyboard and focus** — tab order, focus traps and how to escape them, skip links, managing
   focus when content changes.
3. **Hearing your own page** — using a screen reader well enough to test your own work. Most
   developers have never done this once.
4. **Visual accessibility** — contrast, target size, spacing, zoom to 200%, motion safety.
5. **SEO through markup** — `<title>`, meta description, the heading outline, canonical URLs,
   Open Graph, and structured data basics. SEO as a consequence of good markup.
6. **Performance** — image formats and sizing, layout shift, render-blocking CSS, `font-display`,
   and measuring rather than guessing.

**Graduation:** *A deliberately broken page is provided — inaccessible, unfindable, slow. Audit it
and fix it. Requirements cover keyboard operability, contrast, heading outline, metadata and
layout stability.*

---

## Unit 8 — Real World

*Everything, at once, for a client.*

1. **Multi-page architecture** — shared structure across pages, consistent navigation, the
   duplication problem and how CSS solves the styling half of it.
2. **CSS architecture** — cascade layers, naming conventions, file organisation, and writing
   styles that survive somebody else joining the project.
3. **Reading the source of truth** — MDN, the CSS specification, `caniuse`, and using DevTools as
   the final arbiter. How to answer a question ByteLabs never covered.
4. **Progressive enhancement** — `@supports`, sensible fallbacks, and building something that
   degrades rather than breaks.
5. **Shipping** — a pre-flight checklist: validation, accessibility pass, performance pass,
   cross-browser check.

**Final project:** *A complete five-page professional website from a real client brief. No help,
no hints, no ghost text. Everything from seven units, applied.*

---

## Concept coverage

Every chapter tags the concepts it teaches; the mastery engine tracks them individually, which is
what lets ghost text fade per-concept rather than per-unit. A learner who has written twenty
flexbox containers but three grids sees the flexbox scaffolding disappear first.
