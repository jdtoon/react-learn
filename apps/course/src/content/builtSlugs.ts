const modulePath = /\/modules\/([^/]+)\/index\.ts$/;

export function slugsFromPaths(paths: string[]): Set<string> {
  return new Set(paths.flatMap((path) => modulePath.exec(path)?.[1] ?? []));
}

const builtSlugs = slugsFromPaths(Object.keys(import.meta.glob('../modules/*/index.ts')));

export function isBuilt(slug: string): boolean {
  return builtSlugs.has(slug);
}
