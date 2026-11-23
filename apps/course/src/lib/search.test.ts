import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ModuleEntry } from '../content/types';
import { clearBuilt, fixtureEntry } from '../test/fixtures';
import { buildSearchIndex, searchItems, type SearchItem } from './search';

const built = vi.hoisted(() => ({}) as Record<string, ModuleEntry>);

vi.mock('../content/registry', () => ({
  builtModules: built,
  isBuilt: (slug: string) => Object.hasOwn(built, slug),
}));

afterEach(() => {
  clearBuilt(built);
});

function item(title: string, detail: string, kind: SearchItem['kind'] = 'module'): SearchItem {
  return { kind, title, detail, href: `/${title}` };
}

describe('buildSearchIndex', () => {
  it('lists all 24 modules in curriculum order when nothing is built', () => {
    const index = buildSearchIndex();
    expect(index).toHaveLength(24);
    expect(index.every((entry) => entry.kind === 'module')).toBe(true);
    expect(index[0]).toMatchObject({
      title: 'How React thinks',
      href: '/modules/01-how-react-thinks',
    });
    expect(index[1]?.detail).toContain('Foundations');
    expect(index[1]?.detail).toContain('A re-render is React calling your function again');
  });

  it('adds glossary terms and a meeting card for each built module', () => {
    built['02-rendering'] = fixtureEntry('02-rendering');
    const index = buildSearchIndex();
    const terms = index.filter((entry) => entry.kind === 'term');
    const talks = index.filter((entry) => entry.kind === 'talk');
    expect(terms.map((entry) => entry.title)).toEqual(['Reconciliation', 'Commit']);
    expect(terms[0]).toMatchObject({
      detail: 'Comparing two element trees to find the changes.',
      href: '/modules/02-rendering',
    });
    expect(talks).toHaveLength(1);
    expect(talks[0]).toMatchObject({
      title: 'Rendering & reconciliation',
      href: '/meeting#02-rendering',
    });
    expect(talks[0]?.detail).toContain('The trade-off inside Rendering & reconciliation');
    expect(index).toHaveLength(27);
  });
});

describe('searchItems', () => {
  it('ranks both title-prefix matches for "render" ahead of everything else', () => {
    const titles = searchItems(buildSearchIndex(), 'render').map((entry) => entry.title);
    expect(titles.slice(0, 2)).toEqual(['Rendering & reconciliation', 'Rendering strategies']);
  });

  it('puts title-substring matches above detail-only matches', () => {
    const titles = searchItems(buildSearchIndex(), 'render', 24).map((entry) => entry.title);
    const detailOnly = titles.filter((title) => !title.toLowerCase().includes('render'));
    expect(detailOnly.length).toBeGreaterThan(0);
    const substring = titles.indexOf('Re-renders, memoisation & the Compiler');
    expect(substring).toBe(2);
    for (const title of detailOnly) {
      expect(titles.indexOf(title)).toBeGreaterThan(substring);
    }
  });

  it('ranks prefix above substring above detail and keeps input order within a rank', () => {
    const items = [
      item('Zeta', 'mentions alpha here'),
      item('Beta alpha', 'nothing'),
      item('Alpha two', 'nothing'),
      item('Gamma alpha', 'nothing'),
      item('Alpha one', 'nothing'),
    ];
    expect(searchItems(items, 'alpha').map((entry) => entry.title)).toEqual([
      'Alpha two',
      'Alpha one',
      'Beta alpha',
      'Gamma alpha',
      'Zeta',
    ]);
  });

  it('is case-insensitive and ignores surrounding whitespace', () => {
    const index = buildSearchIndex();
    expect(searchItems(index, '  RENDER ')).toEqual(searchItems(index, 'render'));
  });

  it('returns nothing for an empty or blank query', () => {
    const index = buildSearchIndex();
    expect(searchItems(index, '')).toEqual([]);
    expect(searchItems(index, '   ')).toEqual([]);
  });

  it('returns nothing when nothing matches', () => {
    expect(searchItems(buildSearchIndex(), 'zzzzqx')).toEqual([]);
  });

  it('respects the limit and has a sensible default', () => {
    const index = buildSearchIndex();
    expect(searchItems(index, 'e', 3)).toHaveLength(3);
    expect(searchItems(index, 'e').length).toBeLessThanOrEqual(8);
    expect(searchItems(index, 'e', 100).length).toBeGreaterThan(8);
  });

  it('matches every word of a multi-word query across title and detail', () => {
    const titles = searchItems(buildSearchIndex(), 'suspense errors').map((entry) => entry.title);
    expect(titles).toContain('Data fetching, Suspense & errors');
  });

  it('finds the micro frontend modules by their track name', () => {
    const results = searchItems(buildSearchIndex(), 'micro');
    expect(results.map((entry) => entry.href)).toEqual([
      '/modules/21-mfe-why-and-when',
      '/modules/22-mfe-composition',
      '/modules/23-mfe-sharing-and-communication',
      '/modules/24-mfe-in-production',
    ]);
  });

  it('ranks a term that starts with the query above a module that only contains it', () => {
    built['02-rendering'] = fixtureEntry('02-rendering');
    const results = searchItems(buildSearchIndex(), 'reconcil');
    expect(results[0]).toMatchObject({ kind: 'term', title: 'Reconciliation' });
    expect(results[1]).toMatchObject({ kind: 'module', title: 'Rendering & reconciliation' });
  });
});
