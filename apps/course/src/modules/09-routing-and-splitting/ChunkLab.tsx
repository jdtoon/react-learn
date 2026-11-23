import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react';
import { Meter, sleep } from '../../kit';
import { cn } from '../../kit/cn';

type Mode = 'bundle' | 'split' | 'prefetch';
type ChunkId = 'entry' | 'charts' | 'dashboard' | 'reports' | 'settings';
type RouteId = 'home' | 'dashboard' | 'reports' | 'settings';
type Origin = 'initial' | 'prefetch' | 'click';
type ChunkState = 'idle' | 'loading' | 'loaded';

interface Chunk {
  id: ChunkId;
  file: string;
  kb: number;
  note: string;
}

interface RouteSpec {
  id: RouteId;
  label: string;
  path: string;
  needs: ChunkId[];
}

interface ChunkStatus {
  state: ChunkState;
  by: Origin | null;
}

type Snapshot = Record<ChunkId, ChunkStatus>;

interface Visit {
  id: number;
  label: string;
  ms: number;
  how: string;
  fetchedKb: number;
}

interface ScreenProps {
  onShown: (route: RouteId) => void;
}

const roundTripMs = 80;

const chunks: Chunk[] = [
  { id: 'entry', file: 'index.js', kb: 72, note: 'React, router, layout, home' },
  { id: 'charts', file: 'charts.js', kb: 64, note: 'Chart library, shared' },
  { id: 'dashboard', file: 'dashboard.js', kb: 38, note: 'Dashboard route' },
  { id: 'reports', file: 'reports.js', kb: 54, note: 'Reports route' },
  { id: 'settings', file: 'settings.js', kb: 21, note: 'Settings route' },
];

const chunkById = Object.fromEntries(chunks.map((chunk) => [chunk.id, chunk])) as Record<
  ChunkId,
  Chunk
>;

const routes: RouteSpec[] = [
  { id: 'home', label: 'Home', path: '/', needs: [] },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', needs: ['dashboard', 'charts'] },
  { id: 'reports', label: 'Reports', path: '/reports', needs: ['reports', 'charts'] },
  { id: 'settings', label: 'Settings', path: '/settings', needs: ['settings'] },
];

const routeById = Object.fromEntries(routes.map((route) => [route.id, route])) as Record<
  RouteId,
  RouteSpec
>;

const modes: { id: Mode; label: string; note: string }[] = [
  {
    id: 'bundle',
    label: 'One bundle',
    note: 'Every route is in the entry bundle. The first load carries all of it and every navigation is instant.',
  },
  {
    id: 'split',
    label: 'Split by route',
    note: 'Each route is its own chunk, fetched when you click. The first load is small and a click can wait for the network.',
  },
  {
    id: 'prefetch',
    label: 'Split and prefetch on hover',
    note: 'The same chunks, but hovering or focusing a link starts the download before the click.',
  },
];

function initialSnapshot(mode: Mode): Snapshot {
  const snapshot = {} as Snapshot;
  for (const chunk of chunks) {
    const included = mode === 'bundle' || chunk.id === 'entry';
    snapshot[chunk.id] = included
      ? { state: 'loaded', by: 'initial' }
      : { state: 'idle', by: null };
  }
  return snapshot;
}

function createLoader(mode: Mode, speed: RefObject<number>) {
  let snapshot = initialSnapshot(mode);
  const listeners = new Set<() => void>();
  const inflight = new Map<ChunkId, Promise<void>>();

  function update(id: ChunkId, status: ChunkStatus) {
    snapshot = { ...snapshot, [id]: status };
    listeners.forEach((listener) => listener());
  }

  function request(id: ChunkId, by: Origin): Promise<void> {
    if (snapshot[id].state === 'loaded') return Promise.resolve();
    const existing = inflight.get(id);
    if (existing) return existing;
    update(id, { state: 'loading', by });
    const duration = roundTripMs + (chunkById[id].kb / speed.current) * 1000;
    const promise = sleep(duration).then(() => update(id, { state: 'loaded', by }));
    inflight.set(id, promise);
    return promise;
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    loadRoute(route: RouteId, by: Origin): Promise<void> {
      return Promise.all(routeById[route].needs.map((id) => request(id, by))).then(() => undefined);
    },
  };
}

type Loader = ReturnType<typeof createLoader>;

function startClock(): number {
  return performance.now();
}

function elapsedSince(start: number): number {
  return Math.round(performance.now() - start);
}

function describeVisit(route: RouteId, before: Snapshot): { how: string; fetchedKb: number } {
  const needs = routeById[route].needs;
  const missing = needs.filter((id) => before[id].state !== 'loaded');
  const fetchedKb = missing.reduce((total, id) => total + chunkById[id].kb, 0);
  if (needs.length === 0) return { how: 'in the entry chunk', fetchedKb };
  if (missing.length === 0) {
    const prefetched = needs.some((id) => before[id].by === 'prefetch');
    return { how: prefetched ? 'prefetched earlier' : 'already in memory', fetchedKb };
  }
  const prefetching = missing.some((id) => before[id].state === 'loading');
  return {
    how: prefetching ? 'finished a prefetch in progress' : 'downloaded on click',
    fetchedKb,
  };
}

