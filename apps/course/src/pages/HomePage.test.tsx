import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../app/progress';
import { curriculum, tracks } from '../content/curriculum';
import type { ModuleEntry } from '../content/types';
import { clearBuilt, fixtureEntry } from '../test/fixtures';
import { HomePage } from './HomePage';

const built = vi.hoisted(() => ({}) as Record<string, ModuleEntry>);

vi.mock('../content/registry', () => ({
  builtModules: built,
  isBuilt: (slug: string) => Object.hasOwn(built, slug),
}));

afterEach(() => {
  clearBuilt(built);
  useProgress.setState({ completed: {} });
});

function renderHome() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: '24 modules across 6 tracks' });
}

describe('HomePage hero', () => {
  it('names the course and links to meeting mode', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: 'React Field Guide' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prep for a meeting' })).toHaveAttribute(
      'href',
      '/meeting',
    );
  });

  it('sends Start here to the map while nothing is built', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'Start here' })).toHaveAttribute('href', '/#map');
  });

  it('sends Start here to the first built module', () => {
    built['11-frame-budget'] = fixtureEntry('11-frame-budget');
    built['02-rendering'] = fixtureEntry('02-rendering');
    renderHome();
    expect(screen.getByRole('link', { name: 'Start here' })).toHaveAttribute(
      'href',
      '/modules/02-rendering',
    );
  });
});

describe('HomePage progress', () => {
  it('reports completed modules out of the whole curriculum', () => {
    renderHome();
    const bar = screen.getByRole('progressbar', { name: 'Course progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '24');
    expect(bar).toHaveAttribute('aria-valuetext', '0 of 24 modules completed');
  });

  it('counts only modules that exist in the curriculum', () => {
    built['02-rendering'] = fixtureEntry('02-rendering');
    useProgress.setState({ completed: { '02-rendering': true, 'gone-module': true } });
    renderHome();
    expect(screen.getByRole('progressbar', { name: 'Course progress' })).toHaveAttribute(
      'aria-valuetext',
      '1 of 24 modules completed',
    );
    expect(screen.getByText('1 built')).toBeInTheDocument();
    expect(screen.getByText('23 planned')).toBeInTheDocument();
  });
});

describe('HomePage map', () => {
  it('draws one lane per track holding that track in order', () => {
    const map = renderHome();
    const lanes = within(map).getAllByRole('region');
    expect(lanes).toHaveLength(tracks.length);
    tracks.forEach((track, index) => {
      const lane = lanes[index];
      if (!lane) throw new Error('missing lane');
      expect(within(lane).getByRole('heading', { name: track.title })).toBeInTheDocument();
      const expected = curriculum.filter((module) => module.track === track.id);
      const links = within(lane).getAllByRole('link');
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        expected.map((module) => `/modules/${module.slug}`),
      );
    });
  });

  it('shows every module as a link with its number and title', () => {
    const map = renderHome();
    expect(within(map).getAllByRole('link')).toHaveLength(24);
    expect(
      within(map).getByRole('link', { name: /^02 Rendering & reconciliation/ }),
    ).toHaveAttribute('href', '/modules/02-rendering');
  });

  it('tells planned, built and completed modules apart in text', () => {
    built['02-rendering'] = fixtureEntry('02-rendering');
    built['03-state-snapshots'] = fixtureEntry('03-state-snapshots');
    useProgress.setState({ completed: { '03-state-snapshots': true } });
    const map = renderHome();
    const planned = within(map).getByRole('link', { name: /Why & when/ });
    const ready = within(map).getByRole('link', { name: /Rendering & reconciliation/ });
    const done = within(map).getByRole('link', { name: /State & the snapshot model/ });
    expect(planned).toHaveAccessibleName(/planned/);
    expect(ready).not.toHaveAccessibleName(/planned|completed/);
    expect(done).toHaveAccessibleName(/completed/);
    expect(planned.closest('li')).toHaveAttribute('data-state', 'planned');
    expect(ready.closest('li')).toHaveAttribute('data-state', 'built');
    expect(done.closest('li')).toHaveAttribute('data-state', 'complete');
  });

  it('summarises each lane', () => {
    built['02-rendering'] = fixtureEntry('02-rendering');
    const map = renderHome();
    const lane = within(map).getByRole('region', { name: 'Foundations' });
    expect(within(lane).getByText('1 of 4 built')).toBeInTheDocument();
    const other = within(map).getByRole('region', { name: 'Craft' });
    expect(within(other).getByText('0 of 3 built')).toBeInTheDocument();
  });
});
