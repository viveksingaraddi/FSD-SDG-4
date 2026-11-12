import { test, expect } from '@playwright/test';

test.describe('Application shell — Phase 4 foundation', () => {
  test('home page loads and shows the main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('skip-to-main-content link is present in DOM', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeAttached();
  });

  test('404 page shows page-not-found heading for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  });
});
