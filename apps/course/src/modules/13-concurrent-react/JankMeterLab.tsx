import {
  createContext,
  memo,
  useContext,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ComponentType,
} from 'react';
import { CodePeek, Meter } from '../../kit';
import { cn } from '../../kit/cn';
import { createJankStore, type JankStore } from './jankStore';
import { afterPaint, burn, typeInto } from './work';

type Mode = 'blocking' | 'transition' | 'deferred';
type Cost = 'light' | 'heavy';

interface TypingProps {
  perRowMs: number;
  memoList: boolean;
}

const modes: { id: Mode; label: string; summary: string; code: string }[] = [
  {
    id: 'blocking',
    label: 'Blocking',
    summary:
      'Every keystroke updates the input and the list in one urgent render. The next key waits until the whole list has rendered.',
    code: `const [query, setQuery] = useState('');

<input value={query} onChange={(e) => setQuery(e.target.value)} />
<SlowList query={query} />`,
  },
  {
    id: 'transition',
    label: 'useTransition',
    summary:
      'The input updates urgently. The list update is marked as a transition, so React renders it in slices and abandons it when a newer keystroke arrives.',
    code: `const [value, setValue] = useState('');
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setValue(e.target.value);
  startTransition(() => setQuery(e.target.value));
}

<input value={value} onChange={onChange} />
<SlowList query={query} />`,
  },
  {
    id: 'deferred',
    label: 'useDeferredValue',
    summary:
      'The input updates urgently. The list receives a deferred copy of the value that lags during urgent renders and catches up in the background.',
    code: `const [value, setValue] = useState('');
const deferred = useDeferredValue(value);

<input value={value} onChange={(e) => setValue(e.target.value)} />
<SlowList query={deferred} />`,
  },
];

const costs: { id: Cost; label: string; perRowMs: number }[] = [
  { id: 'light', label: 'Light list', perRowMs: 0.15 },
  { id: 'heavy', label: 'Heavy list', perRowMs: 0.4 },
];

const vocabulary = [
  'concurrent',
  'react',
  'render',
  'priority',
  'transition',
  'deferred',
  'suspense',
  'fiber',
  'commit',
  'scheduler',
];
const labels = Array.from({ length: 200 }, (_, index) => {
  return `${vocabulary[index % vocabulary.length]} ${index + 1}`;
});
const typedText = 'transition';
const stripScaleMs = 300;

const JankContext = createContext<JankStore>(createJankStore());

function SlowRow({ label, query, perRowMs }: { label: string; query: string; perRowMs: number }) {
  burn(perRowMs);
  const matched = query !== '' && label.includes(query);
  return (
    <li
      className={cn(
        'truncate rounded px-1.5 py-0.5 font-mono text-[0.72rem]',
        matched
          ? 'bg-[color-mix(in_oklab,var(--tc,var(--accent))_20%,transparent)] font-medium text-fg'
          : 'text-faint',
      )}
    >
      {label}
    </li>
  );
}

function SlowList({ query, perRowMs }: { query: string; perRowMs: number }) {
  const store = useContext(JankContext);
  const normalised = query.trim().toLowerCase();

  useLayoutEffect(() => {
    store.listCommitted(query);
  }, [store, query]);

  const matches =
    normalised === '' ? 0 : labels.filter((label) => label.includes(normalised)).length;

  return (
    <div className="grid gap-2">
      <p className="font-mono text-[0.78rem] text-muted tabular-nums">
        {`list is showing "${query}", ${matches} matches`}
      </p>
      <ul
        aria-label="Results"
        className="grid max-h-44 grid-cols-2 gap-0.5 overflow-auto rounded-lg border border-line bg-surface p-1.5 sm:grid-cols-4"
      >
        {labels.map((label) => (
          <SlowRow key={label} label={label} query={normalised} perRowMs={perRowMs} />
        ))}
      </ul>
    </div>
  );
}

const MemoSlowList = memo(SlowList);

interface TypingViewProps extends TypingProps {
  value: string;
  listQuery: string;
  stale: boolean;
  onType: (next: string) => void;
}

function TypingView({ value, listQuery, stale, onType, perRowMs, memoList }: TypingViewProps) {
  const store = useContext(JankContext);
  const List = memoList ? MemoSlowList : SlowList;

  return (
    <div className="grid gap-3">
      <label className="grid gap-1.5 text-[0.88rem]">
        <span className="text-muted">Filter the list</span>
        <input
          type="text"
          value={value}
          placeholder="Type to filter"
          onChange={(event) => {
            const startedAt = event.nativeEvent.timeStamp;
            store.keystroke(event.target.value, startedAt);
            afterPaint(() => store.record(performance.now() - startedAt));
            onType(event.target.value);
          }}
          className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
        />
      </label>
      <div className={cn('transition-opacity duration-150', stale && 'opacity-55')}>
        <List query={listQuery} perRowMs={perRowMs} />
      </div>
      <p aria-live="polite" className="min-h-[1.4em] text-[0.8rem] text-muted">
        {stale ? 'Updating the list in the background…' : ''}
      </p>
    </div>
  );
}

