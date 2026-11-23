import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type {
  RemoteDescriptor,
  RemoteFramework,
  RemoteKind,
  RemoteManifest,
} from '../packages/mfe-contracts/src/index.ts';

export const siteBase = '/react-learn/';

export interface RemoteSource {
  id: string;
  slot: string;
  team: string;
  framework: RemoteFramework;
  kind: RemoteKind;
  version: string;
  container?: string;
  expose?: string;
  tag?: string;
  entry: string;
  path: string;
  dist: string;
  devPort: number;
  devEnv: Record<string, string>;
  devBin?: string;
  devArgs: string[];
  live: boolean;
  packageName: string;
  dir: string;
}

export interface DevProcess {
  name: string;
  cwd: string;
  viteBin: string;
  args: string[];
  env: Record<string, string>;
}

const kinds: readonly string[] = ['federation', 'module-mount', 'web-component', 'iframe'];
const frameworks: readonly string[] = ['react', 'vue', 'svelte', 'angular', 'plain'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireText(source: Record<string, unknown>, key: string, where: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${where}: "${key}" must be a non-empty string`);
  }
  return value;
}

function optionalText(source: Record<string, unknown>, key: string, where: string) {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${where}: "${key}" must be a non-empty string when present`);
  }
  return value;
}

function parseEnv(value: unknown, where: string): Record<string, string> {
  if (value === undefined) return {};
  if (!isRecord(value) || Object.values(value).some((entry) => typeof entry !== 'string')) {
    throw new Error(`${where}: "devEnv" must map names to strings`);
  }
  return value as Record<string, string>;
}

function parseArgs(value: unknown, where: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${where}: "devArgs" must be a list of strings`);
  }
  return value as string[];
}

function parseRemote(
  raw: unknown,
  pkg: Record<string, unknown>,
  dir: string,
  index: number,
): RemoteSource {
  const packageName = typeof pkg['name'] === 'string' ? pkg['name'] : path.basename(dir);
  const where = `${packageName} mfe.remotes[${index}]`;
  if (!isRecord(raw)) throw new Error(`${where}: must be an object`);

  const kind = requireText(raw, 'kind', where);
  const framework = requireText(raw, 'framework', where);
  if (!kinds.includes(kind)) throw new Error(`${where}: unknown kind "${kind}"`);
  if (!frameworks.includes(framework))
    throw new Error(`${where}: unknown framework "${framework}"`);

  const devPort = raw['devPort'];
  if (typeof devPort !== 'number' || !Number.isInteger(devPort) || devPort < 1) {
    throw new Error(`${where}: "devPort" must be a port number`);
  }
  const version = optionalText(raw, 'version', where) ?? optionalText(pkg, 'version', where);
  if (!version) throw new Error(`${where}: needs a "version" or a package version`);

  const source: RemoteSource = {
    id: requireText(raw, 'id', where),
    slot: requireText(raw, 'slot', where),
    team: requireText(raw, 'team', where),
    framework: framework as RemoteFramework,
    kind: kind as RemoteKind,
    version,
    entry: requireText(raw, 'entry', where),
    path: requireText(raw, 'path', where),
    dist: optionalText(raw, 'dist', where) ?? 'dist',
    devPort,
    devEnv: parseEnv(raw['devEnv'], where),
    devArgs: parseArgs(raw['devArgs'], where),
    live: raw['live'] === true,
    packageName,
    dir,
  };
  const container = optionalText(raw, 'container', where);
  const expose = optionalText(raw, 'expose', where);
  const tag = optionalText(raw, 'tag', where);
  const devBin = optionalText(raw, 'devBin', where);
  if (devBin !== undefined) source.devBin = devBin;
  if (container !== undefined) source.container = container;
  if (expose !== undefined) source.expose = expose;
  if (tag !== undefined) source.tag = tag;
  return source;
}

function assertUnique(sources: RemoteSource[]): void {
  const ids = new Set<string>();
  const liveSlots = new Map<string, string>();
  const ports = new Map<number, string>();
  for (const source of sources) {
    if (ids.has(source.id)) throw new Error(`Remote id "${source.id}" is declared twice`);
    ids.add(source.id);

    if (source.live) {
      const other = liveSlots.get(source.slot);
      if (other !== undefined) {
        throw new Error(
          `Remotes "${other}" and "${source.id}" are both live for slot "${source.slot}"`,
        );
      }
      liveSlots.set(source.slot, source.id);
    }

    const holder = ports.get(source.devPort);
    if (holder !== undefined) {
      throw new Error(`Remotes "${holder}" and "${source.id}" both use dev port ${source.devPort}`);
    }
    ports.set(source.devPort, source.id);
  }
}

export async function readRemoteSources(root: string): Promise<RemoteSource[]> {
  const mfeDir = path.join(root, 'mfe');
  let entries: string[];
  try {
    entries = await readdir(mfeDir);
  } catch {
    return [];
  }

  const sources: RemoteSource[] = [];
  for (const entry of entries.sort()) {
    const dir = path.join(mfeDir, entry);
    let pkg: unknown;
    try {
      pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
    } catch {
      continue;
    }
    if (!isRecord(pkg) || !isRecord(pkg['mfe'])) continue;
    const remotes = pkg['mfe']['remotes'];
    if (!Array.isArray(remotes)) continue;
    remotes.forEach((raw, index) => sources.push(parseRemote(raw, pkg, dir, index)));
  }

  sources.sort((a, b) => a.id.localeCompare(b.id));
  assertUnique(sources);
  return sources;
}

function liveMap(sources: RemoteSource[]): Record<string, string> {
  const live: Record<string, string> = {};
  for (const source of sources) {
    if (source.live) live[source.slot] = source.id;
  }
  return live;
}

function describe(source: RemoteSource, url: string, bytes?: number): RemoteDescriptor {
  const descriptor: RemoteDescriptor = {
    id: source.id,
    slot: source.slot,
    team: source.team,
    framework: source.framework,
    kind: source.kind,
    version: source.version,
    url,
  };
  if (source.container !== undefined) descriptor.container = source.container;
  if (source.expose !== undefined) descriptor.expose = source.expose;
  if (source.tag !== undefined) descriptor.tag = source.tag;
  if (bytes !== undefined) descriptor.bytes = bytes;
  return descriptor;
}

export function devManifest(sources: RemoteSource[]): RemoteManifest {
  return {
    remotes: sources.map((source) =>
      describe(
        source,
        `http://localhost:${source.devPort}${siteBase}remotes/${source.path}/${source.entry}`,
      ),
    ),
    live: liveMap(sources),
  };
}

