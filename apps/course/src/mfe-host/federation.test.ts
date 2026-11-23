import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RemoteDescriptor } from '@react-field-guide/mfe-contracts';

const instance = {
  registerShared: vi.fn(),
  registerRemotes: vi.fn(),
  loadRemote: vi.fn(),
};
const createInstance = vi.fn(() => instance);

vi.mock('@module-federation/runtime', () => ({ createInstance }));

const catalog: RemoteDescriptor = {
  id: 'react-catalog',
  slot: 'catalog',
  team: 'Discovery',
  framework: 'react',
  kind: 'federation',
  version: '1.0.0',
  url: 'http://localhost:5201/react-learn/remotes/react-catalog/remoteEntry.js',
  container: 'react_catalog',
  expose: './Catalog',
};

type SharedEntry = {
  version: string;
  scope: string;
  lib: () => unknown;
  shareConfig: { singleton: boolean; requiredVersion: string };
};

async function freshModule() {
  vi.resetModules();
  return import('./federation');
}

beforeEach(() => {
  createInstance.mockClear();
  instance.registerShared.mockReset();
  instance.registerRemotes.mockReset();
  instance.loadRemote.mockReset();
});

describe('getFederation', () => {
  it('creates the instance once, lazily', async () => {
    const { getFederation } = await freshModule();
    expect(createInstance).not.toHaveBeenCalled();

    const first = getFederation();
    const second = getFederation();

    expect(first).toBe(second);
    expect(createInstance).toHaveBeenCalledTimes(1);
    expect(createInstance).toHaveBeenCalledWith({ name: 'host', remotes: [] });
  });

  it('shares react and every subpath a remote may request as singletons', async () => {
    const { getFederation } = await freshModule();
    getFederation();

    expect(instance.registerShared).toHaveBeenCalledTimes(1);
    const shared = instance.registerShared.mock.calls[0]?.[0] as Record<string, SharedEntry>;
    expect(Object.keys(shared).sort()).toEqual([
      'react',
      'react-dom',
      'react-dom/client',
      'react/compiler-runtime',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
    ]);
    for (const entry of Object.values(shared)) {
      expect(entry.scope).toBe('default');
      expect(entry.shareConfig).toEqual({ singleton: true, requiredVersion: '^19.3.0' });
      expect(typeof entry.lib).toBe('function');
      expect(entry.version).toBe(React.version);
    }
  });

  it('hands remotes the exact react module the host is running', async () => {
    const { getFederation } = await freshModule();
    getFederation();
    const shared = instance.registerShared.mock.calls[0]?.[0] as Record<string, SharedEntry>;
    const hostReact = (await import('react')).default;

    expect(shared['react']?.lib()).toBe(hostReact);
  });
});

describe('loadFederated', () => {
  it('registers the remote as a module container and loads the exposed module', async () => {
    const exposed = { default: () => null };
    instance.loadRemote.mockResolvedValue(exposed);
    const { loadFederated } = await freshModule();

    const result = await loadFederated(catalog);

    expect(result).toBe(exposed);
    expect(instance.registerRemotes).toHaveBeenCalledWith(
      [{ name: 'react_catalog', entry: catalog.url, type: 'module' }],
      { force: false },
    );
    expect(instance.loadRemote).toHaveBeenCalledWith('react_catalog/Catalog');
  });

  it('registers a remote once however many times it is loaded', async () => {
    instance.loadRemote.mockResolvedValue({});
    const { loadFederated } = await freshModule();

    await loadFederated(catalog);
    await loadFederated(catalog);
    await loadFederated({ ...catalog, expose: './reactIdentity' });

    expect(instance.registerRemotes).toHaveBeenCalledTimes(1);
    expect(instance.loadRemote.mock.calls.map((call) => call[0])).toEqual([
      'react_catalog/Catalog',
      'react_catalog/Catalog',
      'react_catalog/reactIdentity',
    ]);
  });

  it('re-registers a container with force when its url changes', async () => {
    instance.loadRemote.mockResolvedValue({});
    const { loadFederated } = await freshModule();
    const broken = { ...catalog, url: 'http://localhost:5201/missing/remoteEntry.js' };

    await loadFederated(catalog);
    await loadFederated(broken);
    await loadFederated(broken);

    expect(instance.registerRemotes).toHaveBeenCalledTimes(2);
    expect(instance.registerRemotes).toHaveBeenLastCalledWith(
      [{ name: 'react_catalog', entry: broken.url, type: 'module' }],
      { force: true },
    );
  });

  it('rejects when the runtime returns nothing', async () => {
    instance.loadRemote.mockResolvedValue(null);
    const { loadFederated } = await freshModule();
    await expect(loadFederated(catalog)).rejects.toThrow(/react-catalog/);
  });

  it('rejects when the descriptor has no container or expose', async () => {
    const { loadFederated } = await freshModule();
    await expect(loadFederated({ ...catalog, container: undefined })).rejects.toThrow(/container/);
    await expect(loadFederated({ ...catalog, expose: undefined })).rejects.toThrow(/expose/);
    expect(instance.loadRemote).not.toHaveBeenCalled();
  });

  it('propagates a failed load', async () => {
    instance.loadRemote.mockRejectedValue(new Error('RUNTIME-008'));
    const { loadFederated } = await freshModule();
    await expect(loadFederated(catalog)).rejects.toThrow('RUNTIME-008');
  });
});
