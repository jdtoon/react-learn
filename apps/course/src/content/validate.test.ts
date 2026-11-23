import { describe, expect, it } from 'vitest';
import { listBuiltContent } from './builtContent';
import type { ModuleContent } from './types';
import { validateModuleContent } from './validate';
import { validContent } from '../test/fixtures';

const slug = '02-rendering';

function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index}`).join(' ');
}

function problemsFor(overrides: Partial<ModuleContent>): string[] {
  return validateModuleContent(validContent(slug, overrides));
}

describe('validateModuleContent', () => {
  it('accepts a module that follows every rule', () => {
    expect(validateModuleContent(validContent(slug))).toEqual([]);
  });

  it('reports sections that run past 400 words', () => {
    const problems = problemsFor({
      sections: [
        { heading: 'Long', paragraphs: [words(250)] },
        { heading: 'Longer', paragraphs: [words(250)] },
      ],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/500 words/);
    expect(problems[0]).toMatch(/400/);
  });

  it('accepts sections of exactly 400 words', () => {
    expect(problemsFor({ sections: [{ heading: 'Exact', paragraphs: [words(400)] }] })).toEqual([]);
  });

  it('reports a link that is not https', () => {
    const base = validContent(slug);
    const problems = problemsFor({
      links: [{ label: 'Plain http', url: 'http://react.dev/learn' }, ...base.links.slice(1)],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/https/);
    expect(problems[0]).toContain('http://react.dev/learn');
  });

  it.each(['https:example.com', 'https:/example.com', 'https://'])(
    'reports the malformed https link "%s"',
    (url) => {
      const base = validContent(slug);
      const problems = problemsFor({
        links: [{ label: 'Loose', url }, ...base.links.slice(1)],
      });
      expect(problems).toHaveLength(1);
      expect(problems[0]).toMatch(/https/);
    },
  );

  it('reports a malformed link url', () => {
    const base = validContent(slug);
    const problems = problemsFor({
      links: [{ label: 'Relative', url: '/learn' }, ...base.links.slice(1)],
    });
    expect(problems.some((problem) => /https/.test(problem))).toBe(true);
  });

  it.each([
    ['no labs', { labs: [] }, /labs/],
    [
      'four labs',
      {
        labs: ['a', 'b', 'c', 'd'].map((id) => ({
          id,
          title: id,
          tryThis: ['x'],
          whatHappened: 'y',
        })),
      },
      /labs/,
    ],
    ['two pitfalls', { pitfalls: validContent(slug).pitfalls.slice(0, 2) }, /pitfalls/],
    [
      'one say line',
      { meeting: { ...validContent(slug).meeting, say: ['only one'] } },
      /meeting say/,
    ],
    [
      'five say lines',
      { meeting: { ...validContent(slug).meeting, say: ['1', '2', '3', '4', '5'] } },
      /meeting say/,
    ],
    [
      'one ask line',
      { meeting: { ...validContent(slug).meeting, ask: ['only one'] } },
      /meeting ask/,
    ],
    [
      'one red flag',
      { meeting: { ...validContent(slug).meeting, redFlags: ['only one'] } },
      /red flags/,
    ],
    [
      'an empty trade-off',
      { meeting: { ...validContent(slug).meeting, tradeoff: '  ' } },
      /trade-off/,
    ],
    ['two self-check items', { selfCheck: validContent(slug).selfCheck.slice(0, 2) }, /self-check/],
    [
      'four self-check items',
      {
        selfCheck: [...validContent(slug).selfCheck, { question: 'Another?', answer: 'Yes.' }],
      },
      /self-check/,
    ],
    ['two links', { links: validContent(slug).links.slice(0, 2) }, /links/],
    [
      'six links',
      {
        links: Array.from({ length: 6 }, (_, index) => ({
          label: `Link ${index}`,
          url: `https://react.dev/${index}`,
        })),
      },
      /links/,
    ],
    ['two glossary terms', { glossary: validContent(slug).glossary.slice(0, 2) }, /glossary/],
    ['one outcome', { outcomes: ['only one'] }, /outcomes/],
    ['four outcomes', { outcomes: ['1', '2', '3', '4'] }, /outcomes/],
  ] as [string, Partial<ModuleContent>, RegExp][])('reports %s', (_name, overrides, pattern) => {
    const problems = problemsFor(overrides);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(pattern);
  });

  it.each([
    ['title', { title: 'Something else' }],
    ['number', { number: 3 }],
    ['track', { track: 'craft' as const }],
    ['oneIdea', { oneIdea: 'A different idea.' }],
    ['minutes', { minutes: 30 }],
    ['phase', { phase: 3 as const }],
  ] as [string, Partial<ModuleContent>][])(
    'reports a %s that differs from the curriculum',
    (field, overrides) => {
      const problems = problemsFor(overrides);
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain(field);
      expect(problems[0]).toMatch(/curriculum/);
    },
  );

  it('reports a slug that is not in the curriculum', () => {
    const problems = problemsFor({ slug: '99-nope' });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/not in the curriculum/);
  });

  it('collects every problem instead of stopping at the first', () => {
    const problems = problemsFor({ labs: [], outcomes: [], title: 'Nope' });
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });
});

describe('built modules', () => {
  it('every built module passes validation', () => {
    for (const content of listBuiltContent()) {
      expect(validateModuleContent(content), content.slug).toEqual([]);
    }
  });
});
