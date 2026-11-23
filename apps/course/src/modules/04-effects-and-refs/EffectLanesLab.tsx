import { memo, useCallback, useEffect, useState } from 'react';
import { CodePeek, Meter, RenderBox } from '../../kit';

type LaneId = 'cleanup' | 'setup';

interface Entry {
  lane: LaneId;
  room: string;
}

interface RoomProps {
  roomId: string;
  unstable: boolean;
  leaky: boolean;
  onEvent: (lane: LaneId, room: string) => void;
}

const rooms = ['general', 'travel', 'music'];
const visibleSteps = 8;
const lanes: { id: LaneId; label: string; kind: string }[] = [
  { id: 'cleanup', label: 'Cleanup', kind: 'cleanup' },
  { id: 'setup', label: 'Setup', kind: 'effect' },
];

const Room = memo(function Room({ roomId, unstable, leaky, onEvent }: RoomProps) {
  const [draft, setDraft] = useState('');
  const dependency = unstable ? { roomId } : roomId;

  useEffect(() => {
    onEvent('setup', roomId);
    if (leaky) return undefined;
    return () => onEvent('cleanup', roomId);
  }, [dependency, roomId, leaky, onEvent]);

  return (
    <RenderBox label={`<Room roomId="${roomId}">`}>
      <div className="grid gap-2.5">
        <p className="text-[0.88rem]">
          Connected to <b className="font-medium">{roomId}</b>
        </p>
        <label className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">Message draft</span>
          <input
            type="text"
            value={draft}
            placeholder="Type a message"
            onChange={(event) => setDraft(event.target.value)}
            className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
          />
        </label>
      </div>
    </RenderBox>
  );
});

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
      <input
        type="checkbox"
        className="kit-check mt-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function LaneTable({ log }: { log: Entry[] }) {
  if (log.length === 0) {
    return <p className="text-[0.84rem] text-muted">Nothing has run yet.</p>;
  }
  const visible = log.slice(-visibleSteps);
  const offset = log.length - visible.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-left font-mono text-[0.72rem]">
        <caption className="sr-only">What the effect ran, in order</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[4.5rem]">
              <span className="sr-only">Lane</span>
            </th>
            {visible.map((_, index) => (
              <th key={offset + index} scope="col" className="font-normal text-muted">
                {`Step ${offset + index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lanes.map((lane) => (
            <tr key={lane.id}>
              <th scope="row" className="font-normal text-muted">
                {lane.label}
              </th>
              {visible.map((entry, index) => (
                <td key={offset + index} className="h-7">
                  {entry.lane === lane.id && (
                    <span
                      data-kind={lane.kind}
                      className="tl-k inline-block rounded border border-(--k) bg-[color-mix(in_oklab,var(--k)_26%,var(--surface))] px-1.5 py-0.5"
                    >
                      {entry.room}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function codeFor(unstable: boolean, leaky: boolean): string {
  const options = unstable ? 'const options = { roomId };\n\n' : '';
  const body = leaky
    ? '  connect(roomId);'
    : '  const connection = connect(roomId);\n  return () => connection.disconnect();';
  return `${options}useEffect(() => {\n${body}\n}, [${unstable ? 'options' : 'roomId'}]);`;
}

function EffectLanes({ onReset }: { onReset: () => void }) {
  const [roomId, setRoomId] = useState('general');
  const [joined, setJoined] = useState(true);
  const [unstable, setUnstable] = useState(false);
  const [leaky, setLeaky] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);
  const [open, setOpen] = useState(0);

  const record = useCallback((lane: LaneId, room: string) => {
    setLog((previous) => [...previous, { lane, room }]);
    setOpen((previous) => previous + (lane === 'setup' ? 1 : -1));
  }, []);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Room" className="kit-seg">
          {rooms.map((room) => (
            <button
              key={room}
              type="button"
              aria-pressed={roomId === room}
              onClick={() => setRoomId(room)}
            >
              {room}
            </button>
          ))}
        </div>
        <button type="button" className="kit-btn" onClick={() => setJoined((value) => !value)}>
          {joined ? 'Leave room' : 'Join room'}
        </button>
        <button type="button" className="kit-btn" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="grid gap-1.5">
        <Toggle
          label="Depend on an object created during render"
          checked={unstable}
          onChange={setUnstable}
        />
        <Toggle label="Forget the cleanup function" checked={leaky} onChange={setLeaky} />
        <p className="text-[0.78rem] text-faint">
          Changing either option remounts the room. In development, StrictMode also runs setup,
          cleanup and setup once on mount.
        </p>
      </div>

      <div className="grid gap-3">
        {joined ? (
          <Room
            key={`${unstable}-${leaky}`}
            roomId={roomId}
            unstable={unstable}
            leaky={leaky}
            onEvent={record}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-line p-3 text-[0.88rem] text-muted">
            You left the room. The component is unmounted.
          </p>
        )}
        <section aria-labelledby="effect-log-heading" className="grid gap-3">
          <h4 id="effect-log-heading">What the effect ran</h4>
          <LaneTable log={log} />
          <Meter
            label="Open connections"
            value={Math.max(open, 0)}
            max={5}
            thresholds={{ warn: 2, bad: 3 }}
          />
        </section>
      </div>

      <CodePeek title="The effect" code={codeFor(unstable, leaky)} />
    </div>
  );
}

export function EffectLanesLab() {
  const [generation, setGeneration] = useState(0);
  return <EffectLanes key={generation} onReset={() => setGeneration((value) => value + 1)} />;
}
