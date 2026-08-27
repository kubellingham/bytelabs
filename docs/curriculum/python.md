# Track 3 — Python

*Logic, data, and the first taste of real computer science.*

Python sits differently from the first two tracks: no browser, no visual page. The satisfaction
loop shifts from visual to intellectual — the reward is the answer coming back correct. This is a
more mature track for a slightly more serious learner.

**Promise:** *You can write Python programs that solve real problems — from scratch.*

**Shape:** 8 units · ~48 chapters · a graduation scenario at the end of every unit.

---

## What changed from the first draft, and why

| Problem | Why it mattered | Fix |
|---|---|---|
| No modules or imports | Every real program imports something; learners would finish unable to structure a project | Unit 4 |
| No virtual environments or `pip` | The first thing a real Python developer does, entirely absent | Unit 8 |
| No testing | A track ending in a capstone with no way to know it works | Unit 8, with `pytest` |
| No type hints | Standard in modern Python and a genuine comprehension aid | Unit 4 |
| Generators and iterators absent | A core part of what makes Python Python | Unit 7 |
| No context managers | `with open(...)` taught as an incantation rather than a protocol | Unit 6 |
| Reading tracebacks never taught | The main feedback channel the language offers | Unit 1 |
| `dataclasses` absent | The modern default for a data-holding class | Unit 5 |

Also reordered: collections now precede functions, so learners write functions that do something
worth doing.

---

## Unit 1 — Your First Program

1. **How Python runs** — the interpreter, REPL versus script, running a file.
2. **Output** — `print`, its arguments, and formatting early.
3. **Variables** — naming, assignment, reassignment, and Python's naming conventions.
4. **Types** — `str`, `int`, `float`, `bool`, and conversion between them.
5. **Input and f-strings** — reading from a user, and formatting output readably.
6. **Reading a traceback** — error type, message, line, call stack. The chapter that turns every
   later error into information instead of a wall.

**Graduation:** *Write a program that takes user input and produces correctly formatted output.*

---

## Unit 2 — Logic and Control

1. **`if`, `elif`, `else`** — and Python's indentation as syntax.
2. **Comparison and logical operators** — `and`, `or`, `not`, chained comparisons.
3. **Truthiness** — which values are falsy, and idiomatic emptiness checks.
4. **`while` loops** — conditions, termination, and avoiding the infinite one.
5. **`for` loops and `range`** — iterating properly rather than indexing.
6. **`break`, `continue`, `else` on loops** — including the loop-`else` clause almost nobody knows.

**Graduation:** *Write a program that processes a series of conditions and produces correct output
for every case.*

---

## Unit 3 — Collections

1. **Lists** — creation, indexing, slicing, mutation, common methods.
2. **Slicing properly** — start, stop, step, negatives, and copying with a slice.
3. **Dictionaries** — keys, values, items, `get` with defaults, iteration.
4. **Tuples** — immutability, unpacking, and when a tuple says something a list doesn't.
5. **Sets** — uniqueness, membership tests, and set algebra.
6. **Comprehensions** — list, dict and set comprehensions, with a note on when a loop reads better.

**Graduation:** *Process a dataset held as a list of dictionaries — filter, sort and summarise it.*

---

## Unit 4 — Functions and Modules

1. **Defining and calling** — parameters, arguments, `return`, and functions with one job.
2. **Arguments in depth** — defaults, keyword arguments, `*args`, `**kwargs`, and the mutable
   default argument trap.
3. **Scope** — local, enclosing, global, built-in; why `global` is nearly always the wrong answer.
4. **Type hints** — annotating parameters and returns, and what they do and do not enforce.
5. **Docstrings** — writing them, and `help()`.
6. **Modules and imports** — writing a module, `import` forms, `__name__ == "__main__"`, and a tour
   of the standard library worth knowing.

**Graduation:** *Build a documented, type-hinted utility module solving five described problems.*

---

## Unit 5 — Objects and Classes

1. **Why classes exist** — modelling a thing that has both state and behaviour.
2. **Defining a class** — attributes, methods, `self`, and `__init__`.
3. **Instances** — creating them, and instance versus class attributes.
4. **Dunder methods** — `__repr__`, `__str__`, `__eq__`, `__len__`, and how the language talks to
   your object.
5. **`dataclasses`** — the modern default for a class that mostly holds data.
6. **Inheritance and composition** — extending, overriding, `super()`, and why composition is
   usually the better answer.

**Graduation:** *Model a real-world system with at least three classes, correct `__repr__`, and a
deliberate choice between inheritance and composition.*

---

## Unit 6 — Files, Data and Errors

1. **Reading and writing files** — modes, encoding, and why encoding is not optional.
2. **Context managers** — `with` as a protocol rather than an incantation, and what it guarantees.
3. **CSV** — `csv.reader`, `DictReader`, and the quoting problems that bite naive splitting.
4. **JSON** — `load`/`dump`, and mapping JSON onto Python types.
5. **Exceptions** — the hierarchy, catching specifically, `else` and `finally`, and why bare
   `except` hides bugs.
6. **Raising well** — `raise`, custom exception classes, and error messages that help.

**Graduation:** *Build a data pipeline that reads a CSV, transforms it, handles malformed rows
without crashing, and writes a clean output file.*

---

## Unit 7 — Iterators, Generators and Idiomatic Python

*Absent from the original outline entirely, and a large part of what makes Python worth learning.*

1. **The iterator protocol** — `__iter__`, `__next__`, and what a `for` loop actually does.
2. **Generators** — `yield`, lazy evaluation, and processing data larger than memory.
3. **Generator expressions** — and when they beat a comprehension.
4. **`enumerate`, `zip`, unpacking** — the idioms that replace index arithmetic.
5. **`itertools` and `functools`** — the parts worth knowing, including `cache`.
6. **Writing Pythonic code** — EAFP over LBYL, PEP 8, and readability as a real design constraint.

**Graduation:** *Rewrite a working but unidiomatic program into idiomatic Python, keeping behaviour
identical — verified by tests.*

---

## Unit 8 — Real World

1. **Virtual environments and `pip`** — `venv`, installing, `requirements.txt`, and why isolation
   matters.
2. **Project layout** — packages, `__init__.py`, imports that work from anywhere.
3. **Testing with `pytest`** — writing tests, fixtures, parametrising, and what is worth testing.
4. **Command-line programs** — `argparse`, exit codes, and reading from stdin.
5. **Logging** — why it beats `print` once a program is real.
6. **Reading the source of truth** — the standard library docs, PEPs, and evaluating a package.

**Final project:** *A complete Python project from a brief, with tests. No help, no hints.*

Options: a CLI task manager with file persistence · a data pipeline that cleans and summarises a
dataset · a text-based game with multiple classes and persistent state.
