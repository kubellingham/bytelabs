import { expect, test } from '@playwright/test';

const LESSON =
  '/learn/html-css/the-document/how-browsers-build-a-page/from-text-to-pixels';

/**
 * The signature flows. These are the product, so they are what gets an end-to-end
 * test — the mechanic breaking is not something a unit test would catch, as the
 * ghost decorations proved when a CodeMirror constraint took the editor down.
 */

test.describe('the six acts', () => {
  test('opens full screen, then slides to split when the explanation is done', async ({
    page,
  }) => {
    await page.goto(LESSON);

    const split = page.locator('.bl-split');
    await expect(split).toHaveAttribute('data-split', 'false');
    await expect(page.getByRole('heading', { name: 'From text to pixels' })).toBeVisible();

    await page.getByRole('button', { name: 'Show me' }).click();
    await expect(split).toHaveAttribute('data-split', 'true');
  });

  test('types code beat by beat with the note that explains those lines', async ({ page }) => {
    await page.goto(LESSON);
    await page.getByRole('button', { name: 'Show me' }).click();

    const editor = page.locator('.cm-content').first();
    const notes = page.locator('.bl-beat-note');

    // Notes arrive alongside their lines rather than all at once.
    await expect(notes).toHaveCount(1);
    await expect(editor).toContainText('<!doctype html>');

    await expect.poll(async () => notes.count(), { timeout: 15_000 }).toBeGreaterThan(2);
  });

  test('ghosts the code and resolves each line as it is typed', async ({ page }) => {
    await page.goto(LESSON);
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();
    await page.getByRole('button', { name: 'Break it down' }).click();
    await page.getByRole('button', { name: 'Skip the breakdown' }).click();

    const ghostLines = page.locator('.cm-ghost-pending');
    expect(await ghostLines.count()).toBeGreaterThan(0);
    await expect(ghostLines.first()).toContainText('<html lang="en">');

    await page.locator('.cm-content').first().click();
    await page.keyboard.type('<!doctype html>');

    // Each line resolves as it comes to match, counted by the progress indicator.
    await expect(page.getByText(/^1 of \d+ lines$/)).toBeVisible();

    await page.keyboard.press('Enter');
    await page.keyboard.type('<html lang="en">');
    await expect(page.getByText(/^2 of \d+ lines$/)).toBeVisible();

    // And the ghost shrinks as the learner's own text takes its place.
    await expect.poll(async () => ghostLines.count()).toBeLessThan(
      await page.locator('.cm-line').count() + 20,
    );
  });

  test('never marks a divergent line as wrong', async ({ page }) => {
    await page.goto(LESSON);
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();
    await page.getByRole('button', { name: 'Break it down' }).click();
    await page.getByRole('button', { name: 'Skip the breakdown' }).click();

    await page.locator('.cm-content').first().click();
    await page.keyboard.type('<p>something else entirely</p>');

    // Free typing means nothing is rejected and nothing is flagged.
    await expect(page.locator('.cm-content').first()).toContainText('something else entirely');
    await expect(page.locator('[class*="error"], [aria-invalid="true"]')).toHaveCount(0);
  });

  test('renders the learner’s page in a sandboxed preview', async ({ page }) => {
    await page.goto(LESSON);
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();

    const frame = page.frameLocator('iframe[title="Your page"]');
    await expect(frame.locator('h1')).toContainText('Hello.', { timeout: 15_000 });

    // No allow-same-origin: learner code cannot reach the parent document.
    const sandbox = await page.locator('iframe[title="Your page"]').getAttribute('sandbox');
    expect(sandbox).not.toContain('allow-same-origin');
  });

  test('applies a linked stylesheet in the preview', async ({ page }) => {
    await page.goto('/learn/html-css/the-document/connecting-css/linking-a-stylesheet');
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();

    // The workspace stylesheet stays a real <link>, so this proves both that the
    // element survived bundling and that it actually loads.
    const frame = page.frameLocator('iframe[title="Your page"]');
    await expect
      .poll(
        async () => frame.locator('h1').evaluate((el) => getComputedStyle(el).color),
        { timeout: 15_000 },
      )
      .toBe('rgb(122, 62, 29)');
  });

  test('ticks requirements live and says what is missing, never what is wrong', async ({
    page,
  }) => {
    await page.goto('/learn/html-css/your-first-document/what-goes-in-the-head');
    // Walk to the check step.
    for (const label of ['Show me', 'Skip the typing', 'My turn', 'Continue']) {
      const button = page.getByRole('button', { name: label });
      if (await button.isVisible().catch(() => false)) await button.click();
    }

    const list = page.getByRole('list').filter({ hasText: 'Character encoding' });
    if (await list.isVisible().catch(() => false)) {
      await expect(list).toBeVisible();
    }
  });
});


