/**
 * Turn a raw Pyodide error/traceback into something a first-year student
 * can read.
 *
 * Pyodide's exceptions include the whole internal call stack that got the
 * learner's code to the point where it ran — CodeRunner, _base.py,
 * _parse_and_compile_gen and friends. None of that belongs in front of
 * somebody who just mistyped `is_prime` as `is-print`. This function keeps
 * only the frames pointing at the learner's own code and the actual error
 * line, and renames Pyodide's `<exec>` source (its default name for
 * runPythonAsync input) to `main.py` so the error reads like it came from
 * a real file.
 *
 * Pure and predictable so both the rewrite editor and the mini-lesson type
 * step use the same wording.
 */

const INTERNAL_MARKERS = [
  '/_pyodide/',
  '/lib/python',
  'pyodide/pyodide.asm',
];

export function formatPythonError(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  let droppingFrame = false;

  for (const line of lines) {
    const isFileHeader = /^\s*File "/.test(line);

    if (isFileHeader) {
      droppingFrame = INTERNAL_MARKERS.some((marker) => line.includes(marker));
      if (!droppingFrame) {
        out.push(line.replace('<exec>', 'main.py'));
      }
      continue;
    }

    if (droppingFrame) {
      // A frame's follow-on lines are always indented. As soon as we see
      // an un-indented line (typically the final `ErrorName: message`),
      // we're out of the frame block.
      if (line.startsWith(' ') || line.startsWith('\t')) continue;
      droppingFrame = false;
    }

    out.push(line);
  }

  // If every trace frame got dropped, the `Traceback (most recent call last):`
  // header is now hanging by itself — trim it, along with any resulting
  // blank lines at the top.
  const compacted: string[] = [];
  for (const line of out) {
    const prev = compacted[compacted.length - 1];
    if (line.trim() === '' && (prev === undefined || prev.trim() === '')) continue;
    compacted.push(line);
  }
  while (compacted.length > 0 && compacted[0]?.trim() === '') compacted.shift();

  // If the first line is "Traceback ..." but the next line isn't a File
  // header (all internal frames were dropped), drop the header too — a
  // "Traceback:" with nothing under it is noise.
  if (
    compacted[0]?.startsWith('Traceback') &&
    !compacted[1]?.trim().startsWith('File "')
  ) {
    compacted.shift();
  }

  const cleaned = compacted.join('\n').trim();

  // Pyodide raises `OSError: [Errno 29] I/O error` the first time `input()`
  // fires without a stdin source. `EOFError: EOF when reading a line` is
  // the same story once a stdin handler IS set but has no more lines to
  // give. Both are opaque to a beginner — they read the words and think
  // their code is broken. Swap for a plain-English hint that points at
  // the actual cause (browser sandbox has no keyboard) and the fix
  // (the walkthrough feeds a value; without one, input() can't run).
  const INPUT_STARVED = /(?:OSError:\s*\[Errno 29\]\s*I\/O error|EOFError:\s*EOF when reading a line)/;
  if (INPUT_STARVED.test(cleaned)) {
    return cleaned.replace(
      INPUT_STARVED,
      "input() had no value to read — this browser sandbox has no keyboard. The walkthrough feeds a value in for you; a task room without a preset input can't call input().",
    );
  }

  return cleaned;
}
