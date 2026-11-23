import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { curriculum, trackById, tracks } from '../src/content/curriculum.ts';
import type { ModuleContent } from '../src/content/types.ts';

const publicUrl = 'https://jdtoon.github.io/react-learn/';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultModulesDir = path.resolve(scriptDir, '..', 'src', 'modules');
const defaultOutDir = path.resolve(scriptDir, '..', '..', '..', 'docs');

export interface GenerateOptions {
  modulesDir?: string;
  outDir?: string;
  check?: boolean;
}

export interface GenerateResult {
  files: string[];
  stale: string[];
}

function pad(number: number): string {
  return String(number).padStart(2, '0');
}

function fence(code: string): string {
  const longestRun = Math.max(0, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
  return '`'.repeat(Math.max(3, longestRun + 1));
}

function codeBlock(code: string, lang: string): string {
  const marks = fence(code);
  return `${marks}${lang}\n${code}\n${marks}`;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function headerLine(slug?: string): string {
  const target = slug
    ? `\`apps/course/src/modules/${slug}/content.ts\``
    : 'the `content.ts` file of each module in `apps/course/src/modules/`';
  return `> Generated from the app's content. Edit ${target}.`;
}

function moduleUrl(slug: string, hash = ''): string {
  return `${publicUrl}modules/${slug}${hash}`;
}

function moduleLabel(content: ModuleContent): string {
  return `${pad(content.number)}. ${content.title}`;
}

function meetingParts(content: ModuleContent): string[] {
  const { say, ask, redFlags, tradeoff } = content.meeting;
  return [
    `**Say**\n\n${bullets(say)}`,
    `**Ask**\n\n${bullets(ask)}`,
    `**Red flags**\n\n${bullets(redFlags)}`,
    `**Trade-off:** ${tradeoff}`,
  ];
}

export function renderModuleDoc(content: ModuleContent): string {
  const track = trackById[content.track];
  const blocks: string[] = [
    headerLine(content.slug),
    `# ${moduleLabel(content)}`,
    `**${track.title}** · Module ${pad(content.number)} · ${content.minutes} min · [Open in the app](${moduleUrl(content.slug)})`,
    `**The one idea:** ${content.oneIdea}`,
    `## After this you can\n\n${bullets(content.outcomes)}`,
  ];

  if (content.sections.length > 0) {
    const sections = content.sections.map(
      (section) => `### ${section.heading}\n\n${section.paragraphs.join('\n\n')}`,
    );
    blocks.push(`## The model\n\n${sections.join('\n\n')}`);
  }

  if (content.labs.length > 0) {
    const labs = content.labs.map(
      (lab) =>
        `### ${lab.title}\n\nTry this:\n\n${bullets(lab.tryThis)}\n\n[Open the live lab](${moduleUrl(content.slug, `#lab-${lab.id}`)})`,
    );
    blocks.push(
      `## Labs\n\nThe labs run in the app. Each one below links to the live version.\n\n${labs.join('\n\n')}`,
    );
  }

  if (content.pitfalls.length > 0) {
    const pitfalls = content.pitfalls.map((pitfall) => {
      const parts = [
        `### ${pitfall.title}`,
        bullets([
          `**Symptom:** ${pitfall.symptom}`,
          `**Cause:** ${pitfall.cause}`,
          `**Fix:** ${pitfall.fix}`,
        ]),
      ];
      if (pitfall.bad !== undefined) parts.push(`Bad:\n\n${codeBlock(pitfall.bad, 'tsx')}`);
      if (pitfall.good !== undefined) parts.push(`Good:\n\n${codeBlock(pitfall.good, 'tsx')}`);
      return parts.join('\n\n');
    });
    blocks.push(`## Pitfalls\n\n${pitfalls.join('\n\n')}`);
  }

  blocks.push(`## In the meeting\n\n${meetingParts(content).join('\n\n')}`);

  if (content.selfCheck.length > 0) {
    const questions = content.selfCheck.map(
      (item, index) =>
        `${index + 1}. ${item.question}\n\n   <details>\n   <summary>Answer</summary>\n\n   ${item.answer}\n\n   </details>`,
    );
    blocks.push(`## Self-check\n\n${questions.join('\n\n')}`);
  }

  if (content.links.length > 0) {
    blocks.push(
      `## Go deeper\n\n${bullets(content.links.map((link) => `[${link.label}](${link.url})`))}`,
    );
  }

  return `${blocks.join('\n\n')}\n`;
}

export function renderCheatsheet(modules: ModuleContent[]): string {
  const blocks: string[] = [
    headerLine(),
    '# Meeting cheatsheet',
    `What to say, what to ask and what to watch for, one card per module. The live version is at ${publicUrl}meeting.`,
  ];

  if (modules.length === 0) {
    blocks.push('No modules are built yet.');
    return `${blocks.join('\n\n')}\n`;
  }

  for (const track of tracks) {
    const inTrack = modules.filter((content) => content.track === track.id);
    if (inTrack.length === 0) continue;
    blocks.push(`## ${track.title}`);
    for (const content of inTrack) {
      blocks.push(
        `### ${moduleLabel(content)}`,
        `*${content.oneIdea}*`,
        meetingParts(content).join('\n\n'),
        `[Full module guide](modules/${content.slug}.md)`,
      );
    }
  }
  return `${blocks.join('\n\n')}\n`;
}

function letterOf(term: string): string {
  const first = term.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : 'Other';
}

export function renderGlossary(modules: ModuleContent[]): string {
  const blocks: string[] = [
    headerLine(),
    '# Glossary',
    'Every key term in one line, in A to Z order, with the module that teaches it.',
  ];

  const entries = modules
    .flatMap((content) => content.glossary.map((entry) => ({ ...entry, content })))
    .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));

  if (entries.length === 0) {
    blocks.push('No modules are built yet.');
    return `${blocks.join('\n\n')}\n`;
  }

  const byLetter = new Map<string, typeof entries>();
  for (const entry of entries) {
    const letter = letterOf(entry.term);
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry]);
  }

  blocks.push(
    `Jump to: ${[...byLetter.keys()].map((letter) => `[${letter}](#${letter.toLowerCase()})`).join(' · ')}`,
  );
  for (const [letter, items] of byLetter) {
    blocks.push(
      `## ${letter}`,
      bullets(
        items.map(
          (item) =>
            `**${item.term}**: ${item.definition} See [${moduleLabel(item.content)}](modules/${item.content.slug}.md).`,
        ),
      ),
    );
  }
  return `${blocks.join('\n\n')}\n`;
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function loadModules(modulesDir: string): Promise<ModuleContent[]> {
  let folders: string[];
  try {
    folders = (await readdir(modulesDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }

  const modules: ModuleContent[] = [];
  for (const folder of folders) {
    const file = path.join(modulesDir, folder, 'content.ts');
    if (!(await exists(file))) continue;
    const loaded: { content?: ModuleContent; default?: ModuleContent } = await import(
      pathToFileURL(file).href
    );
    const content = loaded.content ?? loaded.default;
    if (!content) throw new Error(`Module folder "${folder}" does not export its content`);
    if (content.slug !== folder) {
      throw new Error(`Module folder "${folder}" has content for slug "${content.slug}"`);
    }
    if (!curriculum.some((meta) => meta.slug === content.slug)) {
      throw new Error(`Module folder "${folder}" is not in the curriculum`);
    }
    modules.push(content);
  }

  const order = (slug: string) => curriculum.findIndex((meta) => meta.slug === slug);
  return modules.sort((a, b) => order(a.slug) - order(b.slug));
}

function normalise(text: string): string {
  return text.replaceAll('\r\n', '\n');
}

async function readIfPresent(file: string): Promise<string | undefined> {
  try {
    return normalise(await readFile(file, 'utf8'));
  } catch {
    return undefined;
  }
}

async function listGuides(modulesOut: string): Promise<string[]> {
  try {
    return (await readdir(modulesOut)).filter((name) => name.endsWith('.md'));
  } catch {
    return [];
  }
}

export async function generateDocs(options: GenerateOptions = {}): Promise<GenerateResult> {
  const modulesDir = options.modulesDir ?? defaultModulesDir;
  const outDir = options.outDir ?? defaultOutDir;
  const modules = await loadModules(modulesDir);

  const expected = new Map<string, string>();
  for (const content of modules) {
    expected.set(`modules/${content.slug}.md`, renderModuleDoc(content));
  }
  expected.set('MEETING-CHEATSHEET.md', renderCheatsheet(modules));
  expected.set('GLOSSARY.md', renderGlossary(modules));

  const modulesOut = path.join(outDir, 'modules');
  const leftovers = (await listGuides(modulesOut))
    .map((name) => `modules/${name}`)
    .filter((relative) => !expected.has(relative));

  if (options.check) {
    const stale: string[] = [];
    for (const [relative, text] of expected) {
      if ((await readIfPresent(path.join(outDir, relative))) !== text) stale.push(relative);
    }
    return { files: [...expected.keys()], stale: [...stale, ...leftovers] };
  }

  await mkdir(modulesOut, { recursive: true });
  for (const [relative, text] of expected) {
    await writeFile(path.join(outDir, relative), text);
  }
  for (const relative of leftovers) {
    await rm(path.join(outDir, relative));
  }
  return { files: [...expected.keys()], stale: [] };
}

function parseArgs(argv: string[]): GenerateOptions {
  const options: GenerateOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') options.check = true;
    else if (arg === '--modules-dir') options.modulesDir = path.resolve(argv[++index] ?? '');
    else if (arg === '--out-dir') options.outDir = path.resolve(argv[++index] ?? '');
    else throw new Error(`Unknown argument "${arg}"`);
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await generateDocs(options);
  if (options.check) {
    if (result.stale.length > 0) {
      console.error(
        `Generated docs are stale:\n${result.stale.map((file) => `  docs/${file}`).join('\n')}\nRun "pnpm run docs:gen" and commit the result.`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(`Generated docs are up to date (${result.files.length} files).`);
    return;
  }
  console.log(`Wrote ${result.files.length} generated docs.`);
}

if (import.meta.main) {
  await main();
}
