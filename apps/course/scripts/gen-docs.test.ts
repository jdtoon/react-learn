import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateDocs } from './gen-docs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureModules = path.join(here, 'fixtures', 'modules');
const script = path.join(here, 'gen-docs.ts');

let outDir = '';

beforeEach(async () => {
  outDir = await mkdtemp(path.join(tmpdir(), 'rfg-docs-'));
});

afterEach(async () => {
  await rm(outDir, { recursive: true, force: true });
});

function read(relative: string): Promise<string> {
  return readFile(path.join(outDir, relative), 'utf8');
}

describe('generateDocs', () => {
  it('writes a module guide with every section except the labs themselves', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const doc = await read('modules/02-rendering.md');
    expect(doc).toContain(
      "Generated from the app's content. Edit `apps/course/src/modules/02-rendering/content.ts`.",
    );
    expect(doc).toMatch(/^# .*Rendering & reconciliation/m);
    expect(doc).toContain('## In the meeting');
    expect(doc).toContain('## Pitfalls');
    expect(doc).toContain('## Self-check');
    expect(doc).toContain('## The model');
    expect(doc).toContain('## Go deeper');
    expect(doc).toContain('## After this you can');
    expect(doc).toContain('Explain the trigger, render and commit steps');
    expect(doc).toContain('https://react.dev/learn/render-and-commit');
  });

  it('turns labs into Try this lists with a link to the live lab', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const doc = await read('modules/02-rendering.md');
    expect(doc).toContain('## Labs');
    expect(doc).toContain('### Who re-renders?');
    expect(doc).toContain('Try this');
    expect(doc).toContain('- Change App state and watch the flashes');
    expect(doc).toContain(
      'https://jdtoon.github.io/react-learn/modules/02-rendering#lab-render-tree',
    );
    expect(doc).not.toContain('Everything under the changed component ran again');
  });

  it('shows pitfalls as symptom, cause and fix with the bad and good snippets', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const doc = await read('modules/02-rendering.md');
    expect(doc).toContain('### Index keys on a list that reorders');
    expect(doc).toContain('**Symptom:** Typed text lands in the wrong row');
    expect(doc).toContain('**Cause:**');
    expect(doc).toContain('**Fix:** Use a stable id as the key');
    expect(doc).toContain('<Row key={index} />');
    expect(doc).toContain('<Row key={item.id} />');
  });

  it('writes the meeting cheatsheet grouped by track', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const sheet = await read('MEETING-CHEATSHEET.md');
    expect(sheet).toContain('## Foundations');
    expect(sheet).toMatch(/### .*Rendering & reconciliation/);
    expect(sheet).toContain('A parent rendering re-renders its children by default.');
    expect(sheet).toContain('Did we measure before adding `memo`?');
    expect(sheet).toContain('Array index keys on a list that reorders');
    expect(sheet).toContain('Memoisation trades memory and complexity for skipped work.');
  });

  it('writes the glossary in A to Z order with a link to each module guide', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const glossary = await read('GLOSSARY.md');
    const commit = glossary.indexOf('**Commit**');
    const key = glossary.indexOf('**key**');
    const render = glossary.indexOf('**Render**');
    expect(commit).toBeGreaterThan(-1);
    expect(commit).toBeLessThan(key);
    expect(key).toBeLessThan(render);
    expect(glossary).toContain('modules/02-rendering.md');
    expect(glossary).toContain('## C');
    expect(glossary).toContain('## K');
    expect(glossary).toContain('## R');
  });

  it('writes empty-state docs when no module is built', async () => {
    const empty = path.join(outDir, 'no-modules');
    await generateDocs({ modulesDir: empty, outDir });
    expect(await read('MEETING-CHEATSHEET.md')).toContain('No modules are built yet.');
    expect(await read('GLOSSARY.md')).toContain('No modules are built yet.');
    expect(await readdir(path.join(outDir, 'modules'))).toEqual([]);
  });

  it('rejects a module folder whose content slug does not match', async () => {
    const modulesDir = path.join(outDir, 'src-modules');
    await mkdir(path.join(modulesDir, '03-state-snapshots'), { recursive: true });
    await cp(
      path.join(fixtureModules, '02-rendering', 'content.ts'),
      path.join(modulesDir, '03-state-snapshots', 'content.ts'),
    );
    await expect(generateDocs({ modulesDir, outDir })).rejects.toThrow(/03-state-snapshots/);
  });

  it('removes module guides that no longer have a module', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    await writeFile(path.join(outDir, 'modules', '99-gone.md'), 'old');
    await generateDocs({ modulesDir: fixtureModules, outDir });
    expect(await readdir(path.join(outDir, 'modules'))).toEqual(['02-rendering.md']);
  });

  it('leaves hand-written docs next to the generated ones alone', async () => {
    await writeFile(path.join(outDir, 'GETTING-STARTED.md'), 'hand written');
    await generateDocs({ modulesDir: fixtureModules, outDir });
    expect(await read('GETTING-STARTED.md')).toBe('hand written');
  });
});

describe('generateDocs in check mode', () => {
  it('reports nothing right after a generate', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const result = await generateDocs({ modulesDir: fixtureModules, outDir, check: true });
    expect(result.stale).toEqual([]);
  });

  it('flags a generated file that was edited by hand', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const file = path.join(outDir, 'modules', '02-rendering.md');
    await writeFile(file, `${await readFile(file, 'utf8')}\nhand edit\n`);
    const result = await generateDocs({ modulesDir: fixtureModules, outDir, check: true });
    expect(result.stale).toEqual(['modules/02-rendering.md']);
  });

  it('flags a missing file and a leftover guide', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    await rm(path.join(outDir, 'GLOSSARY.md'));
    await writeFile(path.join(outDir, 'modules', '99-gone.md'), 'old');
    const result = await generateDocs({ modulesDir: fixtureModules, outDir, check: true });
    expect([...result.stale].sort()).toEqual(['GLOSSARY.md', 'modules/99-gone.md']);
  });

  it('does not write anything', async () => {
    const result = await generateDocs({ modulesDir: fixtureModules, outDir, check: true });
    expect(result.stale.length).toBe(3);
    await expect(readdir(path.join(outDir, 'modules'))).rejects.toThrow();
  });

  it('treats Windows line endings as identical', async () => {
    await generateDocs({ modulesDir: fixtureModules, outDir });
    const file = path.join(outDir, 'GLOSSARY.md');
    await writeFile(file, (await readFile(file, 'utf8')).replaceAll('\n', '\r\n'));
    const result = await generateDocs({ modulesDir: fixtureModules, outDir, check: true });
    expect(result.stale).toEqual([]);
  });
});

describe('gen-docs command line', () => {
  function run(...args: string[]) {
    return spawnSync(
      process.execPath,
      [script, '--modules-dir', fixtureModules, '--out-dir', outDir, ...args],
      { encoding: 'utf8' },
    );
  }

  it('exits 1 and lists the stale files when generated docs are out of date', async () => {
    expect(run().status).toBe(0);
    await writeFile(path.join(outDir, 'MEETING-CHEATSHEET.md'), 'tampered');
    const result = run('--check');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('MEETING-CHEATSHEET.md');
    expect(result.stderr).not.toContain('GLOSSARY.md');
  });

  it('exits 0 when everything is fresh', () => {
    expect(run().status).toBe(0);
    expect(run('--check').status).toBe(0);
  });
});
