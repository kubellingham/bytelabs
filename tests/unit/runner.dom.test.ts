/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { bundleWorkspace, findEntry } from '@/lib/runner/bundle';
import { createChecker, type CheckItem } from '@/lib/runner/checker';

function render(html: string): Document {
  const doc = document.implementation.createHTMLDocument('test');
  doc.documentElement.innerHTML = html;
  return doc;
}

function run(doc: Document, checks: Record<string, unknown>[]) {
  const items: CheckItem[] = checks.map((check, index) => ({ id: String(index), check }));
  return createChecker(doc, window).evaluate(items);
}

describe('bundleWorkspace', () => {
  it('keeps a workspace stylesheet as a real link element', () => {
    const out = bundleWorkspace({
      'index.html':
        '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body></body></html>',
      'styles.css': 'body { color: red; }',
    });

    // The element has to survive: Unit 1 checks that a stylesheet is *linked*,
    // and replacing the link with a <style> block made that unsatisfiable.
    expect(out).toContain('<link rel="stylesheet"');
    expect(out).toContain('data-from="styles.css"');
    expect(out).toContain('data:text/css');
    expect(out).toContain(encodeURIComponent('body { color: red; }'));
  });

  it('normalises ./ and / prefixes to workspace keys', () => {
    const out = bundleWorkspace({
      'index.html': '<link rel="stylesheet" href="./styles.css">',
      'styles.css': '.a{}',
    });
    expect(out).toContain('data-from="styles.css"');
  });

  it('leaves external stylesheets alone', () => {
    const href = 'https://example.com/x.css';
    const out = bundleWorkspace({ 'index.html': `<link rel="stylesheet" href="${href}">` });
    expect(out).toContain(href);
  });

  it('injects the head script before the closing body tag', () => {
    const out = bundleWorkspace(
      { 'index.html': '<html><body><p>hi</p></body></html>' },
      { headScript: 'var x = 1;' },
    );
    expect(out.indexOf('var x = 1;')).toBeLessThan(out.indexOf('</body>'));
  });

  it('falls back to any html file when there is no index', () => {
    expect(findEntry({ 'about.html': '' })).toBe('about.html');
    expect(findEntry({ 'styles.css': '' })).toBeNull();
  });
});

describe('checker', () => {
  it('counts elements with min and max', () => {
    const doc = render('<body><article></article><article></article></body>');
    expect(run(doc, [{ kind: 'element', selector: 'article', min: 2 }])[0]?.ok).toBe(true);
    expect(run(doc, [{ kind: 'element', selector: 'article', min: 1, max: 1 }])[0]?.ok).toBe(false);
    expect(run(doc, [{ kind: 'element', selector: 'main' }])[0]?.ok).toBe(false);
  });

  it('requires alt on every image when everyMatch is set', () => {
    const good = render('<body><img alt="A cat"><img alt="A dog"></body>');
    const bad = render('<body><img alt="A cat"><img></body>');
    const check = { kind: 'attribute', selector: 'img', attribute: 'alt', nonEmpty: true, everyMatch: true };
    expect(run(good, [check])[0]?.ok).toBe(true);
    expect(run(bad, [check])[0]?.ok).toBe(false);
  });

  it('accepts a label associated by for, by wrapping, or by aria-label', () => {
    const check = { kind: 'labelledControl', selector: 'input, textarea' };

    const byFor = render('<body><label for="a">Name</label><input id="a"></body>');
    const byWrap = render('<body><label>Name <input></label></body>');
    const byAria = render('<body><input aria-label="Name"></body>');
    const none = render('<body><input placeholder="Name"></body>');

    expect(run(byFor, [check])[0]?.ok).toBe(true);
    expect(run(byWrap, [check])[0]?.ok).toBe(true);
    expect(run(byAria, [check])[0]?.ok).toBe(true);
    // A placeholder is not a label. This is the whole point of the requirement.
    expect(run(none, [check])[0]?.ok).toBe(false);
  });

  it('ignores controls that do not need a label', () => {
    const doc = render('<body><label for="a">Name</label><input id="a"><input type="submit"></body>');
    expect(run(doc, [{ kind: 'labelledControl', selector: 'input' }])[0]?.ok).toBe(true);
  });

  it('reads the heading outline', () => {
    const ok = render('<body><h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2></body>');
    const skips = render('<body><h1>A</h1><h3>B</h3></body>');
    const twoH1 = render('<body><h1>A</h1><h1>B</h1></body>');

    expect(run(ok, [{ kind: 'headingOutline', singleH1: true }])[0]?.ok).toBe(true);
    expect(run(skips, [{ kind: 'headingOutline' }])[0]?.ok).toBe(false);
    expect(run(twoH1, [{ kind: 'headingOutline', singleH1: true }])[0]?.ok).toBe(false);
  });

  it('reports what is missing rather than that something is wrong', () => {
    const doc = render('<body></body>');
    const [outcome] = run(doc, [{ kind: 'element', selector: 'main' }]);
    expect(outcome?.ok).toBe(false);
    expect(outcome?.detail).toContain('main');
  });

  it('survives an invalid selector without throwing', () => {
    const doc = render('<body></body>');
    expect(() => run(doc, [{ kind: 'element', selector: ':::' }])).not.toThrow();
    expect(run(doc, [{ kind: 'element', selector: ':::' }])[0]?.ok).toBe(false);
  });
});
