# ByteLabs

Where CS students and developers go to actually write code — shown enough to start,
practised enough to remember.

ByteLabs is a web-based coding platform built on one idea: **you learn to code by coding.**
Not by reading about it, not by watching lectures — by typing it out, watching it work,
breaking it, and doing it again until your hands just know.

---

## The two zones

**The Course** is ByteLabs-owned curriculum. A lesson opens full screen with just the
explanation. When you're done reading, the panel slides left and an editor arrives. Code then
types itself out at a human pace, beat by beat, with the note explaining *those specific lines*
alongside it. That code fades to ghost text, and you type over it. Each unit ends in a client
brief with no help at all.

**The Ground** is open practice. No lessons, no unlocks, nothing to fail. A brief, a client,
and whatever you already know. Assisted mode demonstrates one way through; raw mode is one
switch that strips all of it.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No account, no configuration — progress is stored locally.

The assistant is optional. Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to
switch it on; without one it says so plainly and everything else works unchanged.

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest — content validation, mastery, checks, resolution
npm run test:e2e    # playwright — the signature flows
npm run build       # production build
```

## How it fits together

Five engines, deliberately shared. The product brief describes Course ghost-fade, Ground
assisted-mode fade, and warm-up as three features; they are one — a per-learner model of which
concepts are solid and which are decaying. Built separately they would disagree with each other
and none would be trustworthy.

| Engine | Location | What it does |
|---|---|---|
| Mastery | `src/lib/mastery/` | A forgetting curve per concept. Drives ghost opacity, the warm-up queue, the skill map and mastery tags. |
| Editor & ghost | `src/lib/editor/`, `src/components/editor/` | CodeMirror 6. Ghost text is a decoration layer that never occupies the document, so every keystroke is the learner's. |
| Runner & checks | `src/lib/runner/` | Sandboxed preview, plus a declarative check DSL evaluated inside the frame. Serves both graduations and Ground scenarios. |
| Content | `src/content/`, `src/lib/content/` | Zod-validated. Malformed content fails the build rather than reaching a learner. |
| Theme | `src/styles/` | Every colour is a custom property. Auto time-of-day, five skins, no layout change. |

### Content is data

A lesson is `Path → Track → Unit → Chapter → Lesson → Step`, and steps map onto the six acts:
`explain` → `demo` → `practice` → `check`.

The concurrent typing mechanic is modelled as **beats** — `{ note, edits }` — so a note appears
as its lines type. Concepts are tagged *per beat*, which is the granularity ghost fade needs: a
learner who has written twenty flexbox containers and three grids should see the flexbox
scaffolding disappear first.

A Ground scenario is authored once as a skill spec, a requirement set, and a brief with
`{{placeholders}}`. Variants swap the client and the copy; the requirement array is literally
shared, so brief variety cannot drift the standard. `tests/unit/catalog.test.ts` asserts it.

### Adding content

Author against the `*Input` types in `src/lib/content/schema.ts` and add it to the catalog. The
test suite will tell you if a beat anchor no longer resolves, a concept tag doesn't exist, an id
collides, or a variant leaves an unresolved placeholder.

## What this build deliberately does not do

No leaderboards, no streak freezes, no loss aversion, no hearts, no push nagging. Retention comes
from the app knowing what you're about to forget, not from a counter that punishes you. That's a
product decision, and it's enforced in the code rather than left to good intentions.

Also out of scope for now: certificates, billing, accounts, the Studying Kube bundle, and mobile
layouts. Access is modelled as an entitlement with a named provider rather than a boolean, so a
Kube plan granting ByteLabs access later is a new record, not a migration.

## Curriculum

Full curricula for all three tracks are in [`docs/curriculum/`](docs/curriculum/), along with the
principles that govern them and a record of what changed from the first draft and why.

| Track | Units | Curriculum | Lessons authored |
|---|---|---|---|
| HTML & CSS | 8 | Complete | Unit 1 — six chapters and a graduation |
| JavaScript | 8 | Complete | — |
| Python | 8 | Complete | — |

Unauthored units ship in the app as visible roadmap rather than as absence.

## Stack

Next.js 16 · React 19 · TypeScript 5.9 · Tailwind 4 · CodeMirror 6 · Zod 4 · Vitest 4 ·
Playwright 1.62
