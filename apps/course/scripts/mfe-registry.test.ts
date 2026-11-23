import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  builtManifest,
  devManifest,
  devProcesses,
  isDeployable,
  measureBytes,
  readRemoteSources,
} from '../../../scripts/mfe-registry.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'rfg-registry-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const catalogRemote = {
  id: 'react-catalog',
  slot: 'catalog',
  team: 'Discovery',
  framework: 'react',
  kind: 'federation',
  container: 'react_catalog',
  expose: './Catalog',
  entry: 'remoteEntry.js',
  path: 'react-catalog',
  devPort: 5201,
  live: true,
};

async function addPackage(dir: string, pkg: Record<string, unknown>) {
  await mkdir(path.join(root, 'mfe', dir), { recursive: true });
  await writeFile(path.join(root, 'mfe', dir, 'package.json'), JSON.stringify(pkg));
}

async function addFile(relative: string, size: number) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, 'x'.repeat(size));
}

async function addCatalog(overrides: Record<string, unknown> = {}) {
  await addPackage('react-catalog', {
    name: '@react-field-guide/react-catalog',
    version: '1.4.0',
    mfe: { remotes: [{ ...catalogRemote, ...overrides }] },
  });
}

describe('readRemoteSources', () => {
  it('reads every remote declared in mfe/*/package.json, sorted by id', async () => {
    await addPackage('vue-reviews', {
      name: '@react-field-guide/vue-reviews',
      version: '2.0.0',
      mfe: {
        remotes: [
          {
            id: 'vue-reviews',
            slot: 'reviews',
            team: 'Community',
            framework: 'vue',
            kind: 'web-component',
            tag: 'rfg-vue-reviews',
            entry: 'reviews.js',
            path: 'vue-reviews',
            devPort: 5204,
            live: true,
          },
        ],
      },
    });
    await addCatalog();

    const sources = await readRemoteSources(root);

    expect(sources.map((source) => source.id)).toEqual(['react-catalog', 'vue-reviews']);
    expect(sources[0]).toMatchObject({
      id: 'react-catalog',
      version: '1.4.0',
      packageName: '@react-field-guide/react-catalog',
      dir: path.join(root, 'mfe', 'react-catalog'),
      dist: 'dist',
      devPort: 5201,
      devEnv: {},
      live: true,
    });
  });

  it('skips packages without an mfe field and non-package folders', async () => {
    await addPackage('shared-lib', { name: 'x', version: '1.0.0' });
    await mkdir(path.join(root, 'mfe', 'empty'), { recursive: true });
    await addCatalog();

    expect((await readRemoteSources(root)).map((source) => source.id)).toEqual(['react-catalog']);
  });

  it('returns nothing when there is no mfe folder', async () => {
    expect(await readRemoteSources(root)).toEqual([]);
  });

  it('lets one package declare several remotes with their own version, dist and env', async () => {
    await addPackage('react-recs', {
      name: '@react-field-guide/react-recs',
      version: '1.0.0',
      mfe: {
        remotes: [
          {
            ...catalogRemote,
            id: 'react-recs-v1',
            slot: 'recs',
            path: 'react-recs/v1',
            dist: 'dist/v1',
            version: '1.0.0',
            devPort: 5203,
            devEnv: { RECS_VERSION: 'v1' },
          },
          {
            ...catalogRemote,
            id: 'react-recs-v2',
            slot: 'recs',
            path: 'react-recs/v2',
            dist: 'dist/v2',
            version: '2.0.0',
            devPort: 5204,
            devEnv: { RECS_VERSION: 'v2' },
            live: false,
          },
        ],
      },
    });

    const sources = await readRemoteSources(root);

    expect(sources.map((source) => [source.id, source.version, source.dist, source.live])).toEqual([
      ['react-recs-v1', '1.0.0', 'dist/v1', true],
      ['react-recs-v2', '2.0.0', 'dist/v2', false],
    ]);
    expect(sources[1]?.devEnv).toEqual({ RECS_VERSION: 'v2' });
  });

  it.each([
    ['a missing slot', { slot: undefined }, /slot/],
    ['a bad port', { devPort: 'nope' }, /devPort/],
    ['an unknown kind', { kind: 'jsonp' }, /kind/],
  ])('rejects %s', async (_label, overrides, message) => {
    await addCatalog(overrides);
    await expect(readRemoteSources(root)).rejects.toThrow(message);
  });

  it('rejects a duplicate remote id', async () => {
    await addCatalog();
    await addPackage('copy', {
      name: 'copy',
      version: '1.0.0',
      mfe: { remotes: [{ ...catalogRemote, devPort: 5299, live: false }] },
    });
    await expect(readRemoteSources(root)).rejects.toThrow(/react-catalog.*twice/);
  });

  it('rejects two remotes live in the same slot and two remotes on one dev port', async () => {
    await addCatalog();
    await addPackage('other', {
      name: 'other',
      version: '1.0.0',
      mfe: { remotes: [{ ...catalogRemote, id: 'other', path: 'other', devPort: 5299 }] },
    });
    await expect(readRemoteSources(root)).rejects.toThrow(/both live for slot "catalog"/);

    await rm(path.join(root, 'mfe', 'other'), { recursive: true });
    await addPackage('other', {
      name: 'other',
      version: '1.0.0',
      mfe: {
        remotes: [{ ...catalogRemote, id: 'other', path: 'other', live: false }],
      },
    });
    await expect(readRemoteSources(root)).rejects.toThrow(/5201/);
  });
});

