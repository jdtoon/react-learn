import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { labs } from './labs';

const RenderTreeLab = labs['render-tree'];
const KeyChaosLab = labs['key-chaos'];
const ResetWithKeyLab = labs['reset-with-key'];

function lab(name: string) {
  const Component = labs[name];
  if (!Component) throw new Error(`No lab ${name}`);
  return render(<Component />);
}

function box(label: string): HTMLElement {
  return screen.getByRole('group', { name: label });
}

function count(label: string): number {
  const text = box(label).querySelector(':scope > .rb-head .rb-count')?.textContent ?? '';
  return Number(/\d+/.exec(text)?.[0]);
}

function counts(...labels: string[]): number[] {
  return labels.map(count);
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

describe('render-tree lab', () => {
  it('declares itself as a lab component', () => {
    expect(RenderTreeLab).toBeDefined();
    expect(KeyChaosLab).toBeDefined();
    expect(ResetWithKeyLab).toBeDefined();
  });

  it('mounts every node once', () => {
    lab('render-tree');
    expect(counts(...treeLabels)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it('renders every descendant of the component whose state changed, and nothing above it', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    await user.click(screen.getByRole('button', { name: 'Change App state' }));
    expect(counts(...treeLabels)).toEqual([1, 2, 2, 2, 2, 2, 2]);
  });

  it('does not touch siblings or ancestors when a lower component sets state', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    await user.click(screen.getByRole('button', { name: 'Change Feed state' }));
    expect(counts(...treeLabels)).toEqual([1, 1, 1, 2, 2, 2, 2]);
    await user.click(screen.getByRole('button', { name: 'Like Post A' }));
    expect(counts(...treeLabels)).toEqual([1, 1, 1, 2, 3, 2, 2]);
  });

  it('skips a memoised sidebar when its props are equal', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    await user.click(screen.getByRole('checkbox', { name: 'Wrap Sidebar in memo' }));
    expect(within(box('<Sidebar>')).getByText('memo')).toBeInTheDocument();
    expect(count('<Sidebar>')).toBe(1);
    const appBefore = count('<App>');
    await user.click(screen.getByRole('button', { name: 'Change App state' }));
    expect(count('<App>')).toBe(appBefore + 1);
    expect(count('<Sidebar>')).toBe(1);
    expect(counts('<Feed>', '<Post A>', '<Post B>', '<ThemeBadge>')).toEqual([
      appBefore + 1,
      appBefore + 1,
      appBefore + 1,
      appBefore + 1,
    ]);
  });

  it('renders a memoised sidebar anyway when a fresh array is passed each render', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    await user.click(screen.getByRole('checkbox', { name: 'Wrap Sidebar in memo' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Pass a fresh array to Sidebar each render' }),
    );
    const before = count('<Sidebar>');
    await user.click(screen.getByRole('button', { name: 'Change App state' }));
    expect(count('<Sidebar>')).toBe(before + 1);
  });

  it('re-renders only the provider and its consumer when context changes', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    await user.click(screen.getByRole('button', { name: 'Change theme' }));
    expect(counts(...treeLabels)).toEqual([2, 1, 1, 1, 1, 1, 2]);
    expect(within(box('<ThemeBadge>')).getByText('context: dark')).toBeInTheDocument();
  });

  it('bails out when state is set to the value it already has', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    await user.click(screen.getByRole('button', { name: 'Change App state' }));
    const before = counts(...treeLabels);
    await user.click(screen.getByRole('button', { name: 'Set App state to same value' }));
    expect(counts(...treeLabels)).toEqual(before);
  });

  it('summarises the last update as trigger, render and commit', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    const panel = screen.getByRole('status', { name: 'Last update' });
    expect(panel).toHaveTextContent('Press a button');

    await user.click(screen.getByRole('button', { name: 'Change Feed state' }));
    await within(panel).findByText('Change Feed state');
    expect(panel).toHaveTextContent(/4 of 7 components rendered/);
    expect(within(panel).getByRole('list', { name: 'Rendered' })).toHaveTextContent(
      'FeedPost APost BThemeBadge',
    );
    expect(within(panel).getByRole('list', { name: 'Not rendered' })).toHaveTextContent(
      'ThemeProviderAppSidebar',
    );
    expect(panel).toHaveTextContent(/1 DOM change\b/);
  });

  it('counts one DOM change when a whole subtree renders but only one text differs', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    const panel = screen.getByRole('status', { name: 'Last update' });
    await user.click(screen.getByRole('button', { name: 'Change App state' }));
    await within(panel).findByText('Change App state');
    expect(panel).toHaveTextContent('6 of 7 components rendered');
    expect(panel).toHaveTextContent(/1 DOM change\b/);
  });

  it('counts a changed class on a plain element and ignores the counters', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    const panel = screen.getByRole('status', { name: 'Last update' });
    await user.click(screen.getByRole('button', { name: 'Change theme' }));
    await within(panel).findByText('Change theme');
    expect(panel).toHaveTextContent(/3 DOM changes/);
  });

  it('reports that nothing rendered and nothing changed after a bail-out', async () => {
    const user = userEvent.setup();
    lab('render-tree');
    const panel = screen.getByRole('status', { name: 'Last update' });
    await user.click(screen.getByRole('button', { name: 'Set App state to same value' }));
    await within(panel).findByText('Set App state to same value');
    expect(panel).toHaveTextContent('0 of 7 components rendered');
    expect(panel).toHaveTextContent(/0 DOM changes/);
  });
});

