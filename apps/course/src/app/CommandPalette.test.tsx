import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CommandPalette } from './CommandPalette';

function Where() {
  const { pathname, hash } = useLocation();
  return <p data-testid="where">{pathname + hash}</p>;
}

function renderPalette() {
  render(
    <MemoryRouter>
      <CommandPalette />
      <Where />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe('CommandPalette', () => {
  it('is closed until the search button is pressed', async () => {
    const user = renderPalette();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Search/ }));
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('opens and closes with Ctrl+K', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with Cmd+K', async () => {
    const user = renderPalette();
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('offers the main pages before anything is typed', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k{/Control}');
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options.some((text) => text?.includes('Meeting mode'))).toBe(true);
    expect(options.some((text) => text?.includes('Glossary'))).toBe(true);
  });

  it('lists matches with their kind and opens the highlighted one on Enter', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k');
    await user.keyboard('{/Control}micro');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Why & when');
    expect(options[0]).toHaveTextContent('Module');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('where')).toHaveTextContent('/modules/21-mfe-why-and-when');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves the highlight with the arrow keys', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k{/Control}micro{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('where')).toHaveTextContent('/modules/22-mfe-composition');
  });

  it('opens a result when it is clicked', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k{/Control}frame');
    await user.click(screen.getByRole('option', { name: /frame budget/i }));
    expect(screen.getByTestId('where')).toHaveTextContent('/modules/11-frame-budget');
  });

  it('says when nothing matches', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k{/Control}zzzzqx');
    const dialog = screen.getByRole('dialog', { name: 'Search' });
    expect(within(dialog).queryAllByRole('option')).toHaveLength(0);
    expect(within(dialog).getByText(/No results for/)).toBeInTheDocument();
  });

  it('starts fresh each time it opens', async () => {
    const user = renderPalette();
    await user.keyboard('{Control>}k{/Control}micro{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('combobox')).toHaveValue('');
  });
});
