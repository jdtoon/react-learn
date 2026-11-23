import { describe, expect, it } from 'vitest';
import { curriculum } from './curriculum';
import { builtModules, getModule, indexModulesBySlug, isBuilt } from './registry';
import type { ModuleContent, ModuleEntry } from './types';

function fakeEntry(slug: string): ModuleEntry {
  const meta = curriculum.find((m) => m.slug === slug);
  if (!meta) throw new Error(`Unknown slug ${slug}`);
  const content: ModuleContent = {
    ...meta,
    outcomes: [],
    sections: [],
    labs: [],
    pitfalls: [],
    meeting: { say: [], ask: [], redFlags: [], tradeoff: '' },
    selfCheck: [],
    links: [],
    glossary: [],
  };
  return { content, loadLabs: () => Promise.resolve({ labs: {} }) };
}

describe('registry', () => {
  it('returns undefined for an unknown slug', () => {
    expect(getModule('99-nope')).toBeUndefined();
    expect(isBuilt('99-nope')).toBe(false);
  });

  it('returns meta without an entry for a planned module', () => {
    const found = getModule('21-mfe-why-and-when');
    expect(found?.meta.number).toBe(21);
    expect(found?.entry).toBeUndefined();
    expect(isBuilt('21-mfe-why-and-when')).toBe(false);
  });

  it('only registers modules that exist in the curriculum, under their own slug', () => {
    const slugs = new Set(curriculum.map((m) => m.slug));
    for (const [slug, entry] of Object.entries(builtModules)) {
      expect(slugs.has(slug)).toBe(true);
      expect(entry.content.slug).toBe(slug);
      expect(isBuilt(slug)).toBe(true);
      expect(getModule(slug)?.entry).toBe(entry);
    }
  });
});

describe('indexModulesBySlug', () => {
  it('keys entries by their module folder name', () => {
    const entry = fakeEntry('02-rendering');
    expect(indexModulesBySlug({ '../modules/02-rendering/index.ts': entry })).toEqual({
      '02-rendering': entry,
    });
  });

  it('returns an empty record when there are no modules', () => {
    expect(indexModulesBySlug({})).toEqual({});
  });

  it('ignores paths that are not module index files', () => {
    const entry = fakeEntry('02-rendering');
    expect(indexModulesBySlug({ '../modules/02-rendering/lab.ts': entry })).toEqual({});
  });
});
