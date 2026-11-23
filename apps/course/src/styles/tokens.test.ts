import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { tracks } from '../content/curriculum';

const tokensDir = path.join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  'packages',
  'design-tokens',
);
const css = readFileSync(path.join(tokensDir, 'tokens.css'), 'utf8');
const courseCss = readFileSync(path.join(import.meta.dirname, 'tokens.css'), 'utf8');

type Scope = Map<string, string>;

function blocks(selector: string): Scope {
  const opening = `${selector} {`;
  const scope: Scope = new Map();
  let from = 0;
  for (;;) {
    const start = css.indexOf(opening, from);
    if (start === -1) return scope;
    const end = css.indexOf('}', start);
    const body = css.slice(start + opening.length, end);
    for (const declaration of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, value] = declaration;
      if (name && value) scope.set(name, value.trim());
    }
    from = end;
  }
}

function scopeFor(selector: string): Scope {
  return new Map([...blocks(':root'), ...blocks(selector)]);
}

function resolve(name: string, scope: Scope): string {
  const value = scope.get(name);
  if (value === undefined) throw new Error(`${name} is not defined`);
  const reference = /^var\((--[\w-]+)\)$/.exec(value);
  return reference?.[1] ? resolve(reference[1], scope) : value;
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`${hex} is not a six digit hex colour`);
  const digits = match[1];
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((offset) => {
    const value = parseInt(digits.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [lighter = 0, darker = 0] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

const lightThemes: [string, string][] = [
  ['explicit light theme', ":root[data-theme='light']"],
  ['system light theme', ":root:not([data-theme='dark'])"],
];

const lightSurfaces = ['--bg', '--surface', '--surface-2'];
const trackVars = tracks.map((track) => track.colorVar);

describe('contrast helper', () => {
  it('matches the reference ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('reads both light theme blocks', () => {
    for (const [, selector] of lightThemes) {
      expect(resolve('--surface', scopeFor(selector))).toBe('#ffffff');
    }
  });
});

describe.each(lightThemes)('%s track text tokens', (_label, selector) => {
  const scope = scopeFor(selector);

  it.each(trackVars)('%s-text reads at 4.5:1 or better on every light surface', (colorVar) => {
    const text = resolve(`${colorVar}-text`, scope);
    for (const surface of lightSurfaces) {
      expect(
        contrast(text, resolve(surface, scope)),
        `${colorVar}-text on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(trackVars)('button text reads at 4.5:1 or better on %s-text', (colorVar) => {
    expect(
      contrast(resolve('--accent-fg', scope), resolve(`${colorVar}-text`, scope)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe('dark theme track text tokens', () => {
  const scope = scopeFor(':root');

  it.each(trackVars)('%s-text equals the track colour', (colorVar) => {
    expect(resolve(`${colorVar}-text`, scope)).toBe(resolve(colorVar, scope));
  });
});

const frameworkVars = ['--react', '--vue', '--svelte', '--angular', '--plain'];
const frameworkThemes: [string, string][] = [['dark theme', ':root'], ...lightThemes];

describe.each(frameworkThemes)('%s framework colours', (_label, selector) => {
  const scope = scopeFor(selector);

  it.each(frameworkVars)('%s is defined as a hex colour', (name) => {
    expect(resolve(name, scope)).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each(frameworkVars)('x-ray tag text reads at 4.5:1 or better on %s', (name) => {
    expect(contrast(resolve('--accent-fg', scope), resolve(name, scope))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(frameworkVars)('%s outlines a slot at 3:1 or better on the slot surface', (name) => {
    expect(contrast(resolve(name, scope), resolve('--surface-2', scope))).toBeGreaterThanOrEqual(3);
  });
});

describe('the shared token package', () => {
  it('is imported by the course tokens', () => {
    expect(courseCss).toContain("@import '@react-field-guide/design-tokens/tokens.css';");
  });

  it('defines the font stacks the course theme registers with Tailwind', () => {
    const theme = /@theme static \{([^}]*)\}/.exec(courseCss)?.[1] ?? '';
    const scope = scopeFor(':root');
    for (const name of ['--font-display', '--font-body', '--font-mono']) {
      const declared = new RegExp(`${name}:\\s*([^;]+);`).exec(theme)?.[1]?.trim();
      expect(declared, name).toBeDefined();
      expect(scope.get(name), name).toBe(declared);
    }
  });
});
