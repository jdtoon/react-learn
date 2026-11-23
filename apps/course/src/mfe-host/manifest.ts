import type {
  RemoteDescriptor,
  RemoteFramework,
  RemoteKind,
  RemoteManifest,
} from '@react-field-guide/mfe-contracts';

export class ManifestError extends Error {
  override name = 'ManifestError';
}

export interface ManifestEnv {
  base: string;
  dev: boolean;
  search: string;
}

export interface ResolveOptions {
  siteBase: string;
  search: string;
}

export const overrideParam = 'remote-override';

const kinds: readonly string[] = ['federation', 'module-mount', 'web-component', 'iframe'];
const frameworks: readonly string[] = ['react', 'vue', 'svelte', 'angular', 'plain'];

function isKind(value: string): value is RemoteKind {
  return kinds.includes(value);
}

function isFramework(value: string): value is RemoteFramework {
  return frameworks.includes(value);
}

export function manifestUrl(base: string, dev: boolean): string {
  return `${base}remotes/${dev ? 'manifest.dev.json' : 'manifest.json'}`;
}

export function parseRemoteOverrides(search: string): Map<string, string> {
  const overrides = new Map<string, string>();
  for (const value of new URLSearchParams(search).getAll(overrideParam)) {
    const split = value.indexOf('=');
    if (split <= 0 || split === value.length - 1) continue;
    overrides.set(value.slice(0, split), value.slice(split + 1));
  }
  return overrides;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(source: Record<string, unknown>, key: string, index: number): string {
  const value = source[key];
  if (typeof value !== 'string' || value === '') {
    throw new ManifestError(`Remote ${index} needs a non-empty string "${key}"`);
  }
  return value;
}

function optionalText(
  source: Record<string, unknown>,
  key: string,
  index: number,
): string | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new ManifestError(`Remote ${index} "${key}" must be a string`);
  }
  return value;
}

function parseDescriptor(source: unknown, index: number): RemoteDescriptor {
  if (!isRecord(source)) throw new ManifestError(`Remote ${index} is not an object`);
  const kind = text(source, 'kind', index);
  const framework = text(source, 'framework', index);
  if (!isKind(kind)) throw new ManifestError(`Remote ${index} has an unknown kind "${kind}"`);
  if (!isFramework(framework)) {
    throw new ManifestError(`Remote ${index} has an unknown framework "${framework}"`);
  }
  const bytes = source['bytes'];
  if (bytes !== undefined && (typeof bytes !== 'number' || !Number.isFinite(bytes))) {
    throw new ManifestError(`Remote ${index} "bytes" must be a number`);
  }

  const descriptor: RemoteDescriptor = {
    id: text(source, 'id', index),
    slot: text(source, 'slot', index),
    team: text(source, 'team', index),
    framework,
    kind,
    version: text(source, 'version', index),
    url: text(source, 'url', index),
  };
  const container = optionalText(source, 'container', index);
  const expose = optionalText(source, 'expose', index);
  const tag = optionalText(source, 'tag', index);
  if (container !== undefined) descriptor.container = container;
  if (expose !== undefined) descriptor.expose = expose;
  if (tag !== undefined) descriptor.tag = tag;
  if (bytes !== undefined) descriptor.bytes = bytes;
  return descriptor;
}

function resolveUrl(value: string, siteBase: string): string {
  try {
    return new URL(value, siteBase).href;
  } catch {
    throw new ManifestError(`"${value}" is not a valid remote url`);
  }
}

export function resolveManifest(raw: unknown, options: ResolveOptions): RemoteManifest {
  if (!isRecord(raw)) throw new ManifestError('The manifest is not an object');
  const { remotes, live } = raw;
  if (!Array.isArray(remotes)) throw new ManifestError('The manifest has no "remotes" list');
  if (!isRecord(live)) throw new ManifestError('The manifest has no "live" map');

  const liveMap: Record<string, string> = {};
  for (const [slot, id] of Object.entries(live)) {
    if (typeof id !== 'string') throw new ManifestError(`live["${slot}"] must be a remote id`);
    liveMap[slot] = id;
  }

  const overrides = parseRemoteOverrides(options.search);
  return {
    remotes: remotes.map((entry, index) => {
      const descriptor = parseDescriptor(entry, index);
      const url = overrides.get(descriptor.id) ?? descriptor.url;
      return { ...descriptor, url: resolveUrl(url, options.siteBase) };
    }),
    live: liveMap,
  };
}

function defaultEnv(): ManifestEnv {
  return {
    base: import.meta.env.BASE_URL,
    dev: import.meta.env.DEV,
    search: window.location.search,
  };
}

export async function loadManifest(env: ManifestEnv = defaultEnv()): Promise<RemoteManifest> {
  const url = manifestUrl(env.base, env.dev);
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (error) {
    throw new ManifestError(
      `Could not reach ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok) throw new ManifestError(`Manifest request failed with ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManifestError('The manifest is not valid JSON');
  }
  return resolveManifest(body, {
    siteBase: new URL(env.base, window.location.origin).href,
    search: env.search,
  });
}
