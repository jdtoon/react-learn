import { cp, copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtManifest, deployableFiles, readRemoteSources } from './mfe-registry.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(root, 'dist-site');
const courseTarget = path.join(siteRoot, 'react-learn');
const remotesTarget = path.join(courseTarget, 'remotes');

await rm(siteRoot, { recursive: true, force: true });
await mkdir(courseTarget, { recursive: true });
await cp(path.join(root, 'apps', 'course', 'dist'), courseTarget, { recursive: true });
await copyFile(path.join(courseTarget, 'index.html'), path.join(courseTarget, '404.html'));
await writeFile(path.join(courseTarget, '.nojekyll'), '');

const sources = await readRemoteSources(root);
for (const source of sources) {
  const from = path.join(source.dir, source.dist);
  const to = path.join(remotesTarget, ...source.path.split('/'));

  const built = await stat(from).catch(() => null);
  if (!built?.isDirectory()) {
    throw new Error(`Remote "${source.id}" has no build output at ${from}. Run pnpm build.`);
  }
  for (const file of await deployableFiles(from)) {
    const target = path.join(to, ...file.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(from, ...file.split('/')), target);
  }
}

const manifest = await builtManifest(sources, courseTarget);
await mkdir(remotesTarget, { recursive: true });
await writeFile(
  path.join(remotesTarget, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
