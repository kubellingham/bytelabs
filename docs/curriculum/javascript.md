# Track 2 — JavaScript

*The first real programming language. Where logic begins.*

JavaScript is the first track where the learner has to think rather than describe. A learner
arriving from Track 1 already knows the environment; now the content gets harder while the
experience stays familiar.

**Promise:** *You can make a webpage interactive and connect it to the outside world — from
scratch.*

**Shape:** 8 units · ~48 chapters · a graduation scenario at the end of every unit.

---

## What changed from the first draft, and why

| Problem | Why it mattered | Fix |
|---|---|---|
| **Objects were never taught** | The most fundamental data structure in the language was absent. Arrays, functions and the DOM were all taught on top of a hole | Objects are Unit 3, before arrays and functions |
| `var` taught as a choice | "let, const, var and when to use each" — the 2026 answer is never | `var` is explained as history, never presented as an option |
| No modules | Every non-trivial project is modules. Learners would finish unable to structure one | Unit 8 |
| No destructuring, spread, or template literals | Ubiquitous in real code and absent from the outline | Units 1 and 3 |
| No debugging chapter | `console.log` is not a debugging strategy | Unit 1, with breakpoints and the call stack |
| Error handling only inside async | Errors are not an async-specific concern | Introduced in Unit 7, made a discipline in Unit 8 |
| Coercion never addressed | `==` versus `===` explained as a style rule teaches nothing | Unit 2 teaches the actual coercion model |

---

## Unit 1 — Thinking in Code

1. **What JavaScript is and how it runs** — the engine, the call stack, where scripts live in a
   page, `defer` and `async`.
2. **Values and variables** — `const` first, `let` when reassignment is genuinely needed. `var` is
   shown so learners can read old code, and explained as something the language moved past.
3. **Primitive types** — string, number, boolean, `null`, `undefined`, and the difference between
   the last two that people spend years being vague about.
4. **Operators and template literals** — arithmetic, assignment, string building without `+`.
5. **The console properly** — `log`, `table`, `dir`, `warn`, `error`, and reading what comes back.
6. **DevTools debugging** — breakpoints, stepping, watch expressions, reading the call stack. Now,
   in Unit 1, so the rest of the track is debuggable.

**Graduation:** *Write a script that takes two values, computes a result, and reports it clearly.*

---

## Unit 2 — Decisions

1. **`if`, `else if`, `else`** — and keeping conditions readable.
2. **Comparison and coercion** — what `==` actually does, why `===` is the default, and the
   coercion table demystified rather than memorised.
3. **Truthiness** — which values are falsy, and the bugs that come from `0` and `''`.
4. **Logical operators and short-circuit** — `&&`, `||`, `??`, and using short-circuit deliberately.
5. **`switch`** — when it beats a chain of `else if`, and the fall-through trap.
6. **Ternary and optional chaining** — `?.`, `??=`, and expressions that stay readable.

**Graduation:** *Build a decision-making script from a real-world brief — correct output for every
described case, including the edge ones.*

---

## Unit 3 — Objects

*The missing foundation. Everything after this unit is built on it.*

1. **Objects as the core structure** — literals, properties, nesting, why nearly everything in
   JavaScript is one.
2. **Reading and writing** — dot versus bracket, dynamic keys, adding, deleting, checking existence.
3. **Methods and `this`** — functions on objects, what `this` refers to, and the classic ways it
   surprises people.
4. **Destructuring** — objects and arrays, defaults, renaming, nested destructuring.
5. **Spread and rest** — copying, merging, and the difference between a shallow and a deep copy.
6. **Reference versus value** — the model that explains a whole category of bugs. Plus JSON as the
   serialised form of an object.

**Graduation:** *Model a real-world entity as structured data and write the code that reads,
updates and serialises it.*

---

## Unit 4 — Arrays and Iteration

1. **Arrays** — creating, indexing, length, and the mutating methods.
2. **Loops** — `for`, `while`, `for...of`, `for...in`, and which to reach for.
3. **Transforming** — `map`, `filter`, `find`, `some`, `every`.
4. **Reducing** — `reduce` taught properly, as the general case the others are specialisations of.
5. **Sorting and grouping** — comparator functions, the default-sort trap, `Object.groupBy`.
6. **Immutability in practice** — `toSorted`, `toSpliced`, spread copies, and why mutating shared
   data causes bugs you cannot see.

**Graduation:** *Process a dataset: filter, transform, sort and summarise it into a reported result.*

---

## Unit 5 — Functions

1. **Declaring and calling** — declarations versus expressions, hoisting, naming.
2. **Parameters and returns** — defaults, rest parameters, returning objects, and why a function
   should do one thing.
3. **Scope** — global, function, block; the scope chain; shadowing.
4. **Closures** — what they are, why they exist, and the practical patterns they enable.
5. **Arrow functions** — concise syntax and lexical `this`, including when an arrow is the wrong
   choice.
6. **Higher-order and pure functions** — functions as values, callbacks, and why pure functions are
   easier to test and to trust.

**Graduation:** *Build a utility library of five reusable, documented, pure functions from a spec.*

---

## Unit 6 — The DOM and Events

*The most visually satisfying unit in the track. Things move.*

1. **Selecting elements** — `querySelector`, `querySelectorAll`, and treating a NodeList correctly.
2. **Reading and changing content** — `textContent` versus `innerHTML`, and the injection risk that
   makes that choice a security decision.
3. **Changing appearance** — `classList` as the default, inline styles as the exception, and
   driving state through CSS custom properties.
4. **Creating and removing** — `createElement`, `append`, `remove`, document fragments, and keeping
   reflow cheap.
5. **Events** — listeners, the event object, bubbling and capturing, `preventDefault`.
6. **Delegation and forms** — one listener for many elements; reading form data; validating in
   JavaScript on top of the native validation Track 1 taught.

**Graduation:** *Build a fully interactive component — a filterable list, a modal, or a dynamic
form — that is operable entirely by keyboard.*

---

## Unit 7 — Async and Data

1. **Why async exists** — the single thread, blocking, and what actually happens when a page
   freezes.
2. **The event loop** — call stack, task queue, microtasks. The model that makes async predictable
   rather than mysterious.
3. **Promises** — states, `then`/`catch`/`finally`, chaining, and `Promise.all` versus `allSettled`.
4. **`async`/`await`** — the readable form, and `try`/`catch` around it.
5. **`fetch`** — requests, responses, status codes, headers, and why a 404 does not reject.
6. **Working with real data** — parsing JSON, rendering it, and handling the loading, empty and
   error states that separate a demo from an application.

**Graduation:** *Build a page that fetches live data from a public API and renders it — with
loading, empty and error states all handled.*

---

## Unit 8 — Modules and Real World

1. **ES modules** — `import`/`export`, named versus default, module scope, circular imports.
2. **Project structure** — organising files by responsibility, and keeping the entry point thin.
3. **Error handling as a discipline** — throwing usefully, custom errors, failing loudly in
   development and gracefully in production.
4. **Testing the basics** — what a unit test is, writing a few, and why the pure functions from
   Unit 5 are the easy ones.
5. **Reading the source of truth** — MDN, the ECMAScript spec, and evaluating a package before
   depending on it.
6. **A debugging strategy** — reproducing, isolating, bisecting; reading a stack trace back to a
   cause.

**Final project:** *A complete interactive application from a client brief — DOM, events, async
data, module structure, handled errors. No help, no hints.*

Options: a weather app on a live API · a task manager with persisted state · a product listing with
live search and filtering.
