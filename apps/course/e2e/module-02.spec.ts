import { expect, test, type Locator, type Page } from '@playwright/test';

const modulePath = '/react-learn/modules/02-rendering';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

function box(scope: Locator | Page, label: string): Locator {
  return scope.getByRole('group', { name: label, exact: true });
}

function count(target: Locator): Locator {
  return target.locator(':scope > .rb-head .rb-count');
}

function treeLab(page: Page): Locator {
  return page.getByRole('region', { name: 'Who re-renders?' });
}

function keyLab(page: Page): Locator {
  return page.getByRole('region', { name: 'Key chaos' });
}

function resetLab(page: Page): Locator {
  return page.getByRole('region', { name: 'Reset with a key' });
}

function rowInputs(lab: Locator): Locator {
  return lab.getByRole('list', { name: 'Rows' }).getByRole('textbox');
}

async function open(page: Page) {
  await page.goto(modulePath);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Rendering & reconciliation' }),
  ).toBeVisible();
  await expect(treeLab(page)).toBeVisible();
}

const treeLabels = [
  '<ThemeProvider>',
  '<App>',
  '<Sidebar>',
  '<Feed>',
  '<Post A>',
  '<Post B>',
  '<ThemeBadge>',
];

async function expectCounts(lab: Locator, expected: number[]) {
  for (const [index, label] of treeLabels.entries()) {
    await expect(count(box(lab, label)), label).toHaveText(`renders ${expected[index]}`);
  }
}

test('the page has every section and the three labs, with no console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  for (const name of [
    'The model',
    'Labs',
    'Pitfalls',
    'In the meeting',
    'Self-check',
    'Go deeper',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }
  await expect(keyLab(page)).toBeVisible();
  await expect(resetLab(page)).toBeVisible();
  await expect(page.getByRole('link', { name: /Render and commit/ })).toHaveAttribute(
    'href',
    'https://react.dev/learn/render-and-commit',
  );
  expect(errors).toEqual([]);
});

test.describe('Who re-renders?', () => {
  test('Change App state renders every descendant, and a memoised Sidebar sits it out', async ({
    page,
  }) => {
    await open(page);
    const lab = treeLab(page);
    await expectCounts(lab, [1, 1, 1, 1, 1, 1, 1]);

    await lab.getByRole('button', { name: 'Change App state' }).click();
    await expectCounts(lab, [1, 2, 2, 2, 2, 2, 2]);

    await lab.getByRole('checkbox', { name: 'Wrap Sidebar in memo', exact: true }).check();
    await expect(box(lab, '<Sidebar>').locator('.rb-memo')).toBeVisible();
    await expectCounts(lab, [1, 3, 1, 3, 3, 3, 3]);

    await lab.getByRole('button', { name: 'Change App state' }).click();
    await expectCounts(lab, [1, 4, 1, 4, 4, 4, 4]);
  });

  test('a fresh array prop defeats memo', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('checkbox', { name: 'Wrap Sidebar in memo', exact: true }).check();
    await lab
      .getByRole('checkbox', { name: 'Pass a fresh array to Sidebar each render', exact: true })
      .check();
    const before = await count(box(lab, '<Sidebar>')).innerText();
    await lab.getByRole('button', { name: 'Change App state' }).click();
    await expect(count(box(lab, '<Sidebar>'))).not.toHaveText(before);
  });

  test('state set lower in the tree leaves ancestors and siblings alone', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'Change Feed state' }).click();
    await expectCounts(lab, [1, 1, 1, 2, 2, 2, 2]);
    await lab.getByRole('button', { name: 'Like Post A' }).click();
    await expectCounts(lab, [1, 1, 1, 2, 3, 2, 2]);
  });

  test('a context change renders the provider and its consumer only', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'Change theme' }).click();
    await expectCounts(lab, [2, 1, 1, 1, 1, 1, 2]);
    await expect(box(lab, '<ThemeBadge>')).toContainText('context: dark');
  });

  test('setting identical state renders nothing and writes nothing', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'Change App state' }).click();
    await lab.getByRole('button', { name: 'Set App state to same value' }).click();
    const summary = lab.getByRole('status', { name: 'Last update' });
    await expect(summary).toContainText('Set App state to same value');
    await expect(summary).toContainText('0 of 7 components rendered');
    await expect(summary).toContainText('0 DOM changes');
    await expectCounts(lab, [1, 2, 2, 2, 2, 2, 2]);
  });

  test('the summary shows trigger, render and commit for the last update', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'Change Feed state' }).click();
    const summary = lab.getByRole('status', { name: 'Last update' });
    await expect(summary).toContainText('4 of 7 components rendered');
    await expect(summary.getByRole('list', { name: 'Rendered', exact: true })).toContainText(
      'Feed',
    );
    await expect(summary.getByRole('list', { name: 'Not rendered' })).toContainText('App');
    await expect(summary).toContainText('1 DOM change');
  });

  test('a render that touches six components still commits a single DOM change', async ({
    page,
  }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'Change App state' }).click();
    const summary = lab.getByRole('status', { name: 'Last update' });
    await expect(summary).toContainText('6 of 7 components rendered');
    await expect(summary).toContainText('1 DOM change');
    await expect(summary).not.toContainText('DOM changes');
  });

  test('the controls work from the keyboard', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    const button = lab.getByRole('button', { name: 'Change App state' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(count(box(lab, '<App>'))).toHaveText('renders 2');
    await page.keyboard.press('Space');
    await expect(count(box(lab, '<App>'))).toHaveText('renders 3');
  });

  test('navigating within the page does not re-render the lab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'Change App state' }).click();
    await expect(count(box(lab, '<App>'))).toHaveText('renders 2');
    await page
      .getByRole('navigation', { name: 'On this page' })
      .getByRole('link', { name: 'Pitfalls' })
      .click();
    await expect(page).toHaveURL(/#pitfalls$/);
    await expectCounts(lab, [1, 2, 2, 2, 2, 2, 2]);
  });

  test('What just happened names the mechanism', async ({ page }) => {
    await open(page);
    const lab = treeLab(page);
    await lab.getByRole('button', { name: 'What just happened' }).click();
    await expect(lab.getByText(/shallowly|Object\.is/).first()).toBeVisible();
  });
});

