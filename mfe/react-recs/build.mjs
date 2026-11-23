import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const viteBin = path.join(import.meta.dirname, 'node_modules', 'vite', 'bin', 'vite.js');

for (const version of ['v1', 'v2']) {
  const result = spawnSync(process.execPath, [viteBin, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, RECS_VERSION: version },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
