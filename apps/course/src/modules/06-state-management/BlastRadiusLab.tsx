import {
  createContext,
  use,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createStore, useStore } from 'zustand';
import { CodePeek, Meter, RenderBox } from '../../kit';

type Mode = 'context' | 'store';
type Field = 'user' | 'theme' | 'cart' | 'notifications';

interface AppState {
  user: string;
  theme: 'light' | 'dark';
  cart: number;
  notifications: number;
}

const initialState: AppState = { user: 'Ada', theme: 'light', cart: 0, notifications: 0 };
const people = ['Ada', 'Grace', 'Linus'];

const consumers: { name: string; field: Field }[] = [
  { name: 'Header', field: 'theme' },
  { name: 'UserMenu', field: 'user' },
  { name: 'CartBadge', field: 'cart' },
  { name: 'Inbox', field: 'notifications' },
];

const actions: { field: Field; label: string }[] = [
  { field: 'user', label: 'Switch user' },
  { field: 'theme', label: 'Toggle theme' },
  { field: 'cart', label: 'Add to cart' },
  { field: 'notifications', label: 'New notification' },
];

function apply(state: AppState, field: Field): AppState {
  switch (field) {
    case 'user': {
      const next = people[(people.indexOf(state.user) + 1) % people.length];
      return { ...state, user: next ?? state.user };
    }
    case 'theme':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'cart':
      return { ...state, cart: state.cart + 1 };
    case 'notifications':
      return { ...state, notifications: state.notifications + 1 };
  }
}

interface RenderedEntry {
  name: string;
  field: Field;
}

interface Summary {
  changed: Field;
  rendered: RenderedEntry[];
  wasted: number;
  wastedTotal: number;
}

function createTally() {
  const listeners = new Set<() => void>();
  let snapshot: Summary | null = null;
  let pending: { changed: Field; rendered: RenderedEntry[] } | null = null;
  let wastedTotal = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function publish() {
    const current = pending;
    if (!current) return;
    const wasted = current.rendered.filter((entry) => entry.field !== current.changed).length;
    wastedTotal += wasted;
    snapshot = { changed: current.changed, rendered: current.rendered, wasted, wastedTotal };
    pending = null;
    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    begin(changed: Field) {
      pending = { changed, rendered: [] };
      clearTimeout(timer);
      timer = setTimeout(publish, 80);
    },
    rendered(name: string, field: Field) {
      if (!pending || pending.rendered.some((entry) => entry.name === name)) return;
      pending.rendered.push({ name, field });
    },
  };
}

type Tally = ReturnType<typeof createTally>;

interface Access {
  useField: <K extends Field>(field: K) => AppState[K];
  act: (field: Field) => void;
}

const AccessContext = createContext<Access | null>(null);
const StateContext = createContext<AppState>(initialState);
const TallyContext = createContext<Tally | null>(null);

function need<T>(value: T | null): T {
  if (value === null) throw new Error('Missing provider');
  return value;
}

function useContextField<K extends Field>(field: K): AppState[K] {
  return use(StateContext)[field];
}

function ContextScenario({ children }: { children: ReactNode }) {
  const tally = need(use(TallyContext));
  const [state, setState] = useState(initialState);
  const access = useMemo<Access>(
    () => ({
      useField: useContextField,
      act: (field) => {
        tally.begin(field);
        setState((current) => apply(current, field));
      },
    }),
    [tally],
  );

  return (
    <AccessContext value={access}>
      <StateContext value={state}>{children}</StateContext>
    </AccessContext>
  );
}

function StoreScenario({ children }: { children: ReactNode }) {
  const tally = need(use(TallyContext));
  const [access] = useState<Access>(() => {
    const store = createStore<AppState>(() => initialState);
    return {
      useField: (field) => useStore(store, (state) => state[field]),
      act: (field) => {
        tally.begin(field);
        store.setState((current) => apply(current, field));
      },
    };
  });

  return <AccessContext value={access}>{children}</AccessContext>;
}

function Consumer({ name, field }: { name: string; field: Field }) {
  const access = need(use(AccessContext));
  const tally = need(use(TallyContext));
  const value = access.useField(field);

  useLayoutEffect(() => {
    tally.rendered(name, field);
  });

  return (
    <RenderBox label={`<${name}>`}>
      <p className="font-mono text-[0.78rem] tabular-nums text-muted">{`${field}: ${value}`}</p>
    </RenderBox>
  );
}

function Controls() {
  const access = need(use(AccessContext));
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.field}
          type="button"
          className="kit-btn"
          onClick={() => access.act(action.field)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Page() {
  return (
    <div className="grid gap-3">
      <Controls />
      <div className="grid gap-2 @xl:grid-cols-2">
        {consumers.map((consumer) => (
          <Consumer key={consumer.name} name={consumer.name} field={consumer.field} />
        ))}
      </div>
    </div>
  );
}

function UpdateSummary() {
  const tally = need(use(TallyContext));
  const summary = useSyncExternalStore(tally.subscribe, tally.getSnapshot);
  const rendered = summary?.rendered ?? [];
  const names = consumers
    .map((consumer) => consumer.name)
    .filter((name) => rendered.some((entry) => entry.name === name));
  const skipped = consumers
    .map((consumer) => consumer.name)
    .filter((name) => !names.includes(name));

  return (
    <div className="grid gap-3">
      <div
        role="status"
        aria-label="Last update"
        className="grid min-h-[3.4em] gap-1 border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem]"
      >
        {summary ? (
          <>
            <p className="text-muted">
              {`Changed ${summary.changed}. ${names.length} of ${consumers.length} components rendered, and ${summary.wasted} of them do not read ${summary.changed}.`}
            </p>
            <p className="font-mono text-[0.76rem] text-muted">
              {`rendered: ${names.join(', ') || 'none'}`}
              <br />
              {`skipped: ${skipped.join(', ') || 'none'}`}
            </p>
          </>
        ) : (
          <p className="text-muted">Press a button to change one field.</p>
        )}
      </div>
      <Meter
        label="Wasted renders since reset"
        value={summary?.wastedTotal ?? 0}
        max={Math.max(20, summary?.wastedTotal ?? 0)}
        thresholds={{ warn: 4, bad: 10 }}
      />
    </div>
  );
}

function Scenario({ mode }: { mode: Mode }) {
  const [tally] = useState(createTally);
  const page = <Page />;
  const Provider = mode === 'context' ? ContextScenario : StoreScenario;

  return (
    <TallyContext value={tally}>
      <div className="grid gap-4">
        <Provider>{page}</Provider>
        <UpdateSummary />
      </div>
    </TallyContext>
  );
}

const contextCode = 'const { cart } = use(AppContext);';
const storeCode = 'const cart = useStore((state) => state.cart);';

export function BlastRadiusLab() {
  const [mode, setMode] = useState<Mode>('context');
  const [generation, setGeneration] = useState(0);
  const isContext = mode === 'context';

  return (
    <div className="@container grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="How state is shared" className="kit-seg">
          <button type="button" aria-pressed={isContext} onClick={() => setMode('context')}>
            One context
          </button>
          <button type="button" aria-pressed={!isContext} onClick={() => setMode('store')}>
            Selector store
          </button>
        </div>
        <button type="button" className="kit-btn" onClick={() => setGeneration(generation + 1)}>
          Reset counts
        </button>
      </div>
      <Scenario key={`${mode}-${generation}`} mode={mode} />
      <CodePeek
        title="How CartBadge reads its field"
        code={isContext ? contextCode : storeCode}
        defaultOpen
      />
    </div>
  );
}
