import { Dialog } from 'radix-ui';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

function PageFallback() {
  return (
    <div role="status" className="fade-in-late px-4 py-10 font-mono text-sm text-muted sm:px-8">
      Loading
    </div>
  );
}

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 900px)');
    const closeWhenWide = () => {
      if (wide.matches) setDrawerOpen(false);
    };
    wide.addEventListener('change', closeWhenWide);
    return () => wide.removeEventListener('change', closeWhenWide);
  }, []);

  return (
    <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
      <div className="min-h-dvh">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <TopBar />
        <div className="rail:grid rail:grid-cols-[var(--rail-w)_minmax(0,1fr)]">
          <Sidebar />
          <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <ScrollRestoration />
      </div>
    </Dialog.Root>
  );
}
