import { within } from '@testing-library/dom';

export type TestStyle = 'detail' | 'behaviour';

export interface BasketTest {
  id: string;
  style: TestStyle;
  title: string;
  code: string;
  run: (host: HTMLElement, snapshot: string) => Promise<void>;
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function click(element: HTMLElement): Promise<void> {
  element.click();
  await tick();
}

function need(host: HTMLElement, selector: string): HTMLElement {
  const element = host.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Cannot find ${selector}`);
  return element;
}

function expectText(actual: string | null, expected: string): void {
  if (actual !== expected) throw new Error(`Expected "${expected}" but found "${actual ?? ''}"`);
}

function addButton(host: HTMLElement): HTMLElement {
  return within(host).getByRole('button', { name: /add to basket/i });
}

function status(host: HTMLElement): string | null {
  return within(host).getByRole('status').textContent;
}

export const basketTests: BasketTest[] = [
  {
    id: 'class',
    style: 'detail',
    title: 'Reads the count from the .basket-count class',
    code: `test('reads the count from .basket-count', async () => {
  render(<Basket />);
  await user.click(document.querySelector('.basket-add')!);
  expect(document.querySelector('.basket-count')).toHaveTextContent('1 item');
});`,
    run: async (host) => {
      const add = need(host, '.basket-add');
      const count = need(host, '.basket-count');
      await click(add);
      expectText(count.textContent, '1 item');
    },
  },
  {
    id: 'testid',
    style: 'detail',
    title: 'Finds the button by data-testid="add"',
    code: `test('finds the button by test id', async () => {
  render(<Basket />);
  await user.click(screen.getByTestId('add'));
  expect(screen.getByRole('status')).toHaveTextContent('1 item');
});`,
    run: async (host) => {
      await click(within(host).getByTestId('add'));
      expectText(status(host), '1 item');
    },
  },
  {
    id: 'snapshot',
    style: 'detail',
    title: 'Matches the stored markup snapshot',
    code: `test('matches the snapshot', () => {
  const { container } = render(<Basket />);
  expect(container).toMatchSnapshot();
});`,
    run: async (host, snapshot) => {
      if (host.innerHTML !== snapshot) throw new Error('Markup differs from the stored snapshot');
    },
  },
  {
    id: 'one',
    style: 'behaviour',
    title: 'Adding one item announces "1 item"',
    code: `test('adding one item announces it', async () => {
  render(<Basket />);
  await user.click(screen.getByRole('button', { name: /add to basket/i }));
  expect(screen.getByRole('status')).toHaveTextContent('1 item');
});`,
    run: async (host) => {
      await click(addButton(host));
      expectText(status(host), '1 item');
    },
  },
  {
    id: 'two',
    style: 'behaviour',
    title: 'Adding twice announces "2 items"',
    code: `test('adding twice announces 2 items', async () => {
  render(<Basket />);
  const add = screen.getByRole('button', { name: /add to basket/i });
  await user.click(add);
  await user.click(add);
  expect(screen.getByRole('status')).toHaveTextContent('2 items');
});`,
    run: async (host) => {
      const add = addButton(host);
      await click(add);
      await click(add);
      expectText(status(host), '2 items');
    },
  },
  {
    id: 'clear',
    style: 'behaviour',
    title: 'Clear empties a basket that has items',
    code: `test('clear empties the basket', async () => {
  render(<Basket />);
  const add = screen.getByRole('button', { name: /add to basket/i });
  await user.click(add);
  await user.click(add);
  expect(screen.getByRole('status')).toHaveTextContent('2 items');
  await user.click(screen.getByRole('button', { name: /clear/i }));
  expect(screen.getByRole('status')).toHaveTextContent('Basket is empty');
});`,
    run: async (host) => {
      const add = addButton(host);
      await click(add);
      await click(add);
      expectText(status(host), '2 items');
      await click(within(host).getByRole('button', { name: /clear/i }));
      expectText(status(host), 'Basket is empty');
    },
  },
];
