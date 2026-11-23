import { describe, expect, it } from 'vitest';
import { validateModuleContent } from '../../content/validate';
import { content } from './content';
import entry from './index';

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

describe('module 02 content', () => {
  it('passes the content validator', () => {
    expect(validateModuleContent(content)).toEqual([]);
  });

  it('gives every lab two to four try-this prompts', () => {
    for (const lab of content.labs) {
      expect(lab.tryThis.length, lab.id).toBeGreaterThanOrEqual(2);
      expect(lab.tryThis.length, lab.id).toBeLessThanOrEqual(4);
    }
  });

  it('declares the three labs from the brief in order', () => {
    expect(content.labs.map((lab) => lab.id)).toEqual([
      'render-tree',
      'key-chaos',
      'reset-with-key',
    ]);
  });

  it('keeps to the house style: no em dashes, British spelling of memoisation', () => {
    const text = allStrings(content).join('\n');
    expect(text).not.toMatch(/[\u2014\u2013]/);
    expect(text).not.toMatch(/memoiz/i);
  });

  it('exports an entry whose labs match the content', async () => {
    expect(entry.content).toBe(content);
    const { labs } = await entry.loadLabs();
    expect(Object.keys(labs).sort()).toEqual(content.labs.map((lab) => lab.id).sort());
  });
});
