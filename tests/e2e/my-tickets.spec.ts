import { expect, test } from '@playwright/test';

test('my tickets unauthenticated redirects to login', async ({ page }) => {
  await page.goto('/tickets/my-tickets');
  await expect(page).toHaveURL(/\/login\?return=%2Ftickets%2Fmy-tickets/);
});
