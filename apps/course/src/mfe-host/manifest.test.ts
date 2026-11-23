import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ManifestError,
  loadManifest,
  manifestUrl,
  parseRemoteOverrides,
  resolveManifest,
} from './manifest';

const siteBase = 'https://jdtoon.github.io/react-learn/';

const raw = {
  remotes: [
    {
      id: 'react-catalog',
      slot: 'catalog',
      team: 'Discovery',
      framework: 'react',
      kind: 'federation',
      version: '1.0.0',
      url: 'remotes/react-catalog/remoteEntry.js',
      container: 'react_catalog',
      expose: './Catalog',
      bytes: 12345,
    },
    {
      id: 'vue-reviews',
      slot: 'reviews',
      team: 'Community',
      framework: 'vue',
      kind: 'web-component',
      version: '1.9.3',
      url: 'https://cdn.example.com/vue-reviews.js',
      tag: 'rfg-reviews',
    },
  ],
  live: { catalog: 'react-catalog', reviews: 'vue-reviews' },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('manifestUrl', () => {
  it('points at the built manifest under the site base', () => {
    expect(manifestUrl('/react-learn/', false)).toBe('/react-learn/remotes/manifest.json');
  });

  it('points at the dev manifest in development', () => {
    expect(manifestUrl('/react-learn/', true)).toBe('/react-learn/remotes/manifest.dev.json');
  });
});

describe('parseRemoteOverrides', () => {
  it('reads id=url pairs and keeps equals signs inside the url', () => {
    const overrides = parseRemoteOverrides(
      '?remote-override=react-catalog=/react-learn/remotes/missing/remoteEntry.js%3Fv%3D1',
    );
    expect(overrides.get('react-catalog')).toBe('/react-learn/remotes/missing/remoteEntry.js?v=1');
  });

  it('accepts several overrides and ignores malformed ones', () => {
    const overrides = parseRemoteOverrides(
      '?remote-override=a=/x.js&remote-override=nourl&remote-override==/y.js&remote-override=b=/z.js',
    );
    expect([...overrides]).toEqual([
      ['a', '/x.js'],
      ['b', '/z.js'],
    ]);
  });

  it('returns nothing when the parameter is absent', () => {
    expect(parseRemoteOverrides('?other=1').size).toBe(0);
    expect(parseRemoteOverrides('').size).toBe(0);
  });
});

describe('resolveManifest', () => {
  it('resolves relative urls against the site base and leaves absolute urls alone', () => {
    const manifest = resolveManifest(raw, { siteBase, search: '' });
    expect(manifest.remotes[0]?.url).toBe(
      'https://jdtoon.github.io/react-learn/remotes/react-catalog/remoteEntry.js',
    );
    expect(manifest.remotes[1]?.url).toBe('https://cdn.example.com/vue-reviews.js');
  });

  it('keeps every other field and the live map', () => {
    const manifest = resolveManifest(raw, { siteBase, search: '' });
    expect(manifest.remotes[0]).toMatchObject({
      id: 'react-catalog',
      slot: 'catalog',
      team: 'Discovery',
      framework: 'react',
      kind: 'federation',
      version: '1.0.0',
      container: 'react_catalog',
      expose: './Catalog',
      bytes: 12345,
    });
    expect(manifest.live).toEqual({ catalog: 'react-catalog', reviews: 'vue-reviews' });
  });

  it('applies a root-relative override to the matching remote only', () => {
    const manifest = resolveManifest(raw, {
      siteBase,
      search: '?remote-override=react-catalog=/react-learn/remotes/missing/remoteEntry.js',
    });
    expect(manifest.remotes[0]?.url).toBe(
      'https://jdtoon.github.io/react-learn/remotes/missing/remoteEntry.js',
    );
    expect(manifest.remotes[1]?.url).toBe('https://cdn.example.com/vue-reviews.js');
  });

  it('resolves a relative override against the site base', () => {
    const manifest = resolveManifest(raw, {
      siteBase,
      search: '?remote-override=vue-reviews=remotes/gone/reviews.js',
    });
    expect(manifest.remotes[1]?.url).toBe(
      'https://jdtoon.github.io/react-learn/remotes/gone/reviews.js',
    );
  });

  it('ignores an override for an id that is not in the manifest', () => {
    const manifest = resolveManifest(raw, {
      siteBase,
      search: '?remote-override=nope=/x.js',
    });
    expect(manifest.remotes.map((remote) => remote.url)).toEqual([
      'https://jdtoon.github.io/react-learn/remotes/react-catalog/remoteEntry.js',
      'https://cdn.example.com/vue-reviews.js',
    ]);
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(raw);
    resolveManifest(raw, { siteBase, search: '?remote-override=react-catalog=/x.js' });
    expect(JSON.stringify(raw)).toBe(before);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['no remotes array', { live: {} }],
    ['no live map', { remotes: [] }],
    ['a remote with no url', { remotes: [{ ...raw.remotes[0], url: undefined }], live: {} }],
    ['an unknown kind', { remotes: [{ ...raw.remotes[0], kind: 'jsonp' }], live: {} }],
    ['an unknown framework', { remotes: [{ ...raw.remotes[0], framework: 'solid' }], live: {} }],
    ['a live entry that is not a string', { remotes: [], live: { catalog: 3 } }],
  ])('rejects %s', (_label, value) => {
    expect(() => resolveManifest(value, { siteBase, search: '' })).toThrow(ManifestError);
  });
});

describe('loadManifest', () => {
  function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => response as Response,
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('fetches the built manifest and resolves it against the origin and base', async () => {
    const fetchMock = stubFetch({ ok: true, json: async () => raw });

    const manifest = await loadManifest({ base: '/react-learn/', dev: false, search: '' });

    expect(fetchMock).toHaveBeenCalledWith('/react-learn/remotes/manifest.json', {
      cache: 'no-cache',
    });
    expect(manifest.remotes[0]?.url).toBe(
      `${window.location.origin}/react-learn/remotes/react-catalog/remoteEntry.js`,
    );
  });

  it('fetches the dev manifest in development', async () => {
    const fetchMock = stubFetch({ ok: true, json: async () => raw });

    await loadManifest({ base: '/react-learn/', dev: true, search: '' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/react-learn/remotes/manifest.dev.json');
  });

  it('applies overrides from the search string', async () => {
    stubFetch({ ok: true, json: async () => raw });

    const manifest = await loadManifest({
      base: '/react-learn/',
      dev: false,
      search: '?remote-override=react-catalog=/react-learn/remotes/missing/remoteEntry.js',
    });

    expect(manifest.remotes[0]?.url).toBe(
      `${window.location.origin}/react-learn/remotes/missing/remoteEntry.js`,
    );
  });

  it('rejects with a ManifestError when the response is not ok', async () => {
    stubFetch({ ok: false, status: 404 });
    await expect(
      loadManifest({ base: '/react-learn/', dev: false, search: '' }),
    ).rejects.toBeInstanceOf(ManifestError);
  });

  it('rejects with a ManifestError when the body is not a manifest', async () => {
    stubFetch({ ok: true, json: async () => ({ nope: true }) });
    await expect(
      loadManifest({ base: '/react-learn/', dev: false, search: '' }),
    ).rejects.toBeInstanceOf(ManifestError);
  });

  it('rejects with a ManifestError when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(
      loadManifest({ base: '/react-learn/', dev: false, search: '' }),
    ).rejects.toBeInstanceOf(ManifestError);
  });
});
