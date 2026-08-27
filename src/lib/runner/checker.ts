/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The requirement checker.
 *
 * IMPORTANT: `createChecker` is stringified and injected into a sandboxed iframe,
 * so its body must be entirely self-contained — no imports, no closure over module
 * scope, no helpers defined outside it. In exchange it stays a real function, which
 * means the unit tests call it directly against a jsdom document rather than
 * testing a string.
 *
 * The parent evaluates *checks*, not requirements: a single requirement can hold
 * checks at different viewport widths, so results are collected across passes and
 * combined into requirement outcomes on the parent side.
 */

export interface CheckItem {
  id: string;
  check: Record<string, any>;
}

export interface CheckOutcome {
  id: string;
  ok: boolean;
  /** Present when it did not pass: what is missing, in the learner's language. */
  detail?: string;
}

export function createChecker(doc: Document, win: Window) {
  function all(selector: string, within?: string): Element[] {
    try {
      const scopes: ParentNode[] = within ? Array.from(doc.querySelectorAll(within)) : [doc];
      const found: Element[] = [];
      for (const scope of scopes) {
        for (const el of Array.from(scope.querySelectorAll(selector))) found.push(el);
      }
      return found;
    } catch {
      return [];
    }
  }

  function first(selector: string): Element | null {
    try {
      return doc.querySelector(selector);
    } catch {
      return null;
    }
  }

  function textOf(el: Element | null): string {
    return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function numeric(value: string): number {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function needsLabel(el: Element): boolean {
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea' || tag === 'select') return true;
    if (tag !== 'input') return false;
    const type = (el.getAttribute('type') ?? 'text').toLowerCase();
    return ['hidden', 'submit', 'reset', 'button', 'image'].indexOf(type) === -1;
  }

  function hasAccessibleLabel(el: Element): boolean {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return true;

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        if (textOf(doc.getElementById(id))) return true;
      }
    }

    // The browser's own answer, which accounts for both `for` and wrapping.
    const labels = (el as any).labels as NodeListOf<Element> | undefined;
    if (labels && labels.length > 0) {
      for (const label of Array.from(labels)) if (textOf(label)) return true;
    }

    const wrapping = el.closest('label');
    if (wrapping && textOf(wrapping)) return true;

    return false;
  }

  function describe(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const type = el.getAttribute('type');
    const name = el.getAttribute('name');
    return tag + (type ? `[type=${type}]` : '') + (name ? ` (${name})` : '');
  }

  function evaluateOne(check: Record<string, any>): { ok: boolean; detail?: string } {
    switch (check.kind) {
      case 'element': {
        const found = all(check.selector, check.within);
        const min = check.min ?? 1;
        const max = check.max;
        if (found.length < min) {
          return {
            ok: false,
            detail:
              min === 1
                ? `Nothing matching \`${check.selector}\` yet.`
                : `Found ${found.length} of ${min} \`${check.selector}\`.`,
          };
        }
        if (typeof max === 'number' && found.length > max) {
          return {
            ok: false,
            detail: `There ${max === 1 ? 'should only be one' : `should be at most ${max}`} \`${check.selector}\` — found ${found.length}.`,
          };
        }
        return { ok: true };
      }

      case 'text': {
        const el = first(check.selector);
        if (!el) return { ok: false, detail: `No \`${check.selector}\` to read yet.` };
        const text = textOf(el);
        if (check.nonEmpty && !text) return { ok: false, detail: `\`${check.selector}\` is empty.` };
        if (check.contains && text.toLowerCase().indexOf(String(check.contains).toLowerCase()) === -1) {
          return { ok: false, detail: `\`${check.selector}\` does not mention “${check.contains}”.` };
        }
        if (check.matches) {
          try {
            if (!new RegExp(check.matches).test(text)) {
              return { ok: false, detail: `\`${check.selector}\` does not match the expected pattern.` };
            }
          } catch {
            return { ok: false, detail: 'Invalid pattern in this requirement.' };
          }
        }
        return { ok: true };
      }

      case 'attribute': {
        const found = all(check.selector);
        if (found.length === 0) {
          return { ok: false, detail: `No \`${check.selector}\` yet.` };
        }
        const subjects = check.everyMatch ? found : found.slice(0, 1);
        for (const el of subjects) {
          const value = el.getAttribute(check.attribute);
          if (check.present === false) {
            if (value !== null) return { ok: false, detail: `${describe(el)} should not have \`${check.attribute}\`.` };
            continue;
          }
          if (value === null) {
            return { ok: false, detail: `${describe(el)} has no \`${check.attribute}\`.` };
          }
          if (check.nonEmpty && !value.trim()) {
            return { ok: false, detail: `${describe(el)} has an empty \`${check.attribute}\`.` };
          }
          if (check.equals !== undefined && value !== check.equals) {
            return { ok: false, detail: `\`${check.attribute}\` on ${describe(el)} is “${value}”, not “${check.equals}”.` };
          }
          if (
            check.contains !== undefined &&
            value.toLowerCase().indexOf(String(check.contains).toLowerCase()) === -1
          ) {
            return { ok: false, detail: `\`${check.attribute}\` on ${describe(el)} does not include “${check.contains}”.` };
          }
        }
        return { ok: true };
      }

      case 'computedStyle': {
        const el = first(check.selector);
        if (!el) return { ok: false, detail: `No \`${check.selector}\` to style yet.` };
        const value = win.getComputedStyle(el).getPropertyValue(check.property).trim();
        if (check.equals !== undefined && value !== check.equals) {
          return { ok: false, detail: `\`${check.property}\` is \`${value || 'unset'}\`.` };
        }
        if (
          check.contains !== undefined &&
          value.toLowerCase().indexOf(String(check.contains).toLowerCase()) === -1
        ) {
          return { ok: false, detail: `\`${check.property}\` is \`${value || 'unset'}\`.` };
        }
        if (check.minNumber !== undefined || check.maxNumber !== undefined) {
          const n = numeric(value);
          if (Number.isNaN(n)) {
            return { ok: false, detail: `\`${check.property}\` is not a number yet.` };
          }
          if (check.minNumber !== undefined && n < check.minNumber) {
            return { ok: false, detail: `\`${check.property}\` is ${value}.` };
          }
          if (check.maxNumber !== undefined && n > check.maxNumber) {
            return { ok: false, detail: `\`${check.property}\` is ${value}.` };
          }
        }
        return { ok: true };
      }

      case 'noOverflow': {
        const root = doc.documentElement;
        // A pixel of slack: sub-pixel rounding should not read as a broken layout.
        const overflow = root.scrollWidth - root.clientWidth;
        if (overflow > 1) {
          return {
            ok: false,
            detail: `The page is ${Math.round(overflow)}px wider than the screen at ${check.atWidth}px.`,
          };
        }
        return { ok: true };
      }

      case 'labelledControl': {
        const controls = all(check.selector).filter(needsLabel);
        if (controls.length === 0) {
          return { ok: false, detail: `No form controls matching \`${check.selector}\` yet.` };
        }
        const unlabelled = controls.filter((el) => !hasAccessibleLabel(el));
        if (unlabelled.length > 0) {
          return {
            ok: false,
            detail: `${unlabelled.length === 1 ? 'One control has' : `${unlabelled.length} controls have`} no label: ${unlabelled
              .map(describe)
              .join(', ')}.`,
          };
        }
        return { ok: true };
      }

      case 'headingOutline': {
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        if (headings.length === 0) return { ok: false, detail: 'No headings yet.' };

        if (check.singleH1) {
          const h1s = headings.filter((el) => el.tagName.toLowerCase() === 'h1');
          if (h1s.length === 0) return { ok: false, detail: 'There is no h1.' };
          if (h1s.length > 1) return { ok: false, detail: `There are ${h1s.length} h1 elements — there should be one.` };
        }

        let previous = 0;
        for (const heading of headings) {
          const level = Number(heading.tagName.slice(1));
          if (previous !== 0 && level > previous + 1) {
            return {
              ok: false,
              detail: `The outline jumps from h${previous} to h${level} — “${textOf(heading).slice(0, 40)}”.`,
            };
          }
          previous = level;
        }
        return { ok: true };
      }

      case 'focusIndicator': {
        const el = first(check.selector) as HTMLElement | null;
        if (!el) return { ok: false, detail: `No \`${check.selector}\` to focus yet.` };

        const before = win.getComputedStyle(el);
        const beforeShadow = before.boxShadow;
        const previouslyFocused = doc.activeElement as HTMLElement | null;

        el.focus();
        const after = win.getComputedStyle(el);
        const outlineWidth = numeric(after.outlineWidth);
        const hasOutline = after.outlineStyle !== 'none' && outlineWidth > 0;
        const hasShadow = after.boxShadow !== 'none' && after.boxShadow !== beforeShadow;

        if (previouslyFocused && previouslyFocused !== el) previouslyFocused.focus();
        else el.blur();

        if (!hasOutline && !hasShadow) {
          return {
            ok: false,
            detail: 'Focusing this control shows nothing — the focus indicator has been removed.',
          };
        }
        return { ok: true };
      }

      default:
        return { ok: false, detail: `Unknown check "${String(check.kind)}".` };
    }
  }

  return {
    evaluate(items: CheckItem[]): CheckOutcome[] {
      return items.map((item) => {
        try {
          const result = evaluateOne(item.check);
          return result.ok
            ? { id: item.id, ok: true }
            : { id: item.id, ok: false, detail: result.detail };
        } catch (error) {
          return {
            id: item.id,
            ok: false,
            detail: error instanceof Error ? error.message : 'Check could not run.',
          };
        }
      });
    },
  };
}
