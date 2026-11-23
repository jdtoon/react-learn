import { curriculum } from './curriculum';
import type { ModuleEntry, ModuleMeta } from './types';

const modulePath = /\/modules\/([^/]+)\/index\.ts$/;

export function indexModulesBySlug(
  files: Record<string, ModuleEntry>,
): Record<string, ModuleEntry> {
  const indexed: Record<string, ModuleEntry> = {};
  for (const [path, entry] of Object.entries(files)) {
    const slug = modulePath.exec(path)?.[1];
    if (slug) indexed[slug] = entry;
  }
  return indexed;
}

export const builtModules: Record<string, ModuleEntry> = indexModulesBySlug(
  import.meta.glob<ModuleEntry>('../modules/*/index.ts', { eager: true, import: 'default' }),
);

export function getModule(slug: string): { meta: ModuleMeta; entry?: ModuleEntry } | undefined {
  const meta = curriculum.find((module) => module.slug === slug);
  if (!meta) return undefined;
  return { meta, entry: builtModules[slug] };
}

export function isBuilt(slug: string): boolean {
  return Object.hasOwn(builtModules, slug);
}