describe('devManifest', () => {
  it('points every remote at its dev server under the site base and fills live', async () => {
    await addCatalog();
    const manifest = devManifest(await readRemoteSources(root));

    expect(manifest).toEqual({
      remotes: [
        {
          id: 'react-catalog',
          slot: 'catalog',
          team: 'Discovery',
          framework: 'react',
          kind: 'federation',
          version: '1.4.0',
          url: 'http://localhost:5201/react-learn/remotes/react-catalog/remoteEntry.js',
          container: 'react_catalog',
          expose: './Catalog',
        },
      ],
      live: { catalog: 'react-catalog' },
    });
  });
});

describe('isDeployable', () => {
  it.each([
    ['remoteEntry.js', true],
    ['assets/utils-abc.js', true],
    ['assets/catalog-abc.css', true],
    ['mf-manifest.json', true],
    ['mf-stats.json', false],
    ['.vite/manifest.json', false],
    ['.vite/mf-preload.json', false],
    ['index.html', false],
  ])('%s -> %s', (relative, expected) => {
    expect(isDeployable(relative)).toBe(expected);
  });
});

describe('builtManifest', () => {
  it('uses urls relative to the site base and sums the deployed bytes', async () => {
    await addCatalog();
    const site = path.join(root, 'site');
    const target = path.join('site', 'remotes', 'react-catalog');
    await addFile(path.join(target, 'remoteEntry.js'), 1000);
    await addFile(path.join(target, 'assets', 'a.js'), 500);
    await addFile(path.join(target, 'assets', 'a.css'), 25);
    await addFile(path.join(target, 'mf-stats.json'), 9999);
    await addFile(path.join(target, '.vite', 'manifest.json'), 9999);

    const manifest = await builtManifest(await readRemoteSources(root), site);

    expect(manifest.remotes[0]).toMatchObject({
      id: 'react-catalog',
      url: 'remotes/react-catalog/remoteEntry.js',
      bytes: 1525,
    });
    expect(manifest.live).toEqual({ catalog: 'react-catalog' });
  });

  it('fails clearly when a remote was not built', async () => {
    await addCatalog();
    await expect(
      builtManifest(await readRemoteSources(root), path.join(root, 'site')),
    ).rejects.toThrow(/react-catalog/);
  });
});

describe('measureBytes', () => {
  it('counts nested deployable files only', async () => {
    await addFile('d/one.js', 10);
    await addFile('d/deep/two.css', 20);
    await addFile('d/.vite/skip.json', 1000);

    expect(await measureBytes(path.join(root, 'd'))).toBe(30);
  });
});

describe('devProcesses', () => {
  it('lists the course first, then one vite process per remote with its port and env', async () => {
    await addPackage('react-recs', {
      name: '@react-field-guide/react-recs',
      version: '1.0.0',
      mfe: {
        remotes: [
          {
            ...catalogRemote,
            id: 'react-recs-v1',
            slot: 'recs',
            devPort: 5203,
            devEnv: { RECS_VERSION: 'v1' },
          },
          {
            ...catalogRemote,
            id: 'react-recs-v2',
            slot: 'recs',
            devPort: 5204,
            devEnv: { RECS_VERSION: 'v2' },
            live: false,
          },
        ],
      },
    });
    await addCatalog();

    const processes = devProcesses(root, await readRemoteSources(root));

    expect(processes.map((entry) => entry.name)).toEqual([
      'course',
      'react-catalog',
      'react-recs-v1',
      'react-recs-v2',
    ]);
    expect(processes[0]).toMatchObject({
      cwd: path.join(root, 'apps', 'course'),
      args: [],
      env: {},
    });
    expect(processes[2]).toMatchObject({
      cwd: path.join(root, 'mfe', 'react-recs'),
      args: ['--port', '5203', '--strictPort'],
      env: { RECS_VERSION: 'v1' },
    });
    expect(processes[1]?.viteBin).toBe(
      path.join(root, 'mfe', 'react-catalog', 'node_modules', 'vite', 'bin', 'vite.js'),
    );
  });
});
