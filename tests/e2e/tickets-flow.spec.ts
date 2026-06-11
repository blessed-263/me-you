import { expect, test } from '@playwright/test';

test('tickets entry renders', async ({ page }) => {
  await page.goto('/tickets');
  await expect(page).toHaveURL(/\/tickets/);
});
