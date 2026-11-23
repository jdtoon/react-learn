import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CodePeek, Waterfall, createRng, simulateRequest, type WaterfallRequest } from '../../kit';
import { cn } from '../../kit/cn';

type UserId = 'ada' | 'grace' | 'linus';
type Mode = 'none' | 'ignore' | 'abort';

const users: { id: UserId; name: string; latencyMs: number }[] = [
  { id: 'ada', name: 'Ada', latencyMs: 1400 },
  { id: 'grace', name: 'Grace', latencyMs: 350 },
  { id: 'linus', name: 'Linus', latencyMs: 800 },
];

const modes: { id: Mode; label: string }[] = [
  { id: 'none', label: 'No cleanup' },
  { id: 'ignore', label: 'Ignore flag' },
  { id: 'abort', label: 'AbortController' },
];

const code: Record<Mode, string> = {
  none: 'useEffect(() => {\n  fetchUser(userId).then(setUser);\n}, [userId]);',
  ignore:
    'useEffect(() => {\n  let ignore = false;\n  fetchUser(userId).then((data) => {\n    if (!ignore) setUser(data);\n  });\n  return () => {\n    ignore = true;\n  };\n}, [userId]);',
  abort:
    'useEffect(() => {\n  const controller = new AbortController();\n  fetchUser(userId, { signal: controller.signal })\n    .then(setUser)\n    .catch((error) => {\n      if (error.name !== "AbortError") throw error;\n    });\n  return () => controller.abort();\n}, [userId]);',
};

function nameOf(id: UserId | null): string {
  return users.find((user) => user.id === id)?.name ?? 'nobody';
}

function RaceDemo({ mode }: { mode: Mode }) {
  const [userId, setUserId] = useState<UserId | null>(null);
  const [shown, setShown] = useState<UserId | null>(null);
  const [requests, setRequests] = useState<WaterfallRequest[]>([]);
  const runStart = useRef(0);
  const inFlight = useRef(0);
  const sequence = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) return undefined;

    let ignore = false;
    const controller = new AbortController();
    sequence.current += 1;
    const id = sequence.current;
    const now = performance.now();
    const fresh = inFlight.current === 0;
    if (fresh) runStart.current = now;
    inFlight.current += 1;

    const start = Math.round(now - runStart.current);
    const latencyMs = Math.round(user.latencyMs + (createRng(id * 7919)() - 0.5) * 300);
    const label = `GET /users/${user.id}`;
    const row: WaterfallRequest = {
      id: `request-${id}`,
      label,
      start,
      end: start + latencyMs,
      status: 'pending',
    };
    setRequests((previous) => [...(fresh ? [] : previous), row]);

    function settle(patch: Partial<WaterfallRequest>) {
      inFlight.current -= 1;
      const end = Math.round(performance.now() - runStart.current);
      setRequests((previous) =>
        previous.map((item) => (item.id === row.id ? { ...item, end, ...patch } : item)),
      );
    }

    simulateRequest({
      value: user.id,
      latencyMs,
      signal: mode === 'abort' ? controller.signal : undefined,
    })
      .then((value) => {
        const stale = mode === 'ignore' && ignore;
        settle({ status: 'ok', label: stale ? `${label} (ignored)` : label });
        if (!stale) setShown(value);
      })
      .catch(() => settle({ status: 'error', label: `${label} (aborted)` }));

    if (mode === 'none') return undefined;
    return () => {
      ignore = true;
      if (mode === 'abort') controller.abort();
    };
  }, [userId, mode]);

  function runRace() {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [
      setTimeout(() => setUserId('ada'), 60),
      setTimeout(() => setUserId('grace'), 260),
    ];
    setUserId(null);
    setShown(null);
  }

  const pending = requests.filter((request) => request.status === 'pending').length;
  const mismatch = pending === 0 && shown !== null && userId !== null && shown !== userId;
  const latest = requests.reduce((max, request) => Math.max(max, request.end), 0);
  const total = Math.max(2500, Math.ceil(latest / 500) * 500);

  let message = 'Pick a user, or press Run the race.';
  if (mismatch) {
    message = `The panel shows ${nameOf(shown)} while ${nameOf(userId)} is selected. A slow response arrived last and overwrote the right one.`;
  } else if (pending > 0) {
    message = `Waiting for ${pending} ${pending === 1 ? 'response' : 'responses'}.`;
  } else if (shown !== null) {
    message = `The panel shows ${nameOf(shown)}, which matches the selection.`;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Selected user" className="kit-seg">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              aria-pressed={userId === user.id}
              onClick={() => setUserId(user.id)}
            >
              {user.name}
            </button>
          ))}
        </div>
        <button type="button" className="kit-btn" onClick={runRace}>
          Run the race
        </button>
        <p className="text-[0.78rem] text-faint">
          Ada is slow, Grace is fast, Linus is in between.
        </p>
      </div>

      <div
        className={cn(
          'grid gap-1 rounded-lg border bg-bg p-3',
          mismatch ? 'border-bad' : 'border-line',
        )}
      >
        <p className="text-[0.78rem] text-muted">
          Selected: <b className="font-medium text-fg">{nameOf(userId)}</b>
        </p>
        <p className="text-[0.78rem] text-muted">
          Panel shows:{' '}
          <b className="font-display text-[1.2rem] font-semibold text-fg">
            {shown ? nameOf(shown) : '...'}
          </b>
        </p>
      </div>

      <p
        role="status"
        aria-label="Race result"
        className={cn(
          'flex min-h-[3.2em] items-start gap-2 border-l-2 pl-3 text-[0.88rem]',
          mismatch ? 'tone-bad border-bad' : 'border-(--tc,var(--accent)) text-muted',
        )}
      >
        {mismatch && <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />}
        {message}
      </p>

      <div className="kit-stage">
        {requests.length === 0 ? (
          <p className="text-[0.9rem] text-muted">Each request appears here as a bar.</p>
        ) : (
          <Waterfall requests={requests} total={total} />
        )}
      </div>

      <CodePeek title="The effect" code={code[mode]} />
    </div>
  );
}

export function FetchRaceLab() {
  const [mode, setMode] = useState<Mode>('none');

  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Cleanup strategy" className="kit-seg justify-self-start">
        {modes.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={mode === option.id}
            onClick={() => setMode(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <RaceDemo key={mode} mode={mode} />
    </div>
  );
}
