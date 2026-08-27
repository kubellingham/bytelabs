import type { ChapterInput, TrackInput, UnitInput } from '@/lib/content/schema';

/**
 * The Python unit tree. Curriculum complete (docs/curriculum/python.md), lessons
 * not yet authored.
 *
 * Collections precede functions here — reversed from the original outline — so
 * learners write functions that do something worth doing.
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

export const PYTHON_TRACK: TrackInput = {
  id: 'python',
  slug: 'python',
  title: 'Python',
  subtitle: 'Logic, data, and the first taste of real computer science.',
  language: 'python',
  promise: 'You can write Python programs that solve real problems — from scratch.',
  status: 'planned',
  units: [
    unit('py-u1', 'your-first-program', 'Your First Program', 'Simple, but the foundation of everything after it.', [
      chapter('py-u1-c1', 'how-python-runs', 'How Python runs', 'The interpreter, REPL versus script, running a file.'),
      chapter('py-u1-c2', 'output', 'Output', 'print, its arguments, and formatting early.'),
      chapter('py-u1-c3', 'variables', 'Variables', 'Naming, assignment, reassignment, and Python conventions.'),
      chapter('py-u1-c4', 'types', 'Types', 'str, int, float, bool, and converting between them.'),
      chapter('py-u1-c5', 'input-fstrings', 'Input and f-strings', 'Reading from a user, and formatting output readably.'),
      chapter('py-u1-c6', 'tracebacks', 'Reading a traceback', 'Error type, message, line, call stack. Turns every later error into information.'),
    ]),
    unit('py-u2', 'logic-and-control', 'Logic and Control', 'Making decisions and repeating things, in a syntax that stays readable.', [
      chapter('py-u2-c1', 'conditionals', 'if, elif, else', 'Branching, and indentation as syntax.'),
      chapter('py-u2-c2', 'operators', 'Comparison and logical operators', 'and, or, not, and chained comparisons.'),
      chapter('py-u2-c3', 'truthiness', 'Truthiness', 'Which values are falsy, and idiomatic emptiness checks.'),
      chapter('py-u2-c4', 'while', 'while loops', 'Conditions, termination, and avoiding the infinite one.'),
      chapter('py-u2-c5', 'for-range', 'for loops and range', 'Iterating properly rather than indexing.'),
      chapter('py-u2-c6', 'break-continue', 'break, continue, and loop-else', 'Including the loop-else clause almost nobody knows.'),
    ]),
    unit('py-u3', 'collections', 'Collections', 'Organising data — the unit that unlocks real problem solving.', [
      chapter('py-u3-c1', 'lists', 'Lists', 'Creation, indexing, mutation, and common methods.'),
      chapter('py-u3-c2', 'slicing', 'Slicing properly', 'Start, stop, step, negatives, and copying with a slice.'),
      chapter('py-u3-c3', 'dicts', 'Dictionaries', 'Keys, values, items, get with defaults, iteration.'),
      chapter('py-u3-c4', 'tuples', 'Tuples', 'Immutability, unpacking, and when a tuple says something a list does not.'),
      chapter('py-u3-c5', 'sets', 'Sets', 'Uniqueness, membership tests, and set algebra.'),
      chapter('py-u3-c6', 'comprehensions', 'Comprehensions', 'List, dict and set — and when a loop reads better.'),
    ]),
    unit('py-u4', 'functions-and-modules', 'Functions and Modules', 'Thinking in blocks of responsibility rather than lines of code.', [
      chapter('py-u4-c1', 'defining', 'Defining and calling', 'Parameters, arguments, return, and functions with one job.'),
      chapter('py-u4-c2', 'arguments', 'Arguments in depth', 'Defaults, keyword arguments, *args, **kwargs, and the mutable default trap.'),
      chapter('py-u4-c3', 'scope', 'Scope', 'Local, enclosing, global, built-in — and why global is usually wrong.'),
      chapter('py-u4-c4', 'type-hints', 'Type hints', 'Annotating parameters and returns, and what they do and do not enforce.'),
      chapter('py-u4-c5', 'docstrings', 'Docstrings', 'Writing them, and help().'),
      chapter('py-u4-c6', 'modules', 'Modules and imports', 'Writing a module, import forms, __main__, and a standard library tour.'),
    ]),
    unit('py-u5', 'objects-and-classes', 'Objects and Classes', 'Modelling the real world in code.', [
      chapter('py-u5-c1', 'why-classes', 'Why classes exist', 'Modelling a thing that has both state and behaviour.'),
      chapter('py-u5-c2', 'defining', 'Defining a class', 'Attributes, methods, self, and __init__.'),
      chapter('py-u5-c3', 'instances', 'Instances', 'Creating them, and instance versus class attributes.'),
      chapter('py-u5-c4', 'dunder', 'Dunder methods', '__repr__, __str__, __eq__, __len__ — how the language talks to your object.'),
      chapter('py-u5-c5', 'dataclasses', 'dataclasses', 'The modern default for a class that mostly holds data.'),
      chapter('py-u5-c6', 'inheritance', 'Inheritance and composition', 'super(), overriding, and why composition is usually better.'),
    ]),
    unit('py-u6', 'files-data-errors', 'Files, Data and Errors', 'Connecting Python to the world beyond the terminal.', [
      chapter('py-u6-c1', 'files', 'Reading and writing files', 'Modes, encoding, and why encoding is not optional.'),
      chapter('py-u6-c2', 'context-managers', 'Context managers', 'with as a protocol rather than an incantation.'),
      chapter('py-u6-c3', 'csv', 'CSV', 'reader, DictReader, and the quoting problems that bite naive splitting.'),
      chapter('py-u6-c4', 'json', 'JSON', 'load and dump, and mapping JSON onto Python types.'),
      chapter('py-u6-c5', 'exceptions', 'Exceptions', 'The hierarchy, catching specifically, and why bare except hides bugs.'),
      chapter('py-u6-c6', 'raising', 'Raising well', 'raise, custom exception classes, and messages that help.'),
    ]),
    unit('py-u7', 'idiomatic-python', 'Iterators, Generators and Idiomatic Python', 'A large part of what makes Python worth learning.', [
      chapter('py-u7-c1', 'iterator-protocol', 'The iterator protocol', '__iter__, __next__, and what a for loop actually does.'),
      chapter('py-u7-c2', 'generators', 'Generators', 'yield, lazy evaluation, and data larger than memory.'),
      chapter('py-u7-c3', 'genexps', 'Generator expressions', 'And when they beat a comprehension.'),
      chapter('py-u7-c4', 'idioms', 'enumerate, zip, unpacking', 'The idioms that replace index arithmetic.'),
      chapter('py-u7-c5', 'itertools', 'itertools and functools', 'The parts worth knowing, including cache.'),
      chapter('py-u7-c6', 'pythonic', 'Writing Pythonic code', 'EAFP over LBYL, PEP 8, and readability as a design constraint.'),
    ]),
    unit('py-u8', 'real-world', 'Real World', 'A complete project, with tests.', [
      chapter('py-u8-c1', 'venv', 'Virtual environments and pip', 'venv, installing, requirements, and why isolation matters.'),
      chapter('py-u8-c2', 'layout', 'Project layout', 'Packages, __init__.py, and imports that work from anywhere.'),
      chapter('py-u8-c3', 'pytest', 'Testing with pytest', 'Writing tests, fixtures, parametrising, and what is worth testing.'),
      chapter('py-u8-c4', 'cli', 'Command-line programs', 'argparse, exit codes, and reading from stdin.'),
      chapter('py-u8-c5', 'logging', 'Logging', 'Why it beats print once a program is real.'),
      chapter('py-u8-c6', 'source-of-truth', 'Reading the source of truth', 'The standard library docs, PEPs, and evaluating a package.'),
    ]),
  ],
};
