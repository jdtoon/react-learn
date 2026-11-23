import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';
import { CodePeek, Meter, RenderBox } from '../../kit';
import { createLatencyStore, type LatencyStore } from './latencyStore';
import { afterPaint, burn, typeInto } from './work';

type Strategy = 'naive' | 'inline' | 'stable' | 'down' | 'up';

const chartCostMs = 20;
const typedText = 'quarterly revenue';

const LatencyContext = createContext<LatencyStore>(createLatencyStore());

interface ChartProps {
  options: { title: string };
  onSelect: () => void;
  memoized?: boolean;
}

function Chart({ options, onSelect, memoized }: ChartProps) {
  burn(chartCostMs);
  return (
    <RenderBox label="<Chart>" memoized={memoized}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="kit-btn" onClick={onSelect}>
          Select a bar
        </button>
        <span className="font-mono text-[0.78rem] text-muted">
          {`${options.title}, ${chartCostMs} ms of work per render`}
        </span>
      </div>
    </RenderBox>
  );
}

const MemoChart = memo(function MemoChart(props: ChartProps) {
  return <Chart {...props} memoized />;
});

function SearchInput({ value, onValue }: { value: string; onValue: (next: string) => void }) {
  const latency = useContext(LatencyContext);

  return (
    <label className="grid gap-1.5 text-[0.88rem]">
      <span className="text-muted">Search</span>
      <input
        type="text"
        value={value}
        placeholder="Type to search"
        onChange={(event) => {
          const startedAt = event.nativeEvent.timeStamp;
          afterPaint(() => latency.record(performance.now() - startedAt));
          onValue(event.target.value);
        }}
        className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
      />
    </label>
  );
}

function Selected({ count }: { count: number }) {
  return <p className="font-mono text-[0.78rem] text-muted tabular-nums">{`selected ${count}`}</p>;
}

function NaiveDashboard() {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(0);

  return (
    <RenderBox label="<Dashboard>">
      <SearchInput value={text} onValue={setText} />
      <Chart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
      <Selected count={selected} />
    </RenderBox>
  );
}

function InlineDashboard() {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(0);

  return (
    <RenderBox label="<Dashboard>">
      <SearchInput value={text} onValue={setText} />
      <MemoChart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
      <Selected count={selected} />
    </RenderBox>
  );
}

function StableDashboard() {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(0);
  const options = useMemo(() => ({ title: 'Revenue' }), []);
  const onSelect = useCallback(() => setSelected((n) => n + 1), []);

  return (
    <RenderBox label="<Dashboard>">
      <SearchInput value={text} onValue={setText} />
      <MemoChart options={options} onSelect={onSelect} />
      <Selected count={selected} />
    </RenderBox>
  );
}

function SearchBox() {
  const [text, setText] = useState('');

  return (
    <RenderBox label="<SearchBox>">
      <SearchInput value={text} onValue={setText} />
    </RenderBox>
  );
}

function MoveDownDashboard() {
  const [selected, setSelected] = useState(0);

  return (
    <RenderBox label="<Dashboard>">
      <SearchBox />
      <Chart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
      <Selected count={selected} />
    </RenderBox>
  );
}

