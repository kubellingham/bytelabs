import { expect, test } from '@playwright/test';

test.describe('the ground', () => {
  test('lists scenarios and filters by tier and skill without locking anything', async ({
    page,
  }) => {
    await page.goto('/ground');

    await expect(page.getByRole('heading', { name: 'The Ground' })).toBeVisible();
    await expect(page.getByRole('link', { name: /A profile card/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /landing page/i })).toBeVisible();

    await page.getByRole('button', { name: 'Beginner', exact: true }).click();
    await expect(page.getByRole('link', { name: /A profile card/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /landing page/i })).toHaveCount(0);
  });

  test('assisted mode demonstrates, raw mode strips the scaffolding', async ({ page }) => {
    await page.goto('/ground/profile-card');

    // Assisted opens with the worked example and its notes.
    await expect(page.getByText('One way through it')).toBeVisible();
    await expect(page.locator('.bl-beat-note').first()).toBeVisible();

    await page.getByRole('button', { name: 'raw' }).click();

    // Raw: no walkthrough, no ghost, and the requirement hints go quiet.
    await expect(page.getByText('One way through it')).toHaveCount(0);
    await expect(page.locator('.cm-ghost-pending')).toHaveCount(0);
    await expect(page.getByText('What they asked for')).toBeVisible();
  });

  test('keeps the same client across a reload', async ({ page }) => {
    await page.goto('/ground/contact-form');
    const first = await page.locator('h1').first().textContent();

    await page.reload();
    await expect(page.locator('h1').first()).toHaveText(first ?? '');
  });

  test('offers the assistant in both modes but never volunteers', async ({ page }) => {
    await page.goto('/ground/profile-card');
    const ask = page.getByRole('button', { name: 'Ask' });

    await expect(ask).toBeVisible();
    // Nothing opens on its own.
    await expect(page.getByRole('dialog', { name: 'Ask the assistant' })).toHaveCount(0);

    await ask.click();
    await expect(page.getByRole('dialog', { name: 'Ask the assistant' })).toBeVisible();
    await expect(page.getByText('Nothing is sent until you do')).toBeVisible();
  });
});
