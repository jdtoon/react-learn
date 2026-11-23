import {
  Activity,
  createContext,
  memo,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import { CodePeek, Meter } from '../../kit';
import { burn, timeToPaint } from './work';

type TabId = 'compose' | 'timer' | 'catalogue';
type Mode = 'unmount' | 'activity';

interface LogStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string[];
  add: (text: string) => void;
  reset: () => void;
}

const productCount = 30;
const productCostMs = 3;

const tabs: { id: TabId; label: string }[] = [
  { id: 'compose', label: 'Compose' },
  { id: 'timer', label: 'Timer' },
  { id: 'catalogue', label: 'Catalogue' },
];

const modes: { id: Mode; label: string; summary: string }[] = [
  {
    id: 'unmount',
    label: 'Unmount on switch',
    summary:
      'Only the selected tab exists. Leaving it unmounts the component, so its state and effects are destroyed, and coming back mounts it again from scratch.',
  },
  {
    id: 'activity',
    label: 'Activity, hidden',
    summary:
      'Every tab stays mounted. Hidden tabs are hidden with CSS, keep their state, have their effects cleaned up, and render at low priority in the background.',
  },
];

const code = `{tabs.map((tab) => (
  <Activity key={tab.id} mode={tab.id === current ? 'visible' : 'hidden'}>
    <TabPanel tab={tab.id} />
  </Activity>
))}

{current === 'compose' && <Compose />}
{current === 'timer' && <Timer />}`;

function createLogStore(): LogStore {
  let entries: string[] = [];
  let counter = 0;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => entries,
    add(text) {
      counter += 1;
      entries = [`${counter}. ${text}`, ...entries].slice(0, 8);
      emit();
    },
    reset() {
      counter = 0;
      entries = [];
      emit();
    },
  };
}

const LogContext = createContext<LogStore>(createLogStore());

function ComposeTab() {
  const [draft, setDraft] = useState('');

  return (
    <label className="grid gap-1.5 text-[0.88rem]">
      <span className="text-muted">Draft message</span>
      <textarea
        value={draft}
        rows={3}
        placeholder="Type something, then switch tabs"
        onChange={(event) => setDraft(event.target.value)}
        className="w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 text-[0.9rem] placeholder:text-faint"
      />
      <span className="font-mono text-[0.78rem] text-muted tabular-nums">{`${draft.length} characters`}</span>
    </label>
  );
}

function TimerTab() {
  const log = useContext(LogContext);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    log.add('Timer effect set up: interval started');
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => {
      window.clearInterval(id);
      log.add('Timer effect cleaned up: interval cleared');
    };
  }, [log]);

  return (
    <div className="grid gap-1">
      <p className="text-[0.88rem] text-muted">Seconds counted while this tab is visible</p>
      <p className="font-display text-[2rem] leading-none font-semibold tabular-nums">{seconds}</p>
    </div>
  );
}

function ProductRow({ index }: { index: number }) {
  burn(productCostMs);
  return (
    <li className="flex justify-between gap-3 border-b border-line px-2 py-1 text-[0.82rem]">
      <span>{`Product ${index + 1}`}</span>
      <span className="font-mono text-muted tabular-nums">{`£${(index + 1) * 7}.00`}</span>
    </li>
  );
}

const CatalogueRows = memo(function CatalogueRows() {
  return (
    <ul
      aria-label="Products"
      className="max-h-40 overflow-auto rounded-lg border border-line bg-surface"
    >
      {Array.from({ length: productCount }, (_, index) => (
        <ProductRow key={index} index={index} />
      ))}
    </ul>
  );
});

function CatalogueTab() {
  const [starred, setStarred] = useState(0);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="kit-btn" onClick={() => setStarred((value) => value + 1)}>
          Star this catalogue
        </button>
        <span className="font-mono text-[0.78rem] text-muted tabular-nums">{`starred ${starred}`}</span>
      </div>
      <CatalogueRows />
    </div>
  );
}

const panels: Record<TabId, ReactElement> = {
  compose: <ComposeTab />,
  timer: <TimerTab />,
  catalogue: <CatalogueTab />,
};

function TabPanels({ mode, current }: { mode: Mode; current: TabId }) {
  if (mode === 'unmount') return <div>{panels[current]}</div>;
  return (
    <div>
      {tabs.map((tab) => (
        <Activity key={tab.id} mode={tab.id === current ? 'visible' : 'hidden'}>
          {panels[tab.id]}
        </Activity>
      ))}
    </div>
  );
}

function LifecycleLog({ store }: { store: LogStore }) {
  const entries = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <div className="grid gap-1.5">
      <p className="eyebrow">Effect log, newest first</p>
      {entries.length === 0 ? (
        <p className="text-[0.82rem] text-faint">Nothing yet</p>
      ) : (
        <ol
          role="log"
          aria-label="Effect log"
          className="grid gap-0.5 font-mono text-[0.76rem] text-muted"
        >
          {entries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ActivityTabsLab() {
  const [log] = useState(createLogStore);
  const [mode, setMode] = useState<Mode>('unmount');
  const [current, setCurrent] = useState<TabId>('compose');
  const [switched, setSwitched] = useState<{ label: string; ms: number } | null>(null);

  const active = modes.find((candidate) => candidate.id === mode) ?? modes[0];
  if (!active) return null;

  function chooseMode(next: Mode) {
    if (next === mode) return;
    log.reset();
    setSwitched(null);
    setCurrent('compose');
    setMode(next);
  }

  function chooseTab(next: TabId, label: string) {
    if (next === current) return;
    timeToPaint(
      () => setCurrent(next),
      (ms) => setSwitched({ label, ms: Math.round(ms) }),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="How hidden tabs are handled" className="kit-seg">
          {modes.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === mode}
              onClick={() => chooseMode(candidate.id)}
            >
              {candidate.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Tab" className="kit-seg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={tab.id === current}
              onClick={() => chooseTab(tab.id, tab.label)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-3.5">
        <LogContext value={log}>
          <TabPanels key={mode} mode={mode} current={current} />
        </LogContext>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <div className="grid gap-1">
          <Meter
            label="Last tab switch, click to next paint"
            value={switched?.ms ?? 0}
            max={400}
            unit="ms"
            thresholds={{ warn: 50, bad: 200 }}
          />
          <p className="font-mono text-[0.78rem] text-muted">
            {switched ? `switched to ${switched.label}` : 'No switch yet'}
          </p>
        </div>
        <LifecycleLog store={log} />
      </div>

      <p
        role="status"
        aria-label="What this mode does"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {active.summary}
      </p>

      <p className="text-[0.78rem] text-faint">
        In development StrictMode adds an extra cleanup and setup each time a component mounts, so
        with unmounting the entries come in threes. The Catalogue renders {productCount} products at{' '}
        {productCostMs} ms each.
      </p>

      <CodePeek title="Activity versus conditional rendering" code={code} />
    </div>
  );
}