function Typing({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');

  return (
    <RenderBox label="<Typing>">
      <SearchInput value={text} onValue={setText} />
      {children}
    </RenderBox>
  );
}

function LiftUpDashboard() {
  const [selected, setSelected] = useState(0);

  return (
    <RenderBox label="<Dashboard>">
      <Typing>
        <Chart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
      </Typing>
      <Selected count={selected} />
    </RenderBox>
  );
}

const strategies: {
  id: Strategy;
  label: string;
  Variant: ComponentType;
  summary: string;
  code: string;
}[] = [
  {
    id: 'naive',
    label: 'No memoisation',
    Variant: NaiveDashboard,
    summary:
      'The text state lives in Dashboard and Chart is a plain component, so every keystroke re-renders Chart and pays its full cost.',
    code: `function Dashboard() {
  const [text, setText] = useState('');
  return (
    <>
      <SearchInput value={text} onValue={setText} />
      <Chart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
    </>
  );
}`,
  },
  {
    id: 'inline',
    label: 'memo, inline props',
    Variant: InlineDashboard,
    summary:
      'Chart is wrapped in memo, but options and onSelect are new objects on every Dashboard render. The shallow comparison fails each time, so memo never skips.',
    code: `const MemoChart = memo(Chart);

function Dashboard() {
  const [text, setText] = useState('');
  return (
    <>
      <SearchInput value={text} onValue={setText} />
      <MemoChart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
    </>
  );
}`,
  },
  {
    id: 'stable',
    label: 'memo, stable props',
    Variant: StableDashboard,
    summary:
      'useMemo and useCallback keep both props referentially equal between renders, so memo skips Chart while you type.',
    code: `const MemoChart = memo(Chart);

function Dashboard() {
  const [text, setText] = useState('');
  const options = useMemo(() => ({ title: 'Revenue' }), []);
  const onSelect = useCallback(() => setSelected((n) => n + 1), []);
  return (
    <>
      <SearchInput value={text} onValue={setText} />
      <MemoChart options={options} onSelect={onSelect} />
    </>
  );
}`,
  },
  {
    id: 'down',
    label: 'Move state down',
    Variant: MoveDownDashboard,
    summary:
      'The text state moved into SearchBox. Typing renders only SearchBox, and Dashboard and Chart are not involved. No memo and no hooks.',
    code: `function SearchBox() {
  const [text, setText] = useState('');
  return <SearchInput value={text} onValue={setText} />;
}

function Dashboard() {
  return (
    <>
      <SearchBox />
      <Chart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
    </>
  );
}`,
  },
  {
    id: 'up',
    label: 'Lift content up',
    Variant: LiftUpDashboard,
    summary:
      'Typing owns the state and receives Chart as children. That element was created by Dashboard, which did not render, so React reuses it and skips Chart.',
    code: `function Typing({ children }) {
  const [text, setText] = useState('');
  return (
    <>
      <SearchInput value={text} onValue={setText} />
      {children}
    </>
  );
}

function Dashboard() {
  return (
    <Typing>
      <Chart options={{ title: 'Revenue' }} onSelect={() => setSelected((n) => n + 1)} />
    </Typing>
  );
}`,
  },
];

const Stage = memo(function Stage({ Variant }: { Variant: ComponentType }) {
  return <Variant />;
});

function LatencyReadout({ store }: { store: LatencyStore }) {
  const { last, worst, average, count } = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <div className="grid gap-2">
      <Meter
        label="Last keystroke, from key press to next paint"
        value={last}
        max={120}
        unit="ms"
        thresholds={{ warn: 25, bad: 50 }}
      />
      <p className="font-mono text-[0.78rem] text-muted tabular-nums">
        {count === 0
          ? 'No keystrokes yet'
          : `average ${average} ms, worst ${worst} ms, ${count} keystroke${count === 1 ? '' : 's'}`}
      </p>
    </div>
  );
}

export function SlowTreeLab() {
  const [latency] = useState(createLatencyStore);
  const [strategyId, setStrategyId] = useState<Strategy>('naive');
  const [typing, setTyping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      stopRef.current?.();
    },
    [],
  );

  const strategy = strategies.find((candidate) => candidate.id === strategyId) ?? strategies[0];
  if (!strategy) return null;

  function stopTyping() {
    stopRef.current?.();
    stopRef.current = null;
    setTyping(false);
  }

  function choose(next: Strategy) {
    if (next === strategyId) return;
    stopTyping();
    latency.reset();
    setStrategyId(next);
  }

  function typeForMe() {
    const input = rootRef.current?.querySelector<HTMLInputElement>('input[type="text"]');
    if (!input || typing) return;
    setTyping(true);
    stopRef.current = typeInto(input, typedText, 80, () => {
      stopRef.current = null;
      setTyping(false);
    });
  }

  return (
    <div ref={rootRef} className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="group" aria-label="Strategy" className="kit-seg">
          {strategies.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === strategyId}
              onClick={() => choose(candidate.id)}
            >
              {candidate.label}
            </button>
          ))}
        </div>
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
        <button type="button" className="kit-btn" onClick={() => latency.reset()}>
          Reset readout
        </button>
      </div>

      <LatencyContext value={latency}>
        <Stage Variant={strategy.Variant} />
      </LatencyContext>

      <LatencyReadout store={latency} />

      <p
        role="status"
        aria-label="What this strategy does"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {strategy.summary}
      </p>

      <p className="text-[0.78rem] text-faint">
        Times come from your device in development, where StrictMode renders every component twice
        and the counters start at 2. Switching strategy remounts the tree and restarts them.
      </p>

      <CodePeek title="This strategy in code" code={strategy.code} />
    </div>
  );
}
