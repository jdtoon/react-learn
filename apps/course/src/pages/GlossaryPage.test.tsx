import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ModuleEntry } from '../content/types';
import { clearBuilt, fixtureEntry } from '../test/fixtures';
import { GlossaryPage } from './GlossaryPage';

const built = vi.hoisted(() => ({}) as Record<string, ModuleEntry>);

vi.mock('../content/registry', () => ({
  builtModules: built,
  isBuilt: (slug: string) => Object.hasOwn(built, slug),
}));

afterEach(() => {
  clearBuilt(built);
});

function renderGlossary() {
  render(
    <MemoryRouter>
      <GlossaryPage />
    </MemoryRouter>,
  );
}

describe('GlossaryPage with no built modules', () => {
  it('shows a designed empty state', () => {
    renderGlossary();
    expect(screen.getByRole('heading', { level: 1, name: 'Glossary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No terms yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the curriculum' })).toHaveAttribute(
      'href',
      '/#map',
    );
    expect(screen.queryByRole('navigation', { name: 'Jump to letter' })).not.toBeInTheDocument();
  });
});

describe('GlossaryPage with built modules', () => {
  function buildTwo() {
    built['02-rendering'] = fixtureEntry('02-rendering');
    built['11-frame-budget'] = fixtureEntry('11-frame-budget', {
      glossary: [
        { term: 'jank', definition: 'A dropped frame the user can feel.' },
        { term: 'Frame budget', definition: 'About 16 ms of main-thread time per frame.' },
      ],
    });
  }

  it('lists terms from every built module in A to Z order, case-insensitively', () => {
    buildTwo();
    renderGlossary();
    const terms = screen.getAllByRole('term').map((node) => node.textContent);
    expect(terms).toEqual(['Commit', 'Frame budget', 'jank', 'Reconciliation']);
  });

  it('groups terms under letter headings', () => {
    buildTwo();
    renderGlossary();
    const letters = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent);
    expect(letters).toEqual(['C', 'F', 'J', 'R']);
    const jank = screen.getByRole('heading', { level: 2, name: 'J' });
    expect(jank).toHaveAttribute('id', 'letter-j');
  });

  it('gives each term its definition and a link to the module that teaches it', () => {
    buildTwo();
    renderGlossary();
    const entry = screen.getByText('jank', { selector: 'dt' }).closest('div');
    if (!entry) throw new Error('missing entry');
    expect(within(entry).getByText('A dropped frame the user can feel.')).toBeInTheDocument();
    expect(within(entry).getByRole('link', { name: /The browser's frame budget/ })).toHaveAttribute(
      'href',
      '/modules/11-frame-budget',
    );
  });

  it('offers a jump link only for letters that have terms', () => {
    buildTwo();
    renderGlossary();
    const nav = screen.getByRole('navigation', { name: 'Jump to letter' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['C', 'F', 'J', 'R']);
    expect(links[2]).toHaveAttribute('href', '/#letter-j');
  });
});