test.describe('Key chaos', () => {
  test('with index keys the text stays on top after an insert', async ({ page }) => {
    await open(page);
    const lab = keyLab(page);
    const inputs = rowInputs(lab);
    await inputs.first().fill('alpha');
    await lab.getByRole('button', { name: 'Insert at top' }).click();
    await expect(inputs).toHaveCount(4);
    await expect(inputs.first()).toHaveValue('alpha');
    await expect(inputs.nth(1)).toHaveValue('');
    await expect(lab.getByText('Typed on Ada, now shown on Margaret')).toBeVisible();
  });

  test('with stable ids the text stays with its item', async ({ page }) => {
    await open(page);
    const lab = keyLab(page);
    await lab.getByRole('button', { name: 'Stable ids' }).click();
    const inputs = rowInputs(lab);
    await inputs.first().fill('alpha');
    await lab.getByRole('button', { name: 'Insert at top' }).click();
    await expect(inputs).toHaveCount(4);
    await expect(inputs.first()).toHaveValue('');
    await expect(inputs.nth(1)).toHaveValue('alpha');
    await expect(lab.getByText('Typed on Ada, now shown on')).toHaveCount(0);
  });

  test('remove first and shuffle respond and explain themselves', async ({ page }) => {
    await open(page);
    const lab = keyLab(page);
    const explain = lab.getByRole('status', { name: 'What React did' });
    await rowInputs(lab).first().fill('alpha');
    await lab.getByRole('button', { name: 'Remove first' }).click();
    await expect(rowInputs(lab)).toHaveCount(2);
    await expect(rowInputs(lab).first()).toHaveValue('alpha');
    await expect(explain).toContainText('Removed Ada');
    await lab.getByRole('button', { name: 'Shuffle' }).click();
    await expect(explain).toContainText('Shuffled');
    await lab.getByRole('button', { name: 'Reset list' }).click();
    await expect(rowInputs(lab)).toHaveCount(3);
    await expect(rowInputs(lab).first()).toHaveValue('');
  });
});

test.describe('Reset with a key', () => {
  test('keeping state carries the draft to the next user, keying clears it', async ({ page }) => {
    await open(page);
    const lab = resetLab(page);
    await lab.getByRole('textbox').fill('hello');
    await lab.getByRole('button', { name: 'Grace' }).click();
    await expect(lab.getByRole('textbox')).toHaveValue('hello');
    await expect(lab.getByText('Typed for Ada, now addressed to Grace')).toBeVisible();

    await lab.getByRole('button', { name: 'Key by user id' }).click();
    await lab.getByRole('textbox').fill('hello');
    await lab.getByRole('button', { name: 'Linus' }).click();
    await expect(lab.getByRole('textbox')).toHaveValue('');
    await expect(count(box(lab, '<Profile>'))).toHaveText('renders 1');
  });
});

test('Mark complete persists after a reload', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByRole('button', { name: 'Mark incomplete' })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Rendering & reconciliation' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark incomplete' })).toBeVisible();
});

test('the home map shows module 02 as built', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/react-learn/');
  const node = page
    .getByRole('region', { name: /modules across/ })
    .getByRole('link', { name: /Rendering & reconciliation/ });
  await expect(node).toBeVisible();
  await expect(node).not.toHaveAccessibleName(/planned/);
});

test.describe('at 390px wide', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the module and its labs do not scroll sideways', async ({ page }) => {
    await open(page);
    await keyLab(page).getByRole('button', { name: 'Insert at top' }).click();
    await keyLab(page).getByRole('button', { name: 'Insert at top' }).click();
    await treeLab(page).getByRole('button', { name: 'Change Feed state' }).click();
    await resetLab(page).getByRole('button', { name: 'Key by user id' }).click();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
});

test.describe('deep links with a hash', () => {
  test('opening a section link fresh scrolls the Labs heading into view', async ({ page }) => {
    await page.goto(`${modulePath}#labs`);
    const heading = page.getByRole('heading', { level: 2, name: 'Labs', exact: true });
    await expect(heading).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('lands on the section at once when the visitor prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${modulePath}#labs`);
    const heading = page.getByRole('heading', { level: 2, name: 'Labs', exact: true });
    await expect(heading).toBeInViewport({ ratio: 1 });
  });

  test('a link without a hash stays at the top', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
