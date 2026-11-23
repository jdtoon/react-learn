import { Command } from 'cmdk';
import {
  BookA,
  BookOpen,
  ClipboardList,
  CornerDownLeft,
  Hash,
  House,
  MessageSquareText,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildSearchIndex, searchItems, type SearchItem } from '../lib/search';

const kinds: Record<SearchItem['kind'], { label: string; Icon: LucideIcon }> = {
  module: { label: 'Module', Icon: BookOpen },
  term: { label: 'Term', Icon: Hash },
  talk: { label: 'Meeting card', Icon: MessageSquareText },
};

const pages = [
  { title: 'Home', detail: 'Curriculum map and progress', href: '/', Icon: House },
  {
    title: 'Meeting mode',
    detail: 'What to say, ask and watch for',
    href: '/meeting',
    Icon: ClipboardList,
  },
  {
    title: 'Glossary',
    detail: 'Key terms from every module, A to Z',
    href: '/glossary',
    Icon: BookA,
  },
];

const itemClass =
  'group grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2 data-[selected=true]:bg-surface-2 data-[selected=true]:shadow-[inset_3px_0_0_var(--accent)]';

function ResultRow({
  Icon,
  title,
  detail,
  label,
}: {
  Icon: LucideIcon;
  title: string;
  detail: string;
  label: string;
}) {
  return (
    <>
      <Icon
        aria-hidden="true"
        size={16}
        className="text-muted group-data-[selected=true]:text-accent"
      />
      <span className="min-w-0">
        <span className="block truncate text-[0.9rem] font-medium">{title}</span>
        <span className="block truncate text-[0.78rem] text-muted">{detail}</span>
      </span>
      <span className="font-mono text-[0.64rem] uppercase tracking-wider text-faint">{label}</span>
    </>
  );
}

export function PaletteBody({ onSelect }: { onSelect: (href: string) => void }) {
  const [query, setQuery] = useState('');
  const index = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(() => searchItems(index, query), [index, query]);
  const searching = query.trim().length > 0;

  return (
    <Command
      label="Search modules, terms and talk tracks"
      shouldFilter={false}
      vimBindings={false}
      loop
      className="flex flex-col"
    >
      <div className="flex items-center gap-2.5 border-b border-line px-3.5 focus-within:border-accent">
        <Search aria-hidden="true" size={17} className="shrink-0 text-muted" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          autoFocus
          aria-label="Search modules, terms and talk tracks"
          placeholder="Search modules, terms and meeting cards"
          className="h-12 min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-faint"
        />
        <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.64rem] text-muted sm:inline">
          Esc
        </kbd>
      </div>
      <Command.List
        label="Results"
        className="scroll-thin max-h-[min(22rem,55dvh)] overflow-y-auto overscroll-contain p-2"
      >
        {searching
          ? results.map((item) => {
              const { label, Icon } = kinds[item.kind];
              return (
                <Command.Item
                  key={`${item.kind}|${item.href}|${item.title}`}
                  value={`${item.kind}|${item.href}|${item.title}`}
                  aria-label={`${item.title}, ${label}`}
                  onSelect={() => onSelect(item.href)}
                  className={itemClass}
                >
                  <ResultRow Icon={Icon} title={item.title} detail={item.detail} label={label} />
                </Command.Item>
              );
            })
          : pages.map(({ title, detail, href, Icon }) => (
              <Command.Item
                key={href}
                value={`page|${href}`}
                aria-label={`${title}, Page`}
                onSelect={() => onSelect(href)}
                className={itemClass}
              >
                <ResultRow Icon={Icon} title={title} detail={detail} label="Page" />
              </Command.Item>
            ))}
      </Command.List>
      {searching && results.length === 0 && (
        <p role="status" className="px-4 pb-5 pt-3 text-sm text-muted">
          {`No results for “${query.trim()}”. Try a module name, a track or a term.`}
        </p>
      )}
      <div className="hidden items-center gap-4 border-t border-line px-3.5 py-2 font-mono text-[0.66rem] text-faint sm:flex">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-line bg-surface-2 px-1 py-px">↑</kbd>
          <kbd className="rounded border border-line bg-surface-2 px-1 py-px">↓</kbd>
          move
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-line bg-surface-2 px-1 py-px">
            <CornerDownLeft aria-hidden="true" size={11} />
          </kbd>
          open
        </span>
        <span className="ml-auto">{searching ? 'Best match first' : 'Type to search'}</span>
      </div>
    </Command>
  );
}
