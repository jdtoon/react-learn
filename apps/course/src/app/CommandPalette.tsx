import { Search } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PaletteBoundary } from './PaletteBoundary';

const shortcutLabel =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
    ? '⌘ K'
    : 'Ctrl K';

const loadPaletteBody = () => import('./PaletteBody');
const PaletteBody = lazy(async () => ({ default: (await loadPaletteBody()).PaletteBody }));

function prefetchPaletteBody() {
  loadPaletteBody().catch(() => undefined);
}

function PaletteFallback() {
  return (
    <div role="status" className="flex h-12 items-center px-4 font-mono text-sm text-muted">
      Loading search
    </div>
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
      prefetchPaletteBody();
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
          onPointerEnter={prefetchPaletteBody}
          onFocus={prefetchPaletteBody}
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
          <PaletteBoundary>
            <Suspense fallback={<PaletteFallback />}>
              <PaletteBody onSelect={select} />
            </Suspense>
          </PaletteBoundary>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
