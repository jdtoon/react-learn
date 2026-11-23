import { describe, expect, it } from 'vitest';
import { isBuilt, slugsFromPaths } from './builtSlugs';
import { builtModules } from './registry';

describe('slugsFromPaths', () => {
  it('collects module folder names from index files only', () => {
    expect(
      slugsFromPaths([
        '../modules/02-rendering/index.ts',
        '../modules/11-frame-budget/index.ts',
        '../modules/02-rendering/lab.ts',
      ]),
    ).toEqual(new Set(['02-rendering', '11-frame-budget']));
  });

  it('is empty when there are no modules', () => {
    expect(slugsFromPaths([])).toEqual(new Set());
  });
});

describe('isBuilt', () => {
  it('agrees with the eagerly loaded registry', () => {
    expect(isBuilt('99-nope')).toBe(false);
    for (const slug of Object.keys(builtModules)) expect(isBuilt(slug)).toBe(true);
  });
});