function BlockingTyping(props: TypingProps) {
  const [value, setValue] = useState('');
  return <TypingView {...props} value={value} listQuery={value} stale={false} onType={setValue} />;
}

function TransitionTyping(props: TypingProps) {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <TypingView
      {...props}
      value={value}
      listQuery={query}
      stale={isPending}
      onType={(next) => {
        setValue(next);
        startTransition(() => setQuery(next));
      }}
    />
  );
}

function DeferredTyping(props: TypingProps) {
  const [value, setValue] = useState('');
  const deferred = useDeferredValue(value);

  return (
    <TypingView
      {...props}
      value={value}
      listQuery={deferred}
      stale={value !== deferred}
      onType={setValue}
    />
  );
}

const typingByMode: Record<Mode, ComponentType<TypingProps>> = {
  blocking: BlockingTyping,
  transition: TransitionTyping,
  deferred: DeferredTyping,
};

const Stage = memo(function Stage({ mode, perRowMs, memoList }: TypingProps & { mode: Mode }) {
  const Typing = typingByMode[mode];
  return <Typing perRowMs={perRowMs} memoList={memoList} />;
});

function levelOf(ms: number): 'ok' | 'warn' | 'bad' {
  if (ms <= 50) return 'ok';
  if (ms <= 200) return 'warn';
  return 'bad';
}

function JankReadout({ store }: { store: JankStore }) {
  const { samples, last, worst, listLag } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
  );

  return (
    <div className="grid gap-3">
      <Meter
        label="Last keystroke, from key press to next paint"
        value={last}
        max={400}
        unit="ms"
        thresholds={{ warn: 50, bad: 200 }}
      />
      <div className="grid gap-1">
        <div
          role="img"
          aria-label="Latency of the last 24 keystrokes, newest on the right"
          className="flex h-14 items-end gap-px overflow-hidden rounded-lg border border-line bg-surface-2 px-1"
        >
          {samples.map((sample, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                'min-w-0 flex-1 rounded-t-[1px]',
                levelOf(sample) === 'ok' && 'bg-ok',
                levelOf(sample) === 'warn' && 'bg-warn',
                levelOf(sample) === 'bad' && 'bg-bad',
              )}
              style={{ height: `${Math.min(sample / stripScaleMs, 1) * 100}%` }}
            />
          ))}
        </div>
        <p className="flex justify-between font-mono text-[0.72rem] text-faint">
          <span>{`one bar per keystroke, clipped at ${stripScaleMs} ms`}</span>
          <span>{`worst ${worst} ms`}</span>
        </p>
      </div>
      <Meter
        label="List caught up after the last keystroke"
        value={listLag ?? 0}
        max={2000}
        unit="ms"
      />
    </div>
  );
}

export function JankMeterLab() {
  const [store] = useState(createJankStore);
  const [mode, setMode] = useState<Mode>('blocking');
  const [cost, setCost] = useState<Cost>('heavy');
  const [memoList, setMemoList] = useState(true);
  const [typing, setTyping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      stopRef.current?.();
    },
    [],
  );

  const active = modes.find((candidate) => candidate.id === mode) ?? modes[0];
  const perRowMs = costs.find((candidate) => candidate.id === cost)?.perRowMs ?? 0.4;
  if (!active) return null;

  function stopTyping() {
    stopRef.current?.();
    stopRef.current = null;
    setTyping(false);
  }

  function reconfigure(apply: () => void) {
    stopTyping();
    store.reset();
    apply();
  }

  function typeForMe() {
    const input = rootRef.current?.querySelector<HTMLInputElement>('input[type="text"]');
    if (!input || typing) return;
    setTyping(true);
    stopRef.current = typeInto(input, typedText, 70, () => {
      stopRef.current = null;
      setTyping(false);
    });
  }

  return (
    <div ref={rootRef} className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="How the update is scheduled" className="kit-seg">
          {modes.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === mode}
              onClick={() => reconfigure(() => setMode(candidate.id))}
            >
              {candidate.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="List cost" className="kit-seg">
          {costs.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === cost}
              onClick={() => reconfigure(() => setCost(candidate.id))}
            >
              {candidate.label}
            </button>
          ))}
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={memoList}
            onChange={(event) => reconfigure(() => setMemoList(event.target.checked))}
          />
          Wrap the list in memo
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kit-btn"
          aria-disabled={typing ? true : undefined}
          onClick={typeForMe}
        >
          {`Type "${typedText}" for me`}
        </button>
        <button type="button" className="kit-btn" onClick={() => store.reset()}>
          Reset readouts
        </button>
      </div>

      <JankContext value={store}>
        <Stage
          key={`${mode}-${cost}-${memoList}`}
          mode={mode}
          perRowMs={perRowMs}
          memoList={memoList}
        />
      </JankContext>

      <JankReadout store={store} />

      <p
        role="status"
        aria-label="What this mode does"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {active.summary}
      </p>

      <p className="text-[0.78rem] text-faint">
        The list renders 200 rows and each row spends a fixed time rendering. In development
        StrictMode renders every row twice, so the times are about double what production would
        show.
      </p>

      <CodePeek title="This mode in code" code={active.code} />
    </div>
  );
}
