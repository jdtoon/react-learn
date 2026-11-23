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

  it('renders meeting mode with the card for module 02', async () => {
    renderAt('/meeting');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Meeting mode' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Rendering & reconciliation' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No meeting cards yet' })).not.toBeInTheDocument();
  });

  it('renders the glossary with the terms from module 02', async () => {
    renderAt('/glossary');
    expect(await screen.findByRole('heading', { level: 1, name: 'Glossary' })).toBeInTheDocument();
    expect(screen.getByText('Reconciliation')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No terms yet' })).not.toBeInTheDocument();
  });

  it('renders module 02 with its title and labs', async () => {
    renderAt('/modules/02-rendering');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rendering & reconciliation' }),
    ).toBeInTheDocument();
  });

  it('renders the lab kit gallery', async () => {
    renderAt('/kit');
    expect(await screen.findByRole('heading', { level: 1, name: 'Lab kit' })).toBeInTheDocument();
  });
});
