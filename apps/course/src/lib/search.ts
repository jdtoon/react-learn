import { listBuiltContent } from '../content/builtContent';
import { curriculum, trackById } from '../content/curriculum';

export type SearchItem = {
  kind: 'module' | 'term' | 'talk';
  title: string;
  detail: string;
  href: string;
};

const defaultLimit = 8;

export function buildSearchIndex(): SearchItem[] {
  const modules: SearchItem[] = curriculum.map((meta) => ({
    kind: 'module',
    title: meta.title,
    detail: `${trackById[meta.track].title} · ${meta.oneIdea}`,
    href: `/modules/${meta.slug}`,
  }));

  const built = listBuiltContent();

  const terms: SearchItem[] = built.flatMap((content) =>
    content.glossary.map((entry): SearchItem => ({
      kind: 'term',
      title: entry.term,
      detail: entry.definition,
      href: `/modules/${content.slug}`,
    })),
  );

  const talks: SearchItem[] = built.map((content) => ({
    kind: 'talk',
    title: content.title,
    detail: [
      ...content.meeting.say,
      ...content.meeting.ask,
      ...content.meeting.redFlags,
      content.meeting.tradeoff,
    ].join(' '),
    href: `/meeting#${content.slug}`,
  }));

  return [...modules, ...terms, ...talks];
}

function rank(item: SearchItem, query: string, words: string[]): number | null {
  const title = item.title.toLowerCase();
  const detail = item.detail.toLowerCase();
  if (title.startsWith(query)) return 0;
  if (title.includes(query)) return 1;
  if (detail.includes(query)) return 2;
  if (words.length > 1 && words.every((word) => title.includes(word) || detail.includes(word))) {
    return 3;
  }
  return null;
}

export function searchItems(
  items: SearchItem[],
  query: string,
  limit: number = defaultLimit,
): SearchItem[] {
  const normalised = query.trim().toLowerCase();
  if (!normalised) return [];
  const words = normalised.split(/\s+/);

  return items
    .flatMap((item, index) => {
      const score = rank(item, normalised, words);
      return score === null ? [] : [{ item, score, index }];
    })
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map((match) => match.item);
}
