/**
 * Hand-authored concept explainers for The Brief's on-ramp.
 *
 * When a parsed task carries a concept slug that matches an entry here, the
 * on-ramp shows the entry's title, blurb, and snippet — big font, one screen,
 * ByteLabs voice. Slugs the library does not know about surface as placeholder
 * cards so the learner at least sees what the task expects them to know.
 *
 * Voice rules:
 *  - Two or three short sentences of prose. No lecture.
 *  - One small snippet that shows the shape, not a whole solved problem.
 *  - snippetOutput is what running the snippet prints. Omit when the snippet
 *    does not print anything.
 *  - Names things plainly — "the for loop", "the % operator" — not
 *    "iteration constructs" or "the modulus operation".
 */

export type ConceptLanguage = 'python' | 'html' | 'css' | 'javascript';

export interface ConceptExplainer {
  id: string;
  title: string;
  language: ConceptLanguage;
  /** One or two short paragraphs — the shape of the idea, not a lecture. */
  blurb: string;
  /** One small worked snippet showing the concept in the smallest useful form. */
  snippet: string;
  /** What running the snippet prints. Omit when the snippet does not print. */
  snippetOutput?: string;
}

const PYTHON: Record<string, ConceptExplainer> = {
  input: {
    id: 'input',
    title: 'Reading input from the user',
    language: 'python',
    blurb:
      'input() pauses the program and waits for the user to type something and press Enter. What comes back is always a string, even if they typed a number — convert it with int() or float() before doing math.',
    snippet:
      'name = input("What is your name? ")\nprint("Hello,", name)\n\nage = int(input("How old are you? "))\nprint("Next year you will be", age + 1)',
  },
  print: {
    id: 'print',
    title: 'Writing output with print()',
    language: 'python',
    blurb:
      'print() writes to the screen. Comma-separated arguments are joined with a space. f-strings — a string prefixed with f — let you drop variables straight into text with {curly braces}.',
    snippet:
      'name = "Ada"\nage = 36\n\nprint("Hello,", name)\nprint(f"{name} is {age} years old.")',
    snippetOutput: 'Hello, Ada\nAda is 36 years old.',
  },
  'for-loop': {
    id: 'for-loop',
    title: 'The for loop',
    language: 'python',
    blurb:
      'A for loop walks through a sequence — a list, a string, a range — and runs the same block once per item. The variable after for is bound to the current item on each pass.',
    snippet:
      'for name in ["Ada", "Grace", "Katherine"]:\n    print("Hi,", name)\n\nfor i in range(1, 4):\n    print(i, "squared is", i * i)',
    snippetOutput:
      'Hi, Ada\nHi, Grace\nHi, Katherine\n1 squared is 1\n2 squared is 4\n3 squared is 9',
  },
  'while-loop': {
    id: 'while-loop',
    title: 'The while loop',
    language: 'python',
    blurb:
      'A while loop repeats a block as long as a condition is true. The condition is checked before every pass; when it becomes false, the loop stops. Make sure something inside the loop actually changes the condition, or the loop runs forever.',
    snippet:
      'count = 3\nwhile count > 0:\n    print("Countdown:", count)\n    count = count - 1\nprint("Go!")',
    snippetOutput: 'Countdown: 3\nCountdown: 2\nCountdown: 1\nGo!',
  },
  'if-statement': {
    id: 'if-statement',
    title: 'Conditional branching',
    language: 'python',
    blurb:
      'if runs a block only when its condition is true. elif is "else, if this other condition is true". else runs when none of the earlier conditions did. Each branch is indented under its header.',
    snippet:
      'score = 72\n\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelse:\n    print("Keep going.")',
    snippetOutput: 'B',
  },
  break: {
    id: 'break',
    title: 'Exiting a loop early with break',
    language: 'python',
    blurb:
      'break jumps out of the innermost loop immediately. Useful when you have found what you were looking for and there is no point continuing — a factor found in a prime check, a matching item in a search.',
    snippet:
      'for n in [4, 7, 12, 15]:\n    if n % 2 == 0:\n        print("first even:", n)\n        break',
    snippetOutput: 'first even: 4',
  },
  continue: {
    id: 'continue',
    title: 'Skipping an iteration with continue',
    language: 'python',
    blurb:
      'continue skips the rest of the current pass through the loop and goes back to the top for the next item. The loop itself does not stop.',
    snippet:
      'for n in range(1, 6):\n    if n % 2 == 0:\n        continue\n    print(n, "is odd")',
    snippetOutput: '1 is odd\n3 is odd\n5 is odd',
  },
  modulo: {
    id: 'modulo',
    title: 'The % operator',
    language: 'python',
    blurb:
      'a % b is the remainder of dividing a by b. It answers "does b divide a evenly?" — the result is 0 exactly when it does. That is why % is the go-to for even/odd, divisibility, and prime checks.',
    snippet:
      'print(10 % 3)    # 1\nprint(10 % 5)    # 0\n\nif 12 % 2 == 0:\n    print("12 is even")',
    snippetOutput: '1\n0\n12 is even',
  },
  arithmetic: {
    id: 'arithmetic',
    title: 'Arithmetic and precedence',
    language: 'python',
    blurb:
      'Python does the maths you would expect: + - * / for the four operations, // for integer division that drops the remainder, ** for exponent. Multiplication and division bind tighter than addition, and parentheses always win.',
    snippet:
      'print(2 + 3 * 4)      # 14, not 20\nprint((2 + 3) * 4)    # 20\nprint(7 // 2)         # 3\nprint(7 / 2)          # 3.5\nprint(2 ** 8)         # 256',
    snippetOutput: '14\n20\n3\n3.5\n256',
  },
  'list-basics': {
    id: 'list-basics',
    title: 'Lists: creating, indexing, slicing',
    language: 'python',
    blurb:
      'A list holds an ordered sequence of things in square brackets. Index from the front with [0], from the back with [-1]. A slice [a:b] gives the items from a up to but not including b.',
    snippet:
      'fruits = ["apple", "banana", "cherry", "date"]\n\nprint(fruits[0])      # apple\nprint(fruits[-1])     # date\nprint(fruits[1:3])    # ["banana", "cherry"]',
    snippetOutput: 'apple\ndate\n[\'banana\', \'cherry\']',
  },
  'list-methods': {
    id: 'list-methods',
    title: 'Common list methods',
    language: 'python',
    blurb:
      '.append(x) adds x to the end. .insert(i, x) puts x at position i. .remove(x) drops the first x by value. .pop(i) removes and returns item i. .count(x) says how many times x appears. .sort() and .reverse() rearrange the list in place.',
    snippet:
      'nums = [3, 1, 4, 1, 5]\n\nnums.append(9)\nnums.sort()\nprint(nums)              # [1, 1, 3, 4, 5, 9]\nprint(nums.count(1))     # 2',
    snippetOutput: '[1, 1, 3, 4, 5, 9]\n2',
  },
  'tuple-basics': {
    id: 'tuple-basics',
    title: 'Tuples: fixed sequences',
    language: 'python',
    blurb:
      'A tuple is like a list but frozen — once created it cannot be changed. Indexing and slicing work the same as lists. Tuple unpacking lets you assign each element to its own variable in one line.',
    snippet:
      'point = (3, 4)\nx, y = point\nprint(x, y)          # 3 4\n\nprint(point[0])      # 3\n# point[0] = 99      # would raise TypeError',
    snippetOutput: '3 4\n3',
  },
  'set-basics': {
    id: 'set-basics',
    title: 'Sets: unordered, unique',
    language: 'python',
    blurb:
      'A set holds distinct items in braces {} — duplicates are dropped automatically. Membership checks with in are very fast. Sets support intersection with &, union with |, and difference with -.',
    snippet:
      'a = {1, 2, 3, 3, 2}\nb = {2, 3, 4}\n\nprint(a)              # {1, 2, 3}\nprint(a & b)          # {2, 3}\nprint(a | b)          # {1, 2, 3, 4}\nprint(3 in a)         # True',
    snippetOutput: '{1, 2, 3}\n{2, 3}\n{1, 2, 3, 4}\nTrue',
  },
  'dict-basics': {
    id: 'dict-basics',
    title: 'Dictionaries: key-value pairs',
    language: 'python',
    blurb:
      'A dict maps keys to values with braces and colons: {key: value}. Look up a value with [key]. .items() yields (key, value) pairs — the usual thing to loop over.',
    snippet:
      'marks = {"Ada": 91, "Grace": 78}\n\nprint(marks["Ada"])          # 91\n\nfor name, score in marks.items():\n    print(name, "scored", score)',
    snippetOutput: '91\nAda scored 91\nGrace scored 78',
  },
  'string-methods': {
    id: 'string-methods',
    title: 'Common string methods',
    language: 'python',
    blurb:
      '.upper() and .lower() change case. .strip() trims whitespace at both ends. .replace(a, b) swaps every a for b. .split(sep) breaks a string into a list. .count(x) says how many times x appears.',
    snippet:
      'text = "  Hello, World!  "\n\nprint(text.strip())          # "Hello, World!"\nprint(text.strip().upper())  # "HELLO, WORLD!"\nprint("banana".count("a"))   # 3',
    snippetOutput: 'Hello, World!\nHELLO, WORLD!\n3',
  },
  'string-format': {
    id: 'string-format',
    title: 'f-strings',
    language: 'python',
    blurb:
      'An f-string is a string with an f before its opening quote. Anything inside {curly braces} is evaluated and dropped in — variables, expressions, formatted numbers. Cleaner than concatenating with +.',
    snippet:
      'name = "Ada"\nage = 36\n\nprint(f"{name} is {age} years old.")\nprint(f"Half of {age} is {age / 2}")\nprint(f"{3.14159:.2f}")   # 3.14',
    snippetOutput: 'Ada is 36 years old.\nHalf of 36 is 18.0\n3.14',
  },
  'function-def': {
    id: 'function-def',
    title: 'Defining a function',
    language: 'python',
    blurb:
      'def <name>(<parameters>): opens a function; the body is indented under it. Call the function by writing its name with the arguments in parentheses. Parameters are placeholders; arguments are the actual values passed in.',
    snippet:
      'def greet(name):\n    print("Hello,", name)\n\ngreet("Ada")\ngreet("Grace")',
    snippetOutput: 'Hello, Ada\nHello, Grace',
  },
  return: {
    id: 'return',
    title: 'Returning a value',
    language: 'python',
    blurb:
      'A function that ends in return <value> hands that value back to whoever called it, so you can save it in a variable or use it in an expression. A function without return still runs — it just hands back None.',
    snippet:
      'def area(width, height):\n    return width * height\n\na = area(3, 4)\nprint(a)                   # 12\nprint(area(5, 5) + 1)      # 26',
    snippetOutput: '12\n26',
  },
  'default-args': {
    id: 'default-args',
    title: 'Default parameter values',
    language: 'python',
    blurb:
      'Give a parameter a default with =. If the caller does not supply that argument, the default is used. Parameters with defaults must come after parameters without.',
    snippet:
      'def area(width, height=1):\n    return width * height\n\nprint(area(5))         # 5, height defaulted to 1\nprint(area(5, 3))      # 15',
    snippetOutput: '5\n15',
  },
  'try-except': {
    id: 'try-except',
    title: 'Catching errors with try / except',
    language: 'python',
    blurb:
      'Code inside try runs normally. If it raises an exception whose type matches an except clause, control jumps into that clause instead of crashing. You can catch multiple types with separate excepts.',
    snippet:
      'try:\n    n = int(input("Number? "))\n    print(10 / n)\nexcept ValueError:\n    print("That was not a number.")\nexcept ZeroDivisionError:\n    print("Cannot divide by zero.")',
  },
  'class-def': {
    id: 'class-def',
    title: 'Defining a class',
    language: 'python',
    blurb:
      'A class is a template for making objects with shared behaviour. __init__ runs when you make one — it sets up the object. Methods are functions defined inside the class; the first parameter is always self, standing for "this specific object".',
    snippet:
      'class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\n    def display(self):\n        print(self.name, "scored", self.marks)\n\na = Student("Ada", 91)\na.display()',
    snippetOutput: 'Ada scored 91',
  },
  'module-import': {
    id: 'module-import',
    title: 'Importing a module',
    language: 'python',
    blurb:
      'import <module> brings a whole module in; use its functions as module.name(). from <module> import <name> pulls a specific name in so you can use it bare. import <module> as <alias> renames it, usually for brevity.',
    snippet:
      'import math\nfrom random import choice\nimport matplotlib.pyplot as plt\n\nprint(math.sqrt(16))            # 4.0\nprint(choice(["apple", "pear"]))',
  },
  regex: {
    id: 'regex',
    title: 'Regular expressions',
    language: 'python',
    blurb:
      'A regex is a pattern that describes text. Python\'s re module matches, finds, and replaces. \\d matches a digit, + means "one or more", ^ and $ anchor to start and end.',
    snippet:
      'import re\n\ntext = "Call me at 555-1234 or 555-5678"\nnumbers = re.findall(r"\\d{3}-\\d{4}", text)\nprint(numbers)              # [\'555-1234\', \'555-5678\']',
    snippetOutput: '[\'555-1234\', \'555-5678\']',
  },
};

const LIBRARY: Record<string, ConceptExplainer> = {
  ...PYTHON,
};

export function getConcept(id: string): ConceptExplainer | null {
  return LIBRARY[id] ?? null;
}

export function conceptCount(): number {
  return Object.keys(LIBRARY).length;
}

/**
 * Turn an unknown slug into a display title. "prime-check" → "Prime check".
 * Used for the placeholder card the on-ramp shows when the library does not
 * have an entry for a concept the parser identified.
 */
export function humaniseSlug(slug: string): string {
  const words = slug.split(/[-_]/).filter(Boolean);
  if (words.length === 0) return slug;
  const [first, ...rest] = words;
  return [first!.charAt(0).toUpperCase() + first!.slice(1), ...rest].join(' ');
}