function useShown(onShown: (route: RouteId) => void, route: RouteId) {
  useEffect(() => {
    onShown(route);
  }, [onShown, route]);
}

function MiniChart() {
  return (
    <div aria-hidden="true" className="flex h-10 items-end gap-1">
      {[40, 70, 55, 90, 65, 80].map((height, index) => (
        <span
          key={index}
          className="w-4 rounded-sm bg-(--tc,var(--accent))"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function HomeScreen({ onShown }: ScreenProps) {
  useShown(onShown, 'home');
  return <ScreenBody title="Home" text="Welcome back. This screen lives in the entry chunk." />;
}

function DashboardScreen({ onShown }: ScreenProps) {
  useShown(onShown, 'dashboard');
  return (
    <ScreenBody title="Dashboard" text="Revenue this week. Uses the shared charts chunk.">
      <MiniChart />
    </ScreenBody>
  );
}

function ReportsScreen({ onShown }: ScreenProps) {
  useShown(onShown, 'reports');
  return (
    <ScreenBody title="Reports" text="Monthly report. Uses the shared charts chunk too.">
      <MiniChart />
    </ScreenBody>
  );
}

function SettingsScreen({ onShown }: ScreenProps) {
  useShown(onShown, 'settings');
  return <ScreenBody title="Settings" text="Account and notification preferences." />;
}

function ScreenBody({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <h4>{title}</h4>
      <p className="text-[0.88rem] text-muted">{text}</p>
      {children}
    </div>
  );
}

const screens: Record<RouteId, ComponentType<ScreenProps>> = {
  home: HomeScreen,
  dashboard: DashboardScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
};

function createLazyScreens(loader: Loader): Record<RouteId, ComponentType<ScreenProps>> {
  const make = (id: RouteId) =>
    lazy(() => loader.loadRoute(id, 'click').then(() => ({ default: screens[id] })));
  return {
    home: screens.home,
    dashboard: make('dashboard'),
    reports: make('reports'),
    settings: make('settings'),
  };
}

function chunkLabel(status: ChunkStatus): string {
  if (status.state === 'idle') return 'not loaded';
  if (status.state === 'loading') return status.by === 'prefetch' ? 'prefetching' : 'loading';
  if (status.by === 'initial') return 'first load';
  return status.by === 'prefetch' ? 'prefetched' : 'loaded on click';
}

function ChunkMap({ snapshot }: { snapshot: Snapshot }) {
  return (
    <ul aria-label="Chunk map" className="flex flex-wrap gap-2">
      {chunks.map((chunk) => {
        const status = snapshot[chunk.id];
        return (
          <li
            key={chunk.id}
            data-chunk={chunk.id}
            data-state={status.state}
            style={{ flexGrow: chunk.kb }}
            className={cn(
              'grid min-w-[7.5rem] content-between gap-1 rounded-lg border px-3 py-2',
              status.state === 'idle' && 'border-dashed border-line text-muted',
              status.state === 'loading' &&
                'border-accent bg-[repeating-linear-gradient(45deg,var(--surface-2)_0_6px,var(--surface)_6px_12px)]',
              status.state === 'loaded' && 'border-accent bg-surface-2',
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[0.8rem]">{chunk.file}</span>
              <span className="font-mono text-[0.76rem] tabular-nums text-muted">{`${chunk.kb} KB`}</span>
            </div>
            <p className="text-[0.74rem] text-muted">{chunk.note}</p>
            <p
              className={cn(
                'font-mono text-[0.68rem] uppercase tracking-[0.08em]',
                status.state === 'loaded' && 'tone-ok',
                status.state === 'loading' && 'tone-warn',
              )}
            >
              {chunkLabel(status)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Demo({ mode, speed }: { mode: Mode; speed: RefObject<number> }) {
  const [loader] = useState(() => createLoader(mode, speed));
  const [lazyScreens] = useState(() => createLazyScreens(loader));
  const snapshot = useSyncExternalStore(loader.subscribe, loader.getSnapshot);
  const [current, setCurrent] = useState<RouteId>('home');
  const [target, setTarget] = useState<RouteId>('home');
  const [isPending, startTransition] = useTransition();
  const [visits, setVisits] = useState<Visit[]>([]);
  const pending = useRef<{
    route: RouteId;
    startedAt: number;
    done: boolean;
    visit: Omit<Visit, 'ms'>;
  } | null>(null);
  const nextId = useRef(1);

  const View = (mode === 'bundle' ? screens : lazyScreens)[current];
  const firstLoadKb = chunks
    .filter((chunk) => snapshot[chunk.id].by === 'initial')
    .reduce((total, chunk) => total + chunk.kb, 0);
  const requestedKb = chunks
    .filter((chunk) => snapshot[chunk.id].state !== 'idle')
    .reduce((total, chunk) => total + chunk.kb, 0);
  const lastVisit = visits[0];
  const loadingFiles = routeById[target].needs
    .filter((id) => snapshot[id].state !== 'loaded')
    .map((id) => chunkById[id].file);

  function go(route: RouteId) {
    if (route === target) return;
    const { how, fetchedKb } = describeVisit(route, snapshot);
    const id = nextId.current;
    nextId.current += 1;
    pending.current = {
      route,
      startedAt: startClock(),
      done: false,
      visit: { id, label: routeById[route].label, how, fetchedKb },
    };
    void loader.loadRoute(route, 'click');
    setTarget(route);
    startTransition(() => setCurrent(route));
  }

  function reportShown(route: RouteId) {
    const navigation = pending.current;
    if (!navigation || navigation.done || navigation.route !== route) return;
    navigation.done = true;
    const ms = elapsedSince(navigation.startedAt);
    setVisits((list) => [{ ...navigation.visit, ms }, ...list].slice(0, 6));
  }

  function prefetch(route: RouteId) {
    if (mode === 'prefetch') void loader.loadRoute(route, 'prefetch');
  }

  return (
    <div className="grid gap-4">
      <ChunkMap snapshot={snapshot} />

      <div className="overflow-hidden rounded-xl border border-line bg-bg">
        <div className="border-b border-line bg-surface px-3 py-2 font-mono text-[0.76rem] text-muted">
          {`app.example.com${routeById[current].path}`}
        </div>
        <nav aria-label="App routes" className="flex flex-wrap gap-1.5 border-b border-line p-2">
          {routes.map((route) => (
            <button
              key={route.id}
              type="button"
              aria-current={route.id === target ? 'page' : undefined}
              onClick={() => go(route.id)}
              onPointerEnter={() => prefetch(route.id)}
              onFocus={() => prefetch(route.id)}
              className="kit-btn aria-[current=page]:border-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg"
            >
              {route.label}
            </button>
          ))}
        </nav>
        <div aria-label="Screen" role="region" className="grid min-h-28 gap-2 p-4">
          {isPending && (
            <p role="status" className="font-mono text-[0.82rem] tone-warn">
              {`Pending: downloading ${loadingFiles.join(' and ') || 'the screen'}. The old screen stays up.`}
            </p>
          )}
          <div className={isPending ? 'opacity-60' : undefined}>
            <Suspense
              fallback={
                <p role="status" className="font-mono text-[0.82rem] tone-warn">
                  Fallback: loading the screen
                </p>
              }
            >
              <View onShown={reportShown} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <Meter
          label="JavaScript before the first screen"
          value={firstLoadKb}
          max={300}
          unit="KB"
          thresholds={{ warn: 150, bad: 200 }}
        />
        <Meter label="JavaScript requested so far" value={requestedKb} max={300} unit="KB" />
        <Meter
          label={lastVisit ? `Last click to screen: ${lastVisit.label}` : 'Last click to screen'}
          value={lastVisit?.ms ?? 0}
          max={1500}
          unit="ms"
          thresholds={{ warn: 200, bad: 500 }}
        />
      </div>

      <div className="grid gap-1.5">
        <p className="eyebrow">Navigation log</p>
        <ol
          aria-label="Navigation log"
          className="grid min-h-[3.5rem] content-start gap-0.5 rounded-lg border border-line bg-surface p-2 font-mono text-[0.76rem]"
        >
          {visits.length === 0 && <li className="text-faint">Click a route to start.</li>}
          {visits.map((visit) => (
            <li key={visit.id} className="flex flex-wrap gap-x-3">
              <span className="w-24 shrink-0">{visit.label}</span>
              <span className="w-16 shrink-0 text-right tabular-nums">{`${visit.ms} ms`}</span>
              <span className="min-w-0 text-muted">
                {`${visit.how}${visit.fetchedKb > 0 ? `, ${visit.fetchedKb} KB fetched` : ''}`}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function ChunkLab() {
  const [mode, setMode] = useState<Mode>('split');
  const [speed, setSpeed] = useState(300);
  const [generation, setGeneration] = useState(0);
  const speedRef = useRef(speed);
  const current = modes.find((item) => item.id === mode) ?? modes[0];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Loading strategy" className="kit-seg">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === mode}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="kit-btn"
          onClick={() => setGeneration((value) => value + 1)}
        >
          Reset
        </button>
      </div>

      <label className="grid gap-1.5 text-[0.88rem]">
        <span className="text-muted">{`Connection speed: ${speed} KB/s plus ${roundTripMs} ms round trip`}</span>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={speed}
          onChange={(event) => {
            const value = Number(event.target.value);
            speedRef.current = value;
            setSpeed(value);
          }}
          className="w-56 max-w-full accent-(--accent)"
        />
      </label>

      {current && <p className="max-w-[68ch] text-[0.88rem] text-muted">{current.note}</p>}

      <Demo key={`${mode}-${generation}`} mode={mode} speed={speedRef} />
    </div>
  );
}
