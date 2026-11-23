import { expect, test, type Page } from '@playwright/test';

const deepPath = '/react-learn/modules/02-rendering';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('a path with no file is answered with the app shell, as Pages does with 404.html', async ({
  request,
}) => {
  const deep = await request.get(deepPath);
  const shell = await request.get('/react-learn/404.html');
  const home = await request.get('/react-learn/');
  const deepBody = await deep.text();

  expect(shell.ok()).toBe(true);
  expect(deepBody).toContain('<div id="root"></div>');
  expect(deepBody).toBe(await shell.text());
  expect(deepBody).toBe(await home.text());
});

test('the deep link renders its module or planned page with no console errors', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(deepPath);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Rendering & reconciliation' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('button', { name: /^Mark (in)?complete$/ })
      .or(page.getByText('Arrives in phase 0')),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('reloading a deep link keeps the page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(deepPath);
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Rendering & reconciliation' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
