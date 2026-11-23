import { createInstance } from '@module-federation/runtime';
import type { RemoteDescriptor } from '@react-field-guide/mfe-contracts';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMClient from 'react-dom/client';
import * as CompilerRuntime from 'react/compiler-runtime';
import * as JsxDevRuntime from 'react/jsx-dev-runtime';
import * as JsxRuntime from 'react/jsx-runtime';

export type FederationHost = ReturnType<typeof createInstance>;
type SharedMap = NonNullable<Parameters<FederationHost['registerShared']>[0]>;

const requiredVersion = '^19.3.0';

function sharedEntry(lib: unknown): SharedMap[string] {
  return {
    version: React.version,
    scope: 'default',
    lib: () => lib,
    shareConfig: { singleton: true, requiredVersion },
  };
}

let instance: FederationHost | undefined;
const registeredEntries = new Map<string, string>();

export function getFederation(): FederationHost {
  if (!instance) {
    instance = createInstance({ name: 'host', remotes: [] });
    instance.registerShared({
      react: sharedEntry(React),
      'react-dom': sharedEntry(ReactDOM),
      'react-dom/client': sharedEntry(ReactDOMClient),
      'react/jsx-runtime': sharedEntry(JsxRuntime),
      'react/jsx-dev-runtime': sharedEntry(JsxDevRuntime),
      'react/compiler-runtime': sharedEntry(CompilerRuntime),
    });
  }
  return instance;
}

export async function loadFederated<T>(descriptor: RemoteDescriptor): Promise<T> {
  const { container, expose } = descriptor;
  if (!container) throw new Error(`Remote ${descriptor.id} has no container name`);
  if (!expose) throw new Error(`Remote ${descriptor.id} has no expose path`);

  const host = getFederation();
  const registered = registeredEntries.get(container);
  if (registered !== descriptor.url) {
    host.registerRemotes([{ name: container, entry: descriptor.url, type: 'module' }], {
      force: registered !== undefined,
    });
    registeredEntries.set(container, descriptor.url);
  }

  const loaded = await host.loadRemote<T>(`${container}/${expose.replace(/^\.\//, '')}`);
  if (loaded === null || loaded === undefined) {
    throw new Error(`Remote ${descriptor.id} returned nothing for ${expose}`);
  }
  return loaded;
}
