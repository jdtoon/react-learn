import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

vi.mock('./PaletteBody', () => {
  throw new TypeError('Failed to fetch dynamically imported module');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CommandPalette when its chunk fails to load', () => {
  it('keeps the app alive and explains inside the dialog', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <p>rest of the app</p>
        <CommandPalette />
      </MemoryRouter>,
    );
    await user.keyboard('{Control>}k{/Control}');
    const dialog = screen.getByRole('dialog', { name: 'Search' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Search could not load. Reload the page to try again.',
    );
    expect(dialog).toContainElement(screen.getByRole('alert'));
    expect(screen.getByText('rest of the app')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('rest of the app')).toBeInTheDocument();
  });
});
