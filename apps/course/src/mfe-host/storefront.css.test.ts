import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { frameworkLabels } from './slots';

const tokens = readFileSync(
  path.join(import.meta.dirname, '..', '..', '..', '..', 'packages', 'design-tokens', 'tokens.css'),
  'utf8',
);
const css = readFileSync(path.join(import.meta.dirname, 'storefront.css'), 'utf8');

const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
const declaredInCss = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

describe('storefront styles', () => {
  it('read only variables the design tokens or the frame itself define', () => {
    const used = [...css.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1] ?? '');
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) {
      expect(defined.has(name) || declaredInCss.has(name) || name === '--fc', name).toBe(true);
    }
  });

  it('do not hard-code colours', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(?:rgb|hsl|oklch)a?\(/i);
  });

  it.each(Object.keys(frameworkLabels))('the design tokens define a colour for %s', (framework) => {
    expect(defined.has(`--${framework}`)).toBe(true);
  });
});
