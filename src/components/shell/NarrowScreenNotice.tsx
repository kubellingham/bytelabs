/**
 * ByteLabs is a two-panel product. Rather than reflow the split into something
 * that teaches badly on a phone, it says so honestly — the doc is explicit that
 * learning to code on a phone keyboard is the wrong experience.
 *
 * Pure CSS: no viewport measurement, no hydration mismatch, no layout shift.
 */
export function NarrowScreenNotice() {
  return (
    <div className="fixed inset-0 z-100 hidden place-items-center bg-bg p-8 text-center max-[1023px]:grid">
      <div className="measure mx-auto">
        <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">ByteLabs</p>
        <h1 className="mt-4 text-[length:var(--bl-step-3)] font-semibold text-ink">
          This one needs a bigger screen.
        </h1>
        <p className="mt-4 text-muted">
          ByteLabs puts the explanation and the editor side by side, and you type real
          code on a real keyboard. That does not survive a phone screen, so we would
          rather you came back to it on a laptop than gave you a worse version of it.
        </p>
        <p className="mt-6 text-sm text-subtle">Open ByteLabs on a screen at least 1024px wide.</p>
      </div>
    </div>
  );
}
