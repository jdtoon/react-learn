import { ClipboardList, Menu, Search } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { Link } from 'react-router';
import { ThemeToggle } from './ThemeToggle';

const markBars = [
  { x: 0, height: 11, fill: 'fill-track-foundations' },
  { x: 4.5, height: 17, fill: 'fill-track-architecture' },
  { x: 9, height: 22, fill: 'fill-track-performance' },
  { x: 13.5, height: 15, fill: 'fill-track-craft' },
  { x: 18, height: 19, fill: 'fill-track-production' },
  { x: 22.5, height: 13, fill: 'fill-track-micro-frontends' },
];

function BrandMark() {
  return (
    <svg
      width="26"
      height="22"
      viewBox="0 0 26 22"
      aria-hidden="true"
      className="hidden shrink-0 min-[380px]:block"
    >
      {markBars.map(({ x, height, fill }) => (
        <rect key={x} x={x} y={22 - height} width="3" height={height} rx="1.5" className={fill} />
      ))}
    </svg>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="track-strip" aria-hidden="true" />
      <div className="flex h-[calc(var(--topbar-h)-2px)] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="Open course navigation"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg hover:border-accent sm:size-9 rail:hidden"
          >
            <Menu aria-hidden="true" size={18} />
          </button>
        </Dialog.Trigger>
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 rounded-md font-display text-[0.95rem] font-semibold tracking-tight sm:gap-2.5 sm:text-[1.02rem]"
        >
          <BrandMark />
          <span className="truncate">React Field Guide</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-keyshortcuts="Control+K Meta+K"
            className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2 text-sm text-muted hover:border-accent hover:text-fg sm:h-9 sm:px-2.5 md:w-56"
          >
            <Search aria-hidden="true" size={16} className="shrink-0" />
            <span className="sr-only md:not-sr-only md:flex-1 md:text-left">Search</span>
            <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.68rem] text-muted md:inline">
              Ctrl K
            </kbd>
          </button>
          <Link
            to="/meeting"
            className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2 text-sm text-fg hover:border-accent sm:h-9 sm:px-2.5"
          >
            <ClipboardList aria-hidden="true" size={16} className="shrink-0" />
            <span className="sr-only lg:not-sr-only">Meeting mode</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
