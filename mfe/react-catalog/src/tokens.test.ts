import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const tokensPath = createRequire(import.meta.url).resolve(
  '@react-field-guide/design-tokens/tokens.css',
);
const tokens = readFileSync(tokensPath, 'utf8');
const css = readFileSync(path.join(import.meta.dirname, 'catalog.css'), 'utf8');

const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
const used = [...css.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1] ?? '');

describe('catalog styles', () => {
  it('reads only variables the shared design tokens define', () => {
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) expect(defined.has(name), name).toBe(true);
  });

  it('does not hard-code colours', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(?:rgb|hsl|oklch)a?\(/i);
  });
});
