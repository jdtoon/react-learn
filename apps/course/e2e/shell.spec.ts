import { expect, test } from '@playwright/test';

test('a deep link to a planned module shows when it arrives', async ({ page }) => {
  await page.goto('/react-learn/modules/21-mfe-why-and-when');
  await expect(page.getByRole('heading', { level: 1, name: 'Why & when' })).toBeVisible();
  await expect(page.getByText('Arrives in phase 1')).toBeVisible();
});

test('an unknown path shows not found with a link home', async ({ page }) => {
  await page.goto('/react-learn/nope');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the field guide' }).click();
  await expect(page).toHaveURL('/react-learn/');
  await expect(page.getByRole('heading', { level: 1, name: 'React Field Guide' })).toBeVisible();
});

test('a light theme choice persists after reload', async ({ page }) => {
  await page.goto('/react-learn/');
  await page.getByRole('button', { name: 'Light' }).click();
  await expect(page.locator('html[data-theme="light"]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('html[data-theme="light"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
});

test('the system theme leaves data-theme unset', async ({ page }) => {
  await page.goto('/react-learn/');
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html[data-theme="dark"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'System' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
});

test('the skip link is the first tab stop and moves focus to the content', async ({ page }) => {
  await page.goto('/react-learn/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('the left rail lists all modules on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/react-learn/');
  const rail = page.getByRole('navigation', { name: 'Course modules' });
  await expect(rail.getByRole('link')).toHaveCount(24);
  await rail.getByRole('link', { name: /Why & when/ }).click();
  await expect(page).toHaveURL('/react-learn/modules/21-mfe-why-and-when');
  await expect(rail.getByRole('link', { name: /Why & when/ })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test.describe('at 390px wide', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the home page does not scroll sideways', async ({ page }) => {
    await page.goto('/react-learn/');
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test('a planned module page does not scroll sideways', async ({ page }) => {
    await page.goto('/react-learn/modules/22-mfe-composition');
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test('the rail is a drawer that opens, navigates and closes', async ({ page }) => {
    await page.goto('/react-learn/');
    await expect(page.getByRole('navigation', { name: 'Course modules' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Open course navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Course modules' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: /Composition patterns/ }).click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL('/react-learn/modules/22-mfe-composition');
    await expect(page.locator('main')).toBeFocused();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Composition patterns' }),
    ).toBeVisible();
  });

  test('Escape closes the drawer and returns focus to the menu button', async ({ page }) => {
    await page.goto('/react-learn/');
    const menu = page.getByRole('button', { name: 'Open course navigation' });
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'Course modules' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(menu).toBeFocused();
  });
});
