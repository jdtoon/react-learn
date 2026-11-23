import { cp, copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(root, 'dist-site');
const courseTarget = path.join(siteRoot, 'react-learn');

await rm(siteRoot, { recursive: true, force: true });
await mkdir(courseTarget, { recursive: true });
await cp(path.join(root, 'apps', 'course', 'dist'), courseTarget, { recursive: true });
await copyFile(path.join(courseTarget, 'index.html'), path.join(courseTarget, '404.html'));
await writeFile(path.join(courseTarget, '.nojekyll'), '');