function rows(): HTMLElement[] {
  return within(screen.getByRole('list', { name: 'Rows' })).getAllByRole('listitem');
}

function rowInput(index: number): HTMLInputElement {
  const input = within(rows()[index] as HTMLElement).getByRole('textbox');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected an input');
  return input;
}

function rowNames(): string[] {
  return rows().map((row) => row.getAttribute('data-person') ?? '');
}

describe('key-chaos lab', () => {
  it('starts with index keys and three rows', () => {
    lab('key-chaos');
    expect(screen.getByRole('button', { name: 'Index keys' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Stable ids' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(rowNames()).toEqual(['Ada', 'Grace', 'Linus']);
  });

  it('with index keys, text typed in the first row stays on top after an insert', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Insert at top' }));
    expect(rowNames()).toEqual(['Margaret', 'Ada', 'Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('alpha');
    expect(rowInput(1)).toHaveValue('');
    expect(rows()[0]).toHaveTextContent('Typed on Ada, now shown on Margaret');
    expect(rows()[0]).toHaveAttribute('data-misplaced', 'true');
  });

  it('with stable ids, the text moves down with its item', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.click(screen.getByRole('button', { name: 'Stable ids' }));
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Insert at top' }));
    expect(rowNames()).toEqual(['Margaret', 'Ada', 'Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('');
    expect(rowInput(1)).toHaveValue('alpha');
    expect(rows()[1]).toHaveTextContent('Typed on Ada');
    expect(rows()[1]).not.toHaveAttribute('data-misplaced');
  });

  it('with index keys, removing the first row hands its text to the next item', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Remove first' }));
    expect(rowNames()).toEqual(['Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('alpha');
    expect(rows()[0]).toHaveTextContent('Typed on Ada, now shown on Grace');
  });

  it('with stable ids, removing the first row removes its text', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.click(screen.getByRole('button', { name: 'Stable ids' }));
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Remove first' }));
    expect(rowNames()).toEqual(['Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('');
  });

  it('shuffles the items, and the text follows them only with stable ids', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Shuffle' }));
    expect(rowNames()).not.toEqual(['Ada', 'Grace', 'Linus']);
    expect([...rowNames()].sort()).toEqual(['Ada', 'Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('alpha');

    await user.click(screen.getByRole('button', { name: 'Stable ids' }));
    await user.type(rowInput(0), 'beta');
    const owner = rowNames()[0];
    await user.click(screen.getByRole('button', { name: 'Shuffle' }));
    const index = rowNames().indexOf(owner ?? '');
    expect(rowInput(index)).toHaveValue('beta');
  });

  it('switching the key strategy starts again from the original list', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.click(screen.getByRole('button', { name: 'Insert at top' }));
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Stable ids' }));
    expect(rowNames()).toEqual(['Ada', 'Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('');
  });

  it('reset restores the list and clears every input', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.type(rowInput(0), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Insert at top' }));
    await user.click(screen.getByRole('button', { name: 'Reset list' }));
    expect(rowNames()).toEqual(['Ada', 'Grace', 'Linus']);
    expect(rowInput(0)).toHaveValue('');
  });

  it('stops offering inserts at six rows and comes back after a removal', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    const insert = screen.getByRole('button', { name: 'Insert at top' });
    for (let index = 0; index < 3; index += 1) await user.click(insert);
    expect(rows()).toHaveLength(6);
    expect(insert).toHaveAttribute('aria-disabled', 'true');
    await user.click(insert);
    expect(rows()).toHaveLength(6);
    expect(screen.getByRole('status', { name: 'What React did' })).toHaveTextContent(/limit/);
    await user.click(screen.getByRole('button', { name: 'Remove first' }));
    expect(insert).not.toHaveAttribute('aria-disabled');
  });

  it('stops offering inserts when everyone in the roster has been used', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    const insert = screen.getByRole('button', { name: 'Insert at top' });
    for (let index = 0; index < 9; index += 1) {
      await user.click(insert);
      await user.click(screen.getByRole('button', { name: 'Remove first' }));
    }
    expect(insert).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: 'Reset list' }));
    expect(insert).not.toHaveAttribute('aria-disabled');
  });

  it('disables removal when one row is left', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    const remove = screen.getByRole('button', { name: 'Remove first' });
    await user.click(remove);
    await user.click(remove);
    expect(rows()).toHaveLength(1);
    expect(remove).toHaveAttribute('aria-disabled', 'true');
    await user.click(remove);
    expect(rows()).toHaveLength(1);
  });

  it('explains the last action in a live region', async () => {
    const user = userEvent.setup();
    lab('key-chaos');
    await user.click(screen.getByRole('button', { name: 'Insert at top' }));
    expect(screen.getByRole('status', { name: 'What React did' })).toHaveTextContent(
      /Inserted Margaret/,
    );
  });
});

function textbox(): HTMLInputElement {
  const input = screen.getByRole('textbox');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected an input');
  return input;
}

describe('reset-with-key lab', () => {
  it('starts on the first user keeping state', () => {
    lab('reset-with-key');
    expect(screen.getByRole('button', { name: 'Ada' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Keep state' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(textbox()).toHaveAccessibleName('Draft to Ada');
  });

  it('keeps the draft, the pin and the render count when the user changes', async () => {
    const user = userEvent.setup();
    lab('reset-with-key');
    await user.type(textbox(), 'hello');
    await user.click(screen.getByRole('button', { name: 'Pin conversation' }));
    await user.click(screen.getByRole('button', { name: 'Grace' }));
    expect(textbox()).toHaveAccessibleName('Draft to Grace');
    expect(textbox()).toHaveValue('hello');
    expect(screen.getByRole('button', { name: 'Pin conversation' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Typed for Ada, now addressed to Grace')).toBeInTheDocument();
    expect(count('<Profile>')).toBeGreaterThan(1);
  });

  it('starts from scratch for each user when keyed by user id', async () => {
    const user = userEvent.setup();
    lab('reset-with-key');
    await user.click(screen.getByRole('button', { name: 'Key by user id' }));
    await user.type(textbox(), 'hello');
    await user.click(screen.getByRole('button', { name: 'Pin conversation' }));
    await user.click(screen.getByRole('button', { name: 'Grace' }));
    expect(textbox()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Pin conversation' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(count('<Profile>')).toBe(1);
    expect(screen.queryByText(/now addressed to/)).not.toBeInTheDocument();
  });

  it('explains which rule applied', async () => {
    const user = userEvent.setup();
    lab('reset-with-key');
    await user.click(screen.getByRole('button', { name: 'Grace' }));
    expect(screen.getByRole('status', { name: 'What React did' })).toHaveTextContent(
      /same position.*kept/i,
    );
    await user.click(screen.getByRole('button', { name: 'Key by user id' }));
    await user.click(screen.getByRole('button', { name: 'Linus' }));
    expect(screen.getByRole('status', { name: 'What React did' })).toHaveTextContent(
      /key changed.*new one/i,
    );
  });
});