export function isDeployable(relative: string): boolean {
  const normalised = relative.split(path.sep).join('/');
  if (normalised.split('/').some((part) => part.startsWith('.'))) return false;
  return normalised !== 'mf-stats.json' && normalised !== 'index.html';
}

async function walk(dir: string, prefix = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(path.join(dir, entry.name), relative)));
    else files.push(relative);
  }
  return files;
}

export async function deployableFiles(dir: string): Promise<string[]> {
  return (await walk(dir)).filter(isDeployable);
}

export async function measureBytes(dir: string): Promise<number> {
  let total = 0;
  for (const file of await deployableFiles(dir)) {
    total += (await stat(path.join(dir, file))).size;
  }
  return total;
}

export async function builtManifest(
  sources: RemoteSource[],
  siteDir: string,
): Promise<RemoteManifest> {
  const remotes: RemoteDescriptor[] = [];
  for (const source of sources) {
    const deployed = path.join(siteDir, 'remotes', ...source.path.split('/'));
    let bytes: number;
    try {
      bytes = await measureBytes(deployed);
    } catch {
      throw new Error(`Remote "${source.id}" is not built: nothing at ${deployed}`);
    }
    remotes.push(describe(source, `remotes/${source.path}/${source.entry}`, bytes));
  }
  return { remotes, live: liveMap(sources) };
}

export function devProcesses(root: string, sources: RemoteSource[]): DevProcess[] {
  const viteBin = (dir: string) => path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js');
  const courseDir = path.join(root, 'apps', 'course');
  return [
    { name: 'course', cwd: courseDir, viteBin: viteBin(courseDir), args: [], env: {} },
    ...sources.map((source) => ({
      name: source.id,
      cwd: source.dir,
      viteBin: source.devBin
        ? path.join(source.dir, 'node_modules', ...source.devBin.split('/'))
        : viteBin(source.dir),
      args: source.devBin
        ? [...source.devArgs, '--port', String(source.devPort)]
        : ['--port', String(source.devPort), '--strictPort'],
      env: source.devEnv,
    })),
  ];
}
