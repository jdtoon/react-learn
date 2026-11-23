import { spawn } from 'node:child_process';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { devProcesses, readRemoteSources } from './mfe-registry.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const colours = [36, 35, 33, 32, 34, 91, 95, 93];

const sources = await readRemoteSources(root);
const processes = devProcesses(root, sources);
const width = Math.max(...processes.map((entry) => entry.name.length));
const children = [];
let stopping = false;

function stopAll(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 200).unref();
}

processes.forEach((entry, index) => {
  const colour = colours[index % colours.length];
  const prefix = `\u001b[${colour}m${entry.name.padEnd(width)}\u001b[0m |`;
  const child = spawn(process.execPath, [entry.viteBin, ...entry.args], {
    cwd: entry.cwd,
    env: { ...process.env, FORCE_COLOR: '1', ...entry.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);

  for (const stream of [child.stdout, child.stderr]) {
    createInterface({ input: stream }).on('line', (line) => console.log(`${prefix} ${line}`));
  }
  child.on('error', (error) => {
    console.error(`${prefix} failed to start: ${error.message}`);
    stopAll(1);
  });
  child.on('exit', (code) => {
    if (stopping) return;
    console.error(`${prefix} exited with code ${code}`);
    stopAll(code ?? 1);
  });
});

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
