import { expect, test } from '@playwright/test';

test('homepage loads and exposes ticket CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /buy tickets/i })).toBeVisible();
});

test('organizer login route redirects to unified login', async ({ page }) => {
  await page.goto('/organizer/login');
  await expect(page).toHaveURL(/\/login\?return=/);
});
