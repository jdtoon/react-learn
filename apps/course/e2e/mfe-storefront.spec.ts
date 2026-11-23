import { expect, test, type Page } from '@playwright/test';

const storefront = '/react-learn/lab/storefront';
const missingCatalog = '?remote-override=react-catalog=/react-learn/remotes/missing/remoteEntry.js';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('the catalog remote renders in the host, its hooks work and React is shared', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(storefront);

  const catalog = page.locator('[data-slot="catalog"]');
  await expect(catalog.getByRole('heading', { level: 3, name: 'Catalogue' })).toBeVisible();
  for (const name of ['Field jacket', 'Trail boots', 'Map case']) {
    await expect(catalog.getByText(name, { exact: true })).toBeVisible();
  }

  const counter = catalog.getByText(/^Added this visit: \d+$/);
  await expect(counter).toHaveText('Added this visit: 0');
  await catalog.getByRole('button', { name: 'Add Field jacket' }).click();
  await catalog.getByRole('button', { name: 'Add Map case' }).click();
  await expect(counter).toHaveText('Added this visit: 2');

  await expect(catalog).toHaveAttribute('data-state', 'ready');
  await expect(catalog.getByRole('list', { name: 'Products' })).toHaveCSS('display', 'grid');

  await page.getByRole('button', { name: 'X-ray' }).click();
  await expect(catalog.getByText('same React')).toBeVisible();
  await expect(
    catalog.getByText(/^Team Discovery · React · Module Federation · v1\.0\.0/),
  ).toBeVisible();

  expect(errors).toEqual([]);
});

test('slots with nothing deployed show a neutral placeholder', async ({ page }) => {
  await page.goto(storefront);

  for (const slot of ['promo', 'cart', 'recs', 'account', 'reviews', 'locator']) {
    await expect(page.locator(`[data-slot="${slot}"]`).getByText('Not built yet')).toBeVisible();
  }
});

test('a remote that 404s shows the slot fallback and the page stays interactive', async ({
  page,
}) => {
  await page.goto(`${storefront}${missingCatalog}`);

  const catalog = page.locator('[data-slot="catalog"]');
  await expect(catalog.getByRole('status')).toContainText('Catalogue is unavailable right now', {
    timeout: 8_000,
  });
  await expect(catalog).toHaveAttribute('data-state', 'failed');
  await expect(catalog.getByRole('button', { name: /^Add/ })).toHaveCount(0);

  const toggle = page.getByRole('button', { name: 'X-ray' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(catalog.getByText(/^Team Discovery · React · Module Federation/)).toBeVisible();

  await page.getByRole('banner').getByRole('link', { name: 'React Field Guide' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'React Field Guide' })).toBeVisible();
});
