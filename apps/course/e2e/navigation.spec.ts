import { expect, test, type Page } from '@playwright/test';

async function expectNoSidewaysScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

test.describe('command palette', () => {
  test('Ctrl+K opens search and Enter opens the first match', async ({ page }) => {
    await page.goto('/react-learn/');
    await page.keyboard.press('Control+K');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('combobox', { name: 'Search modules, terms and talk tracks' }),
    ).toBeFocused();
    await page.keyboard.type('micro');
    await expect(dialog.getByRole('option').first()).toContainText('Why & when');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/react-learn\/modules\/2\d-mfe-/);
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Why & when' })).toBeVisible();
  });

  test('the top bar button opens it and Escape returns focus to the button', async ({ page }) => {
    await page.goto('/react-learn/');
    const button = page.getByRole('banner').getByRole('button', { name: /Search/ });
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test('arrow keys move the highlight and Enter opens that result', async ({ page }) => {
    await page.goto('/react-learn/');
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.type('micro');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/react-learn/modules/22-mfe-composition');
  });

  test('shows a message when nothing matches', async ({ page }) => {
    await page.goto('/react-learn/');
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.type('zzzzqx');
    await expect(page.getByRole('dialog', { name: 'Search' })).toContainText('No results');
  });

  test('Ctrl+K again closes it', async ({ page }) => {
    await page.goto('/react-learn/');
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('home map', () => {
  test('shows every track as a lane and every module as a node', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/react-learn/');
    const map = page.getByRole('region', { name: /modules across/ });
    await expect(map.getByRole('region')).toHaveCount(6);
    await expect(map.getByRole('link')).toHaveCount(24);
    await expect(map.getByRole('link', { name: /Why & when/ })).toHaveAccessibleName(/planned/);
  });

  test('nodes are reachable by keyboard and open their module', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/react-learn/');
    const node = page
      .getByRole('region', { name: /modules across/ })
      .getByRole('link', { name: /Composition patterns/ });
    await node.focus();
    await expect(node).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/react-learn/modules/22-mfe-composition');
  });

  test('the hero links to meeting mode', async ({ page }) => {
    await page.goto('/react-learn/');
    await page.getByRole('link', { name: 'Prep for a meeting' }).click();
    await expect(page).toHaveURL('/react-learn/meeting');
    await expect(page.getByRole('heading', { level: 1, name: 'Meeting mode' })).toBeVisible();
  });

  test('reports overall progress', async ({ page }) => {
    await page.goto('/react-learn/');
    await expect(page.getByRole('progressbar', { name: 'Course progress' })).toHaveAttribute(
      'aria-valuetext',
      '0 of 24 modules completed',
    );
  });
});

test.describe('meeting mode and glossary', () => {
  test("meeting mode shows module 02's card", async ({ page }) => {
    await page.goto('/react-learn/meeting');
    await expect(page.getByRole('heading', { level: 1, name: 'Meeting mode' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No meeting cards yet' })).toHaveCount(0);
    const card = page.getByRole('article').filter({ hasText: 'Rendering & reconciliation' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Red flags', { exact: true })).toBeVisible();
    await expect(card.getByText('Trade-off', { exact: true })).toBeVisible();
  });

  test("the glossary shows module 02's terms", async ({ page }) => {
    await page.goto('/react-learn/glossary');
    await expect(page.getByRole('heading', { level: 1, name: 'Glossary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No terms yet' })).toHaveCount(0);
    await expect(page.getByRole('term').filter({ hasText: 'Reconciliation' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: '02 Rendering & reconciliation' }).first(),
    ).toBeVisible();
  });

  test('the top bar links to meeting mode', async ({ page }) => {
    await page.goto('/react-learn/');
    await page.getByRole('banner').getByRole('link', { name: 'Meeting mode' }).click();
    await expect(page).toHaveURL('/react-learn/meeting');
  });
});

test.describe('at 390px wide', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('meeting mode and the glossary do not scroll sideways', async ({ page }) => {
    await page.goto('/react-learn/meeting');
    await expect(
      page.getByRole('heading', { level: 3, name: 'Rendering & reconciliation' }),
    ).toBeVisible();
    await expectNoSidewaysScroll(page);
    await page.goto('/react-learn/glossary');
    await expect(page.getByRole('term').filter({ hasText: 'Reconciliation' })).toBeVisible();
    await expectNoSidewaysScroll(page);
  });

  test('the map stacks its nodes and stays inside the viewport', async ({ page }) => {
    await page.goto('/react-learn/');
    const node = page
      .getByRole('region', { name: /modules across/ })
      .getByRole('link', { name: /Why & when/ });
    await node.scrollIntoViewIfNeeded();
    const box = await node.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    await expectNoSidewaysScroll(page);
  });

  test('the search dialog fits the screen and opens from the top bar', async ({ page }) => {
    await page.goto('/react-learn/');
    await page
      .getByRole('banner')
      .getByRole('button', { name: /Search/ })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.type('frame');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/react-learn/modules/11-frame-budget');
  });
});
