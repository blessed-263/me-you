import { expect, test } from '@playwright/test';

test.describe('client-side routing', () => {
  test('harvest-table RSVP route renders without full reload', async ({ page }) => {
    await page.goto('/harvest-table');
    await expect(page).toHaveURL(/\/harvest-table$/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('login route renders sign-in UI', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('legacy ticket login redirects to unified sign-in', async ({ page }) => {
    await page.goto('/tickets/login');
    await expect(page).toHaveURL(/\/login\?return=%2Ftickets%2Fpick/);
  });
});
