import { curriculum } from './curriculum';
import type { ModuleContent, ModuleMeta } from './types';

const maxSectionWords = 400;
const metaFields: (keyof ModuleMeta)[] = [
  'slug',
  'number',
  'title',
  'track',
  'oneIdea',
  'minutes',
  'phase',
];

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function inRange(count: number, min: number, max: number): boolean {
  return count >= min && count <= max;
}

function isHttps(url: string): boolean {
  if (!url.startsWith('https://')) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function checkMeta(c: ModuleContent, problems: string[]): void {
  const meta = curriculum.find((entry) => entry.slug === c.slug);
  if (!meta) {
    problems.push(`slug "${c.slug}" is not in the curriculum`);
    return;
  }
  for (const field of metaFields) {
    if (c[field] !== meta[field]) {
      problems.push(
        `${field} is ${JSON.stringify(c[field])} but the curriculum says ${JSON.stringify(meta[field])}`,
      );
    }
  }
}

export function validateModuleContent(c: ModuleContent): string[] {
  const problems: string[] = [];

  const words = c.sections.reduce(
    (total, section) =>
      total + section.paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0),
    0,
  );
  if (words > maxSectionWords) {
    problems.push(`sections total ${words} words, the limit is ${maxSectionWords}`);
  }

  if (!inRange(c.labs.length, 1, 3)) {
    problems.push(`has ${c.labs.length} labs, needs 1 to 3`);
  }
  if (c.pitfalls.length < 3) {
    problems.push(`has ${c.pitfalls.length} pitfalls, needs at least 3`);
  }
  if (!inRange(c.meeting.say.length, 2, 4)) {
    problems.push(`meeting say has ${c.meeting.say.length} lines, needs 2 to 4`);
  }
  if (c.meeting.ask.length < 2) {
    problems.push(`meeting ask has ${c.meeting.ask.length} lines, needs at least 2`);
  }
  if (c.meeting.redFlags.length < 2) {
    problems.push(`meeting red flags has ${c.meeting.redFlags.length} lines, needs at least 2`);
  }
  if (c.meeting.tradeoff.trim() === '') {
    problems.push('meeting trade-off is empty');
  }
  if (c.selfCheck.length !== 3) {
    problems.push(`has ${c.selfCheck.length} self-check items, needs exactly 3`);
  }
  if (!inRange(c.links.length, 3, 5)) {
    problems.push(`has ${c.links.length} links, needs 3 to 5`);
  }
  for (const link of c.links) {
    if (!isHttps(link.url)) problems.push(`link "${link.label}" must use https: ${link.url}`);
  }
  if (c.glossary.length < 3) {
    problems.push(`has ${c.glossary.length} glossary terms, needs at least 3`);
  }
  if (!inRange(c.outcomes.length, 2, 3)) {
    problems.push(`has ${c.outcomes.length} outcomes, needs 2 to 3`);
  }

  checkMeta(c, problems);
  return problems;
}
