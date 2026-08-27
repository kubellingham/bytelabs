import type { Prose as ProseBlock } from '@/lib/content/schema';

/**
 * Renders the small closed set of prose blocks the tutor panel supports.
 *
 * Inline formatting is markdown-lite — backtick code spans and **bold** only —
 * parsed here rather than pulled in as a markdown dependency. The content schema
 * defines what is expressible; anything richer should become a block kind, not a
 * looser parser.
 */

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*)/g;

function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE).filter((part) => part.length > 0);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={index}
              className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[0.86em] text-accent"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={index} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function Prose({ blocks }: { blocks: readonly ProseBlock[] }) {
  return (
    <div className="measure space-y-4">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <h3
                key={index}
                className="pt-2 text-[length:var(--bl-step-1)] font-semibold text-ink"
              >
                <Inline text={block.text} />
              </h3>
            );

          case 'p':
            return (
              <p key={index} className="text-muted">
                <Inline text={block.text} />
              </p>
            );

          case 'list':
            return block.ordered ? (
              <ol key={index} className="list-decimal space-y-2 ps-6 text-muted marker:text-subtle">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={index} className="list-disc space-y-2 ps-6 text-muted marker:text-subtle">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );

          case 'code':
            return (
              <pre
                key={index}
                className="bl-scroll overflow-x-auto rounded-lg border border-line bg-code p-4 text-[0.82rem] leading-relaxed"
              >
                <code>{block.code}</code>
              </pre>
            );

          case 'note':
            return (
              <aside
                key={index}
                className="rounded-lg border-s-2 border-accent bg-accent-soft/50 px-4 py-3 text-sm text-muted"
              >
                <Inline text={block.text} />
              </aside>
            );
        }
      })}
    </div>
  );
}
