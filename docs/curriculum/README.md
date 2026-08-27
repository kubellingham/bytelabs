# ByteLabs Curriculum Principles

These principles govern every track. They exist because the first draft of the ByteLabs
curriculum inherited the ordering most tutorials use, and most tutorials order their material
by what is easy to explain rather than by what is true about how the thing is learned.

## 1. Teach the mental model before the syntax

A learner who understands the cascade can reason about a style that isn't applying. A learner
who memorised twenty properties cannot. Every unit leads with the model and lets the syntax
follow from it.

## 2. Correct habits from the first line

Whatever a learner writes for five units is what they will write for five years. This is why
semantic HTML is Unit 1 and not Unit 6, why `var` is explained but never taught as a choice, and
why the first stylesheet a learner links is an external file rather than a `<style>` block.

Undoing a habit costs far more than forming the right one did.

## 3. Accessibility is woven, never appended

An accessibility unit at the end of a track teaches that accessibility is something you add
afterwards. It isn't, and it can't be. Labels arrive with forms. Alt text arrives with images.
Focus states arrive with hover states. The dedicated unit later goes deeper — it does not
introduce the subject.

## 4. Modern by default

We teach the CSS and JavaScript that people write in 2026, not the subset that was safe in 2016.
Container queries, `:has()`, cascade layers, logical properties and `clamp()` are normal tools.
A learner should finish a track writing current code, not code they will have to unlearn.

Where an older technique still matters, we teach it as history with a reason — not as the default.

## 5. Debugging is a first-class skill

DevTools appears in Unit 1 of every track that has it. Reading a traceback appears in Unit 1 of
Python. A learner who can inspect an element, read computed styles, or read a stack trace can
teach themselves indefinitely. One who can't is guessing, and guessing does not scale.

## 6. Repetition is the mechanism, not a fallback

Ghost text fading across sessions, scenarios repeated with different clients, warm-up sessions
re-drilling decaying concepts — these are the curriculum, not decoration around it. Content is
authored knowing it will be met more than once, and knowing the second encounter carries less
scaffolding than the first.

## 7. Every unit ends by walking through glass

A graduation scenario is never announced as a test. It is a brief with requirements and no help.
The learner has already been prepared by the reps; the only thing that changed is that the
scaffolding is gone. They find out they can do it by doing it.

## 8. Real work, always

"Write a for loop" teaches a for loop. "Here is a client and here is what they need" teaches a
for loop *and* why anyone would want one. Every scenario has a reason to exist that a person
outside the industry would recognise.

## 9. Point at the source of truth

Every track has a chapter on reading the actual documentation — MDN, the spec, the standard
library reference, `caniuse`. ByteLabs is a place to practise, not a replacement for knowing
where the answers live. A learner who finishes a track and still can't read MDN has been
short-changed.

---

## Track status

| Track | Units | Curriculum | Content authored |
|---|---|---|---|
| HTML & CSS | 8 | Complete | Unit 1 |
| JavaScript | 8 | Complete | None |
| Python | 8 | Complete | None |

Curricula are complete and reviewed for all three tracks. Lesson content is authored against
them progressively; unauthored units ship in the app as visible roadmap rather than as absence.
