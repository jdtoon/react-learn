import { expect, test, type Locator, type Page } from '@playwright/test';

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

const specimenHeadings = [
  'RichText',
  'RenderBox',
  'LabFrame',
  'Timeline',
  'Waterfall',
  'Compare',
  'Meter',
  'Stepper',
  'CodePeek',
  'Callout',
  'PitfallCard',
  'MeetingCardView',
  'SelfCheck',
  'sim.ts',
];

test('the gallery renders every kit component with no console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/react-learn/kit');
  await expect(page.getByRole('heading', { level: 1, name: 'Lab kit' })).toBeVisible();

  for (const name of specimenHeadings) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }

  await expect(page.locator('#rich-text code').first()).toBeVisible();
  await expect(box(page.locator('#render-box'), '<App>')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Counter lab' })).toBeVisible();
  await expect(page.locator('#timeline').getByRole('group', { name: 'Timeline' })).toBeVisible();
  await expect(page.locator('#waterfall').getByRole('list', { name: 'Requests' })).toBeVisible();
  await expect(page.locator('#compare .cmp')).toHaveCount(2);
  await expect(page.locator('#meter').getByRole('meter')).toHaveCount(4);
  await expect(
    page.locator('#stepper').getByRole('region', { name: 'Step-through' }),
  ).toBeVisible();
  await expect(
    page.locator('#code-peek').getByRole('button', { name: /Counter\.tsx/ }),
  ).toBeVisible();
  await expect(page.locator('#callout aside')).toHaveCount(3);
  await expect(page.locator('#pitfall-card').getByRole('heading', { level: 4 })).toBeVisible();
  await expect(page.locator('#meeting-card').getByText('Red flags', { exact: true })).toBeVisible();
  await expect(
    page.locator('#self-check').getByRole('button', { name: 'Reveal answer' }),
  ).toHaveCount(3);
  await expect(
    page.locator('#sim').getByRole('button', { name: /Run three chained requests/ }),
  ).toBeVisible();

  expect(errors).toEqual([]);
});

test('RenderBox counts commits and a memoized box skips them', async ({ page }) => {
  await page.goto('/react-learn/kit');
  const stage = page.locator('#render-box');
  const app = box(stage, '<App>');
  const sidebar = box(stage, '<Sidebar>');
  const feed = box(stage, '<Feed>');
  const postA = box(stage, '<Post A>');
  const postB = box(stage, '<Post B>');

  for (const target of [app, sidebar, feed, postA, postB]) {
    await expect(count(target)).toHaveText('renders 1');
  }

  await stage.getByRole('button', { name: /Change App state/ }).click();
  for (const target of [app, sidebar, feed, postA, postB]) {
    await expect(count(target)).toHaveText('renders 2');
  }

  await stage.getByRole('checkbox', { name: 'Wrap Sidebar in memo' }).check();
  await expect(sidebar.locator('.rb-memo')).toBeVisible();
  await expect(count(sidebar)).toHaveText('renders 1');
  await expect(count(app)).toHaveText('renders 3');

  await stage.getByRole('button', { name: /Change App state/ }).click();
  await expect(count(app)).toHaveText('renders 4');
  await expect(count(feed)).toHaveText('renders 4');
  await expect(count(sidebar)).toHaveText('renders 1');

  await postA.getByRole('button', { name: /Like Post/ }).click();
  await expect(count(postA)).toHaveText('renders 5');
  await expect(count(postB)).toHaveText('renders 4');
  await expect(count(app)).toHaveText('renders 4');
});

test('the flash animation runs by default', async ({ page }) => {
  await page.goto('/react-learn/kit');
  const stage = page.locator('#render-box');
  await stage.getByRole('button', { name: /Change App state/ }).click();
  const flashing = await page.evaluate(() =>
    document
      .getAnimations()
      .some(
        (animation) => animation instanceof CSSAnimation && animation.animationName === 'rb-flash',
      ),
  );
  expect(flashing).toBe(true);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('RenderBox still counts, highlights the latest commit and runs no CSS animation', async ({
    page,
  }) => {
    await page.goto('/react-learn/kit');
    const stage = page.locator('#render-box');
    const app = box(stage, '<App>');
    const sidebar = box(stage, '<Sidebar>');

    await stage.getByRole('checkbox', { name: 'Wrap Sidebar in memo' }).check();
    await stage.getByRole('button', { name: /Change App state/ }).click();
    await expect(count(app)).toHaveText('renders 3');
    await expect(count(sidebar)).toHaveText('renders 1');
    await expect(app).toHaveAttribute('data-latest', 'true');
    await expect(sidebar).not.toHaveAttribute('data-latest', 'true');

    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) => animation instanceof CSSAnimation && animation.playState === 'running',
          ).length,
    );
    expect(running).toBe(0);

    const headBackground = (target: Locator) =>
      target
        .locator(':scope > .rb-head')
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(await headBackground(app)).not.toBe('rgba(0, 0, 0, 0)');
    expect(await headBackground(sidebar)).toBe('rgba(0, 0, 0, 0)');
  });
});

