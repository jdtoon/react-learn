import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('home renders the heading with no console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/react-learn/');
  await expect(page.getByRole('heading', { level: 1, name: 'React Field Guide' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('an unknown path falls back to the app shell', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/react-learn/some/unknown/path');
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'React Field Guide' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
