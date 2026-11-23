import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from './router';

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('routes', () => {
  it('renders the home page with the course heading', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'React Field Guide' }),
    ).toBeInTheDocument();
  });

  it('renders the planned page for a module that is not built', async () => {
    renderAt('/modules/21-mfe-why-and-when');
    expect(await screen.findByText('Arrives in phase 1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Why & when' })).toBeInTheDocument();
  });

  it('renders not found for an unknown module slug', async () => {
    renderAt('/modules/99-nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('renders not found for an unknown path and links home', async () => {
    renderAt('/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the field guide' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it.each([
    ['/meeting', 'Meeting mode', 'No meeting cards yet'],
    ['/glossary', 'Glossary', 'No terms yet'],
  ])('renders %s with its empty state while no module is built', async (path, title, empty) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: empty })).toBeInTheDocument();
  });

  it('renders the lab kit gallery', async () => {
    renderAt('/kit');
    expect(await screen.findByRole('heading', { level: 1, name: 'Lab kit' })).toBeInTheDocument();
  });
});