test('the stepper moves with the buttons and the arrow keys', async ({ page }) => {
  await page.goto('/react-learn/kit');
  const stepper = page.locator('#stepper').getByRole('region', { name: 'Step-through' });
  await expect(stepper.getByText('Step 1 of 3')).toBeVisible();
  const next = stepper.getByRole('button', { name: 'Next step' });
  await next.click();
  await expect(stepper.getByText('Step 2 of 3')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(stepper.getByText('Step 3 of 3')).toBeVisible();
  await expect(next).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(stepper.getByText('Step 2 of 3')).toBeVisible();
  await stepper.getByRole('button', { name: 'Play' }).click();
  await expect(stepper.getByText('Step 3 of 3')).toBeVisible();
  await expect(stepper.getByRole('button', { name: 'Play' })).toBeVisible();
});

test('CodePeek opens, highlights and Compare, SelfCheck and PitfallCard respond', async ({
  page,
}) => {
  await page.goto('/react-learn/kit');

  const peek = page.locator('#code-peek').getByRole('button', { name: /Counter\.tsx/ });
  await expect(peek).toHaveAttribute('aria-expanded', 'false');
  await peek.click();
  await expect(peek).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#code-peek pre .sh__token--keyword').first()).toBeVisible();

  const answers = page.locator('#self-check').getByRole('button', { name: 'Reveal answer' });
  await answers.first().click();
  await expect(
    page.locator('#self-check').getByText(/React runs it again|Unless the child/),
  ).toBeVisible();

  const pitfall = page.locator('#pitfall-card');
  await expect(pitfall.locator('pre')).toContainText('key={index}');
  await pitfall.getByRole('button', { name: 'Good' }).click();
  await expect(pitfall.locator('pre')).toContainText('key={item.id}');

  const frame = page.getByRole('region', { name: 'Counter lab' });
  await frame.getByRole('button', { name: 'What just happened' }).click();
  await expect(frame.getByText(/skips it/)).toBeVisible();
});

test('the simulated requests chart fills in as requests settle', async ({ page }) => {
  await page.goto('/react-learn/kit');
  const sim = page.locator('#sim');
  await sim.getByRole('button', { name: /Run three chained requests/ }).click();
  const rows = sim.getByRole('list', { name: 'Requests' }).getByRole('listitem');
  await expect(rows.first()).toBeVisible();
  await expect(sim.getByText(/ok|failed/).first()).toBeVisible();
  await expect(sim.getByRole('button', { name: 'Run again with a new seed' })).toBeVisible();
});

test.describe('Compare layout', () => {
  test('shows two items side by side on a wide screen and one at a time on a narrow one', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/react-learn/kit');
    const compare = page.locator('#compare .cmp').first();
    await expect(compare.getByRole('group', { name: 'Index keys' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Stable keys' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Choose a view' })).toBeHidden();

    await page.setViewportSize({ width: 820, height: 900 });
    await expect(compare.getByRole('group', { name: 'Choose a view' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Index keys' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Stable keys' })).toBeHidden();
    await compare.getByRole('button', { name: 'Stable keys' }).click();
    await expect(compare.getByRole('group', { name: 'Stable keys' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Index keys' })).toBeHidden();
  });

  test('a three item comparison stays a toggle on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/react-learn/kit');
    const compare = page.locator('#compare .cmp').nth(1);
    await expect(compare.getByRole('group', { name: 'Choose a view' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Context' })).toBeVisible();
    await expect(compare.getByRole('group', { name: 'Selector store' })).toBeHidden();
  });
});

test.describe('at 390px wide', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the gallery does not scroll sideways', async ({ page }) => {
    await page.goto('/react-learn/kit');
    await expect(page.getByRole('heading', { level: 1, name: 'Lab kit' })).toBeVisible();
    await page
      .locator('#code-peek')
      .getByRole('button', { name: /Counter\.tsx/ })
      .click();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
});
