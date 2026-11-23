import { useRef, useState } from 'react';
import { CodePeek } from '../../kit';
import { Tabs } from './Tabs';

type Mode = 'uncontrolled' | 'controlled';

interface LogEntry {
  id: number;
  text: string;
}

const tabItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing' },
  { id: 'security', label: 'Security' },
];

const intro = 'Type a note, tick the unsaved-changes box, then move between tabs.';

const hookCode = [
  'function useControllableState({ value, defaultValue, onChange }) {',
  '  const [inner, setInner] = useState(defaultValue);',
  '  const current = value !== undefined ? value : inner;',
  '',
  '  function set(next) {',
  '    if (Object.is(next, current)) return;',
  '    if (value === undefined) setInner(next);',
  '    onChange?.(next);',
  '  }',
  '',
  '  return [current, set];',
  '}',
].join('\n');

function labelOf(id: string): string {
  return tabItems.find((item) => item.id === id)?.label ?? id;
}

function NotePanel({ label }: { label: string }) {
  return (
    <label className="grid gap-1.5 text-[0.88rem]">
      <span className="text-muted">{`Note for ${label}`}</span>
      <input
        type="text"
        placeholder="Type something"
        className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
      />
    </label>
  );
}

export function OwnershipLab() {
  const [mode, setMode] = useState<Mode>('uncontrolled');
  const [selected, setSelected] = useState('profile');
  const [startTab, setStartTab] = useState('profile');
  const [dirty, setDirty] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [events, setEvents] = useState<LogEntry[]>([{ id: 0, text: intro }]);
  const nextId = useRef(1);
  const controlled = mode === 'controlled';

  function log(text: string) {
    const id = nextId.current;
    nextId.current += 1;
    setEvents((previous) => [{ id, text }, ...previous].slice(0, 4));
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setSelected('profile');
    setStartTab('profile');
    setGeneration((value) => value + 1);
    log(
      `Switched to ${next}. The component was remounted, because moving a live instance between modes is a bug.`,
    );
  }

  function request(next: string, source: string) {
    if (dirty && selected === 'profile' && next !== 'profile') {
      log(`${source} ${labelOf(next)}: the parent refused, because Profile has unsaved changes.`);
      return;
    }
    setSelected(next);
    log(`${source} ${labelOf(next)}: the parent accepted and set the value.`);
  }

  function onUncontrolledChange(next: string) {
    const lostWork = dirty && selected === 'profile';
    setSelected(next);
    log(
      lostWork
        ? `Tab moved to ${labelOf(next)}. The parent was told afterwards and could not stop it, so the unsaved changes were left behind.`
        : `Tab moved to ${labelOf(next)}. The parent was told afterwards.`,
    );
  }

  function jumpToBilling() {
    if (controlled) {
      request('billing', 'Jump to');
      return;
    }
    setStartTab('billing');
    setSelected('billing');
    setGeneration((value) => value + 1);
    log(
      'There is no setter on an uncontrolled tab. The parent remounted it with defaultValue="billing", which discarded every note.',
    );
  }

  const tabsProps = controlled
    ? { value: selected, onValueChange: (next: string) => request(next, 'Click on') }
    : { defaultValue: startTab, onValueChange: onUncontrolledChange };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Who owns the tab" className="kit-seg">
          <button
            type="button"
            aria-pressed={!controlled}
            onClick={() => switchMode('uncontrolled')}
          >
            Uncontrolled
          </button>
          <button type="button" aria-pressed={controlled} onClick={() => switchMode('controlled')}>
            Controlled
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={dirty}
            onChange={(event) => setDirty(event.target.checked)}
          />
          Profile has unsaved changes
        </label>
        <button type="button" className="kit-btn" onClick={jumpToBilling}>
          Jump to Billing
        </button>
      </div>

      <Tabs key={generation} {...tabsProps}>
        <Tabs.List label="Account">
          {tabItems.map((item) => (
            <Tabs.Tab key={item.id} value={item.id}>
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tabItems.map((item) => (
          <Tabs.Panel key={item.id} value={item.id}>
            <NotePanel label={item.label} />
          </Tabs.Panel>
        ))}
      </Tabs>

      <p className="font-mono text-[0.78rem] tabular-nums text-muted">
        {controlled
          ? `Parent state: tab = "${selected}"`
          : `Last value the parent was told: "${selected}"`}
      </p>

      <ol
        role="log"
        aria-label="What the parent saw"
        className="grid gap-1.5 border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.86rem] text-muted"
      >
        {events.map((entry, index) => (
          <li key={entry.id} className={index === 0 ? 'text-fg' : undefined}>
            {entry.text}
          </li>
        ))}
      </ol>

      <CodePeek title="One hook, two modes" code={hookCode} />
    </div>
  );
}
