import type { ChapterInput, TrackInput, UnitInput } from '@/lib/content/schema';

/**
 * The JavaScript unit tree. Curriculum complete (docs/curriculum/javascript.md),
 * lessons not yet authored — it ships as visible roadmap rather than as absence.
 *
 * Note UnitInput 3: the original outline taught arrays, functions and the DOM without
 * ever teaching objects. That hole is why this tree is ordered as it is.
 */

function chapter(id: string, slug: string, title: string, summary: string): ChapterInput {
  return { id, slug, title, summary, status: 'planned', lessons: [] };
}

function unit(
  id: string,
  slug: string,
  title: string,
  intent: string,
  chapters: ChapterInput[],
): UnitInput {
  return { id, slug, title, intent, status: 'planned', chapters, graduation: null };
}

export const JAVASCRIPT_TRACK: TrackInput = {
  id: 'javascript',
  slug: 'javascript',
  title: 'JavaScript',
  subtitle: 'The first real programming language. Where logic begins.',
  language: 'javascript',
  promise:
    'You can make a webpage interactive and connect it to the outside world — from scratch.',
  status: 'planned',
  units: [
    unit('js-u1', 'thinking-in-code', 'Thinking in Code', 'Values, operators, and the tools to see what your code is doing.', [
      chapter('js-u1-c1', 'how-js-runs', 'What JavaScript is and how it runs', 'The engine, the call stack, and where scripts live in a page.'),
      chapter('js-u1-c2', 'variables', 'Values and variables', 'const first, let when needed. var explained as history, never offered as a choice.'),
      chapter('js-u1-c3', 'types', 'Primitive types', 'Strings, numbers, booleans, null and undefined — and the difference between the last two.'),
      chapter('js-u1-c4', 'operators', 'Operators and template literals', 'Arithmetic, assignment, and building strings without plus signs.'),
      chapter('js-u1-c5', 'console', 'The console properly', 'log, table, dir, warn, error — and reading what comes back.'),
      chapter('js-u1-c6', 'debugging', 'DevTools debugging', 'Breakpoints, stepping, watch expressions, and the call stack. In UnitInput 1, so the rest is debuggable.'),
    ]),
    unit('js-u2', 'decisions', 'Decisions', 'Conditions, coercion, and code that reads the way it behaves.', [
      chapter('js-u2-c1', 'if-else', 'if, else if, else', 'Branching, and keeping conditions readable.'),
      chapter('js-u2-c2', 'coercion', 'Comparison and coercion', 'What == actually does, and why === is the default.'),
      chapter('js-u2-c3', 'truthiness', 'Truthiness', 'Which values are falsy, and the bugs that come from 0 and empty strings.'),
      chapter('js-u2-c4', 'logical-operators', 'Logical operators', '&&, ||, ?? and using short-circuit deliberately.'),
      chapter('js-u2-c5', 'switch', 'switch', 'When it beats a chain of else-ifs, and the fall-through trap.'),
      chapter('js-u2-c6', 'ternary-optional', 'Ternary and optional chaining', 'Expressions that stay readable, and ?. for values that might not be there.'),
    ]),
    unit('js-u3', 'objects', 'Objects', 'The missing foundation. Everything after this unit is built on it.', [
      chapter('js-u3-c1', 'object-literals', 'Objects as the core structure', 'Literals, properties, nesting, and why nearly everything is one.'),
      chapter('js-u3-c2', 'reading-writing', 'Reading and writing properties', 'Dot versus bracket, dynamic keys, adding, deleting, checking existence.'),
      chapter('js-u3-c3', 'methods-this', 'Methods and this', 'Functions on objects, and the ways this surprises people.'),
      chapter('js-u3-c4', 'destructuring', 'Destructuring', 'Objects and arrays, defaults, renaming, nesting.'),
      chapter('js-u3-c5', 'spread-rest', 'Spread and rest', 'Copying, merging, and shallow versus deep.'),
      chapter('js-u3-c6', 'reference-value', 'Reference versus value', 'The model that explains a whole category of bugs. Plus JSON.'),
    ]),
    unit('js-u4', 'arrays', 'Arrays and Iteration', 'Doing a thing many times without writing it many times.', [
      chapter('js-u4-c1', 'arrays', 'Arrays', 'Creating, indexing, length, and the mutating methods.'),
      chapter('js-u4-c2', 'loops', 'Loops', 'for, while, for...of, for...in — and which to reach for.'),
      chapter('js-u4-c3', 'transforming', 'Transforming', 'map, filter, find, some, every.'),
      chapter('js-u4-c4', 'reduce', 'Reducing', 'reduce taught as the general case the others specialise.'),
      chapter('js-u4-c5', 'sorting', 'Sorting and grouping', 'Comparators, the default-sort trap, and Object.groupBy.'),
      chapter('js-u4-c6', 'immutability', 'Immutability in practice', 'toSorted, toSpliced, spread copies, and why mutating shared data hurts.'),
    ]),
    unit('js-u5', 'functions', 'Functions', 'Where writing code becomes thinking like a developer.', [
      chapter('js-u5-c1', 'declaring', 'Declaring and calling', 'Declarations versus expressions, hoisting, naming.'),
      chapter('js-u5-c2', 'parameters', 'Parameters and returns', 'Defaults, rest parameters, and functions that do one thing.'),
      chapter('js-u5-c3', 'scope', 'Scope', 'Global, function and block scope; the scope chain; shadowing.'),
      chapter('js-u5-c4', 'closures', 'Closures', 'What they are, why they exist, and the patterns they enable.'),
      chapter('js-u5-c5', 'arrow-functions', 'Arrow functions', 'Concise syntax, lexical this, and when an arrow is wrong.'),
      chapter('js-u5-c6', 'higher-order', 'Higher-order and pure functions', 'Functions as values, and why pure ones are easier to trust.'),
    ]),
    unit('js-u6', 'dom-and-events', 'The DOM and Events', 'The most visually satisfying unit in the track. Things move.', [
      chapter('js-u6-c1', 'selecting', 'Selecting elements', 'querySelector, querySelectorAll, and treating a NodeList correctly.'),
      chapter('js-u6-c2', 'content', 'Reading and changing content', 'textContent versus innerHTML — a security decision, not a style one.'),
      chapter('js-u6-c3', 'styling', 'Changing appearance', 'classList as the default, and driving state through custom properties.'),
      chapter('js-u6-c4', 'creating', 'Creating and removing', 'createElement, append, remove, fragments, and keeping reflow cheap.'),
      chapter('js-u6-c5', 'events', 'Events', 'Listeners, the event object, bubbling and capturing, preventDefault.'),
      chapter('js-u6-c6', 'delegation-forms', 'Delegation and forms', 'One listener for many elements; reading and validating form data.'),
    ]),
    unit('js-u7', 'async', 'Async and Data', 'Talking to the outside world and showing what comes back.', [
      chapter('js-u7-c1', 'why-async', 'Why async exists', 'The single thread, blocking, and what happens when a page freezes.'),
      chapter('js-u7-c2', 'event-loop', 'The event loop', 'Call stack, task queue, microtasks — the model that makes async predictable.'),
      chapter('js-u7-c3', 'promises', 'Promises', 'States, chaining, and Promise.all versus allSettled.'),
      chapter('js-u7-c4', 'async-await', 'async and await', 'The readable form, and try/catch around it.'),
      chapter('js-u7-c5', 'fetch', 'fetch', 'Requests, responses, status codes, and why a 404 does not reject.'),
      chapter('js-u7-c6', 'real-data', 'Working with real data', 'Parsing, rendering, and the loading, empty and error states that finish a feature.'),
    ]),
    unit('js-u8', 'real-world', 'Modules and Real World', 'Structure, errors, tests — and a client brief.', [
      chapter('js-u8-c1', 'modules', 'ES modules', 'import and export, module scope, circular imports.'),
      chapter('js-u8-c2', 'structure', 'Project structure', 'Organising by responsibility, and keeping the entry point thin.'),
      chapter('js-u8-c3', 'errors', 'Error handling as a discipline', 'Throwing usefully, custom errors, failing loudly then gracefully.'),
      chapter('js-u8-c4', 'testing', 'Testing the basics', 'What a unit test is, and why pure functions are the easy ones.'),
      chapter('js-u8-c5', 'source-of-truth', 'Reading the source of truth', 'MDN, the spec, and evaluating a package before depending on it.'),
      chapter('js-u8-c6', 'debugging-strategy', 'A debugging strategy', 'Reproduce, isolate, bisect — and reading a stack trace back to a cause.'),
    ]),
  ],
};
