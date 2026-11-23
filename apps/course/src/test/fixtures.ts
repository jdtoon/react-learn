import { curriculum } from '../content/curriculum';
import type { ModuleContent, ModuleEntry } from '../content/types';

export function fixtureEntry(slug: string, overrides: Partial<ModuleContent> = {}): ModuleEntry {
  const meta = curriculum.find((module) => module.slug === slug);
  if (!meta) throw new Error(`Unknown fixture module ${slug}`);
  const content: ModuleContent = {
    ...meta,
    outcomes: ['Explain what triggers a render'],
    sections: [],
    labs: [],
    pitfalls: [],
    meeting: {
      say: [`Say one thing about ${meta.title}`, 'Say a second thing'],
      ask: [`Ask a question about ${meta.title}`],
      redFlags: ['A red flag worth naming'],
      tradeoff: `The trade-off inside ${meta.title}`,
    },
    selfCheck: [],
    links: [],
    glossary: [
      { term: 'Reconciliation', definition: 'Comparing two element trees to find the changes.' },
      { term: 'Commit', definition: 'Applying the computed changes to the DOM.' },
    ],
    ...overrides,
  };
  return { content, loadLabs: async () => ({ labs: {} }) };
}

export function clearBuilt(built: Record<string, ModuleEntry>): void {
  for (const slug of Object.keys(built)) Reflect.deleteProperty(built, slug);
}
