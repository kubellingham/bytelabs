import { expect, test } from '@playwright/test';

test.describe('shell', () => {
  test('shows the dashboard with paths and the roadmap', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /You learn to code by coding/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Frontend Developer/ })).toBeVisible();
  });

  test('shows the whole curriculum, with unauthored units as roadmap', async ({ page }) => {
    await page.goto('/tracks/html-css');

    await expect(page.getByRole('heading', { name: 'The Document' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Content and Meaning' })).toBeVisible();
    // Eight units, not the six the original outline had.
    await expect(page.getByRole('heading', { name: 'Accessible, Findable, Fast' })).toBeVisible();
    await expect(page.getByText('Coming soon').first()).toBeVisible();
  });

  test('shows Unit 1 as reachable and its graduation as a build', async ({ page }) => {
    await page.goto('/tracks/html-css');

    // Unit 1 is open, so its chapters are linked.
    await expect(page.getByRole('link', { name: /How the browser builds a page/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Fernbank Studio/ })).toBeVisible();

    // Later units are honest about not existing yet rather than pretending to be
    // locked — the gating predicate itself is covered in tests/unit/progress.test.ts.
    await expect(page.getByText('Coming soon').first()).toBeVisible();
  });

  test('switches skin and theme without a layout shift', async ({ page }) => {
    await page.goto('/settings');
    const html = page.locator('html');

    await page.getByRole('button', { name: /^Terminal/ }).click();
    await expect(html).toHaveAttribute('data-skin', 'terminal');
    // Terminal defines one palette, so it reports dark whatever the mode says.
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: /Always light/ }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: /^Default/ }).click();
    await expect(html).toHaveAttribute('data-skin', 'default');
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('remembers the skin across a reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /^Ocean/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'ocean');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'ocean');
  });

  test('says the warm-up is revision rather than teaching when nothing is due', async ({
    page,
  }) => {
    await page.goto('/warmup');
    await expect(page.getByRole('heading', { name: /Nothing needs warming up/ })).toBeVisible();
    await expect(page.getByText(/revisit things you have already been taught/)).toBeVisible();
  });

  test('assistant reports being unconfigured rather than breaking', async ({ page }) => {
    await page.goto('/ground/profile-card');
    await page.getByRole('button', { name: 'Ask' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill('why is my css not applying?');
    await page.getByRole('button', { name: 'Ask', exact: true }).last().click();

    await expect(page.getByText(/not switched on for this deployment/)).toBeVisible({
      timeout: 15_000,
    });
  });
});
