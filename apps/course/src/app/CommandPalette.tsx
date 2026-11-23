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
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { buildSearchIndex, searchItems, type SearchItem } from '../lib/search';

const shortcutLabel =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
    ? '⌘ K'
    : 'Ctrl K';

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

function PaletteBody({ onSelect }: { onSelect: (href: string) => void }) {
  const [query, setQuery] = useState('');
  const index = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(() => searchItems(index, query), [index, query]);
  const searching = query.trim().length > 0;

  return (
    <Command
      label="Search the field guide"
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

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const leavingPage = useRef(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      setOpen((current) => !current);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function select(href: string) {
    leavingPage.current = (href.split('#')[0] || '/') !== pathname;
    setOpen(false);
    void navigate(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-keyshortcuts="Control+K Meta+K"
          className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2 text-sm text-muted hover:border-accent hover:text-fg sm:h-9 sm:px-2.5 md:w-56"
        >
          <Search aria-hidden="true" size={16} className="shrink-0" />
          <span className="sr-only md:not-sr-only md:flex-1 md:text-left">Search</span>
          <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.68rem] text-muted md:inline">
            {shortcutLabel}
          </kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-[60] bg-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            if (!leavingPage.current) return;
            leavingPage.current = false;
            event.preventDefault();
          }}
          className="palette-panel fixed inset-x-0 top-[10dvh] z-[70] mx-auto w-[min(38rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-12px_rgb(0_0_0/0.5)]"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <PaletteBody onSelect={select} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
