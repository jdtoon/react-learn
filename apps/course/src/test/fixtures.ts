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

export function validContent(slug: string, overrides: Partial<ModuleContent> = {}): ModuleContent {
  return fixtureEntry(slug, {
    outcomes: ['Explain what triggers a render', 'Predict which components render again'],
    sections: [
      {
        heading: 'Trigger, render, commit',
        paragraphs: ['React runs your function again when state changes. The DOM updates last.'],
      },
    ],
    labs: [
      {
        id: 'demo',
        title: 'Demo lab',
        tryThis: ['Press the first button', 'Press the second button'],
        whatHappened: 'The second press changed nothing because the state was identical.',
      },
    ],
    pitfalls: [
      {
        title: 'Index keys',
        symptom: 'Typed text lands in the wrong row',
        cause: 'The key is the array index',
        fix: 'Use a stable id',
        bad: '<Row key={index} />',
        good: '<Row key={item.id} />',
      },
      {
        title: 'Copying props to state',
        symptom: 'The UI shows stale data',
        cause: 'State was initialised once from props',
        fix: 'Derive the value during render',
      },
      {
        title: 'Effect for derived data',
        symptom: 'An extra render on every change',
        cause: 'An effect sets state from other state',
        fix: 'Compute it while rendering',
      },
    ],
    meeting: {
      say: ['A render is React calling your function', 'The DOM only changes where output differs'],
      ask: ['Did we measure before adding memo?', 'Could this state live lower?'],
      redFlags: ['useEffect copying state into state', 'Index keys on a reorderable list'],
      tradeoff: 'Memoising trades memory and complexity for skipped work.',
    },
    selfCheck: [
      { question: 'Why did the child render?', answer: 'Its parent rendered.' },
      { question: 'When does set-same-value bail out?', answer: 'When Object.is says equal.' },
      { question: 'What does a key reset?', answer: 'The state of the subtree.' },
    ],
    links: [
      { label: 'Render and commit', url: 'https://react.dev/learn/render-and-commit' },
      {
        label: 'Preserving and resetting state',
        url: 'https://react.dev/learn/preserving-and-resetting-state',
      },
      { label: 'Rendering lists', url: 'https://react.dev/learn/rendering-lists' },
    ],
    glossary: [
      { term: 'Render', definition: 'Calling a component function to get its output.' },
      { term: 'Commit', definition: 'Applying the computed changes to the DOM.' },
      { term: 'Key', definition: 'The identity React uses to match list items.' },
    ],
    ...overrides,
  }).content;
}
