import type { WorkspaceFiles } from '@/lib/content/schema';

/**
 * Resolves a multi-file workspace into a single document for a sandboxed iframe.
 *
 * A workspace stylesheet stays a real `<link rel="stylesheet">` with its href
 * rewritten to a `data:` URL, rather than being replaced by a `<style>` block.
 * That matters: Unit 1's fifth chapter is "Connecting CSS", and its requirement is
 * literally "a stylesheet is linked". Swapping the element out made that
 * requirement impossible to satisfy — a learner could do everything right and the
 * gate would never open. Keeping the element means the check tests the thing it
 * claims to, and the preview behaves like a browser actually would.
 *
 * Scripts are inlined, since nothing checks for a script element and a data: URL
 * script is blocked by the sandbox anyway.
 *
 * This is deliberately a small, targeted rewrite rather than a real bundler. The
 * input is one learner's own hand-written HTML, not arbitrary documents, and the
 * failure mode of missing a case is a stylesheet that does not apply — visible
 * immediately, and itself a lesson.
 */

const LINK_TAG = /<link\b[^>]*>/gi;
const SCRIPT_TAG = /<script\b([^>]*)>\s*<\/script>/gi;
const ATTR = (name: string) => new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');

function attr(tag: string, name: string): string | null {
  const match = ATTR(name).exec(tag);
  if (!match) return null;
  return match[2] ?? match[3] ?? null;
}

/** Normalises `./styles.css` and `/styles.css` to the workspace key `styles.css`. */
function normalisePath(href: string): string {
  return href.replace(/^\.?\//, '');
}

function escapeClosingTag(source: string, tag: 'style' | 'script'): string {
  // A literal `</style>` inside CSS would end the block early. Rare, but a learner
  // writing about CSS in a comment should not silently break their own page.
  return source.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
}

export interface BundleOptions {
  /** Injected into the head — the check evaluator, in practice. */
  headScript?: string;
  /** Entry point. Defaults to index.html, or the only HTML file present. */
  entry?: string;
}

export function findEntry(files: WorkspaceFiles, preferred = 'index.html'): string | null {
  if (files[preferred] !== undefined) return preferred;
  const html = Object.keys(files).filter((path) => /\.html?$/i.test(path));
  return html[0] ?? null;
}

export function bundleWorkspace(files: WorkspaceFiles, options: BundleOptions = {}): string {
  const entry = options.entry ?? findEntry(files);
  if (entry === null) return '<!doctype html><html><body></body></html>';

  let html = files[entry] ?? '';

  html = html.replace(LINK_TAG, (tag) => {
    const rel = attr(tag, 'rel');
    const href = attr(tag, 'href');
    if (!rel || rel.toLowerCase() !== 'stylesheet' || !href) return tag;

    const path = normalisePath(href);
    const contents = files[path];
    if (contents === undefined) return tag; // External or missing — leave it be.

    // Same element, same rel, real stylesheet — only the href is swapped for the
    // file's contents. The original path is kept so it is legible when inspected.
    const dataUrl = `data:text/css;charset=utf-8,${encodeURIComponent(contents)}`;
    return tag
      .replace(ATTR('href'), `href="${dataUrl}" data-from="${path}"`);
  });

  html = html.replace(SCRIPT_TAG, (tag, attrs: string) => {
    const src = attr(`<script ${attrs}>`, 'src');
    if (!src) return tag;
    const contents = files[normalisePath(src)];
    if (contents === undefined) return tag;
    return `<script data-from="${normalisePath(src)}">\n${escapeClosingTag(contents, 'script')}\n</script>`;
  });

  if (options.headScript) {
    const injected = `<script>${options.headScript}</script>`;
    // Prefer just before </body> so the DOM exists when it runs; fall back to append.
    if (/<\/body\s*>/i.test(html)) {
      html = html.replace(/<\/body\s*>/i, `${injected}</body>`);
    } else {
      html += injected;
    }
  }

  return html;
}