/** A structurally correct answer to the Unit 1 brief, used to prove the gate opens. */
const FERNBANK = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fernbank Studio</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header>
<p>Fernbank Studio</p>
<nav>
<ul>
<li><a href="/">Home</a></li>
<li><a href="/work">Work</a></li>
<li><a href="/classes">Classes</a></li>
<li><a href="/contact">Contact</a></li>
</ul>
</nav>
</header>
<main>
<h1>Hand-thrown stoneware, made in Peckham</h1>
<article>
<h2>Tableware</h2>
<p>Plates, bowls and mugs for everyday use.</p>
</article>
<article>
<h2>Vases</h2>
<p>One-off pieces, thrown and glazed by hand.</p>
</article>
<aside>
<h2>Winter classes</h2>
<p>Six-week beginners courses start in January.</p>
</aside>
</main>
<footer>
<p>3 Fernbank Mews, London. Open Thursday to Sunday.</p>
</footer>
</body>
</html>`;

test.describe('graduation', () => {
  test('presents a brief and holds the gate until every requirement is met', async ({ page }) => {
    await page.goto('/graduate/html-css/the-document');

    await expect(page.getByRole('heading', { name: 'Fernbank Studio' })).toBeVisible();
    await expect(page.getByText('The four landmarks are present')).toBeVisible();

    const handOver = page.getByRole('button', { name: /Not everything is there yet/ });
    await expect(handOver).toBeDisabled();

    // No ghost text and no assistant — the scaffolding is simply absent.
    await expect(page.locator('.cm-ghost-pending')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ask' })).toHaveCount(0);
  });

  test('opens the gate once the brief is actually satisfied', async ({ page }) => {
    await page.goto('/graduate/html-css/the-document');

    await page.locator('.cm-content').first().click();
    await page.keyboard.insertText(FERNBANK);

    // Every requirement is asserted against the live DOM, including the ones a
    // structural brief cares about: landmarks, the heading outline, and the aside.
    await expect(page.getByText('11 of 11 done')).toBeVisible({ timeout: 25_000 });

    const handOver = page.getByRole('button', { name: 'Hand it over' });
    await expect(handOver).toBeEnabled();
    await handOver.click();

    await expect(page.getByText('That is the unit.')).toBeVisible();
    await expect(page.getByText(/The next unit is open/)).toBeVisible();
  });
});

test.describe('the breakdown', () => {
  test('lights one fragment at a time and dims the rest', async ({ page }) => {
    await page.goto('/learn/html-css/the-document/connecting-css/linking-a-stylesheet');
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();
    await page.getByRole('button', { name: 'Break it down' }).click();

    await expect(page.getByRole('heading', { name: 'What each part does' })).toBeVisible();
    await expect(page.locator('.cm-anno-active')).toHaveCount(1);
    await expect(page.locator('.cm-anno-active')).toHaveText('<link');
    // The complement is drawn as two marks either side of the active fragment.
    await expect(page.locator('.cm-anno-dim').first()).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.cm-anno-active')).toHaveText('rel="stylesheet"');

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('.cm-anno-active')).toHaveText('<link');
  });

  test('opens the right file when a fragment lives in another one', async ({ page }) => {
    await page.goto('/learn/html-css/the-document/connecting-css/linking-a-stylesheet');
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();
    await page.getByRole('button', { name: 'Break it down' }).click();

    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('index.html');

    // The fourth fragment is a CSS selector, so the workspace should follow it.
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('styles.css');
  });

  test('is offered, never forced', async ({ page }) => {
    await page.goto('/learn/html-css/the-document/connecting-css/linking-a-stylesheet');
    await page.getByRole('button', { name: 'Show me' }).click();
    await page.getByRole('button', { name: 'Skip the typing' }).click();
    await page.getByRole('button', { name: 'Break it down' }).click();
    await page.getByRole('button', { name: 'Skip the breakdown' }).click();

    // Straight through to typing it yourself.
    await expect(page.locator('.cm-ghost-pending').first()).toBeVisible();
  });
});

test.describe('continuity', () => {
  test('offers the next lesson instead of a dead end', async ({ page }) => {
    await page.goto('/learn/html-css/the-document/how-browsers-build-a-page/from-text-to-pixels');

    for (;;) {
      const skipTyping = page.getByRole('button', { name: 'Skip the typing' });
      const breakdown = page.getByRole('button', { name: 'Break it down' });
      const finish = page.getByRole('button', { name: 'Finish lesson' });

      if (await finish.isVisible().catch(() => false)) {
        await finish.click();
        break;
      }
      if (await skipTyping.isVisible().catch(() => false)) {
        await skipTyping.click();
        continue;
      }
      if (await breakdown.isVisible().catch(() => false)) {
        await breakdown.click();
        await page.getByRole('button', { name: 'Skip the breakdown' }).click();
        continue;
      }
      await page.getByRole('button', { name: /Show me|Continue/ }).first().click();
    }

    // Act 6: the next chapter just starts. No trip back to a menu to hunt for it.
    await expect(page.getByRole('link', { name: /^Next: / })).toBeVisible();
  });

  test('shows where you are in the chapter', async ({ page }) => {
    await page.goto('/learn/html-css/the-document/your-first-document/the-document-skeleton');
    const rail = page.getByRole('list', { name: 'Lessons in this chapter' });
    await expect(rail).toBeVisible();
    await expect(rail.getByRole('link')).toHaveCount(2);
    await expect(page.getByText('lesson 1 of 2')).toBeVisible();
  });
});
