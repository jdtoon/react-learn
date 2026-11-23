import { expect, test, type Page } from '@playwright/test';

async function expectHeadingWithoutErrors(page: Page, url: string) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'React Field Guide' })).toBeVisible();
  expect(errors).toEqual([]);
}

test('home renders the heading with no console errors', async ({ page }) => {
  await expectHeadingWithoutErrors(page, '/react-learn/');
});

test('an unknown path falls back to the app shell', async ({ page }) => {
  await expectHeadingWithoutErrors(page, '/react-learn/some/unknown/path');
});
