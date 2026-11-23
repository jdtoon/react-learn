import { describe, expect, it } from 'vitest';
import { isBuilt, slugFromModulePath, slugsFromPaths } from './builtSlugs';
import { builtModules } from './registry';

describe('slugFromModulePath', () => {
  it('reads the folder name of a module index file', () => {
    expect(slugFromModulePath('../modules/02-rendering/index.ts')).toBe('02-rendering');
  });

  it.each(['../modules/02-rendering/lab.ts', '../modules/index.ts', 'index.ts'])(
    'ignores %s',
    (path) => {
      expect(slugFromModulePath(path)).toBeUndefined();
    },
  );
});

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
