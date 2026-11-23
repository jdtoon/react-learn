import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ModuleEntry } from '../content/types';
import { clearBuilt, fixtureEntry } from '../test/fixtures';
import { MeetingPage } from './MeetingPage';

const built = vi.hoisted(() => ({}) as Record<string, ModuleEntry>);

vi.mock('../content/registry', () => ({
  builtModules: built,
  isBuilt: (slug: string) => Object.hasOwn(built, slug),
}));

afterEach(() => {
  clearBuilt(built);
});

function renderMeeting(entry = '/meeting') {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <MeetingPage />
    </MemoryRouter>,
  );
}

describe('MeetingPage with no built modules', () => {
  it('shows a designed empty state with a way back to the map', () => {
    renderMeeting();
    expect(screen.getByRole('heading', { level: 1, name: 'Meeting mode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No meeting cards yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the curriculum' })).toHaveAttribute(
      'href',
      '/#map',
    );
  });

  it('previews the four parts of a card and offers no filter', () => {
    renderMeeting();
    for (const label of ['Say', 'Ask', 'Red flags', 'Trade-off']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByRole('group', { name: 'Filter by track' })).not.toBeInTheDocument();
  });
});

describe('MeetingPage with built modules', () => {
  function buildTwo() {
    built['11-frame-budget'] = fixtureEntry('11-frame-budget');
    built['02-rendering'] = fixtureEntry('02-rendering');
  }

  it('scrolls to the card named by the hash', () => {
    buildTwo();
    const scroll = vi.mocked(window.HTMLElement.prototype.scrollIntoView);
    scroll.mockClear();
    renderMeeting('/meeting#11-frame-budget');
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('11-frame-budget'));
  });

  it.each(['#%E0%A4%A', '#%', '#missing-card'])('ignores the hash %s without throwing', (hash) => {
    buildTwo();
    const scroll = vi.mocked(window.HTMLElement.prototype.scrollIntoView);
    scroll.mockClear();
    expect(() => renderMeeting(`/meeting${hash}`)).not.toThrow();
    expect(scroll).not.toHaveBeenCalled();
  });

  it('groups cards by track in curriculum order', () => {
    buildTwo();
    renderMeeting();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent);
    expect(headings).toEqual(['Foundations', 'Performance']);
    expect(screen.queryByRole('heading', { name: 'No meeting cards yet' })).not.toBeInTheDocument();
  });

  it('renders say, ask, red flags and trade-off for each module', () => {
    buildTwo();
    renderMeeting();
    const card = screen.getByRole('article', { name: /Rendering & reconciliation/ });
    expect(card).toHaveAttribute('id', '02-rendering');
    expect(within(card).getByRole('link', { name: /Rendering & reconciliation/ })).toHaveAttribute(
      'href',
      '/modules/02-rendering',
    );
    expect(within(card).getByText('Say one thing about Rendering & reconciliation')).toBeVisible();
    expect(within(card).getByText('Say a second thing')).toBeVisible();
    expect(within(card).getByText('Ask a question about Rendering & reconciliation')).toBeVisible();
    expect(within(card).getByText('A red flag worth naming')).toBeVisible();
    expect(within(card).getByText('The trade-off inside Rendering & reconciliation')).toBeVisible();
    for (const label of ['Say', 'Ask', 'Red flags', 'Trade-off']) {
      expect(within(card).getByText(label)).toBeInTheDocument();
    }
  });

  it('offers a chip only for tracks that have cards and filters by track', async () => {
    buildTwo();
    renderMeeting();
    const filter = screen.getByRole('group', { name: 'Filter by track' });
    const chips = within(filter)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(chips).toEqual(['All tracks2', 'Foundations1', 'Performance1']);
    expect(within(filter).getByRole('button', { name: /All tracks/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(within(filter).getByRole('button', { name: /Performance/ }));
    expect(within(filter).getByRole('button', { name: /Performance/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article', { name: /frame budget/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Foundations' }),
    ).not.toBeInTheDocument();

    await userEvent.click(within(filter).getByRole('button', { name: /All tracks/ }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
