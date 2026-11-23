const modulePath = /\/modules\/([^/]+)\/index\.ts$/;

export function slugFromModulePath(path: string): string | undefined {
  return modulePath.exec(path)?.[1];
}

export function slugsFromPaths(paths: string[]): Set<string> {
  return new Set(paths.flatMap((path) => slugFromModulePath(path) ?? []));
}

const builtSlugs = slugsFromPaths(Object.keys(import.meta.glob('../modules/*/index.ts')));

export function isBuilt(slug: string): boolean {
  return builtSlugs.has(slug);
}
