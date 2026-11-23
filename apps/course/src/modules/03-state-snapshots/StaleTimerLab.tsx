import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CodePeek, Timeline, type TimelineEvent, type TimelineLane } from '../../kit';
import { cn } from '../../kit/cn';

interface Report {
  reported: number;
  shown: number;
}

const delayMs = 2000;
const minDuration = 4500;

const lanes: TimelineLane[] = [
  { id: 'handler', label: 'Handler reads' },
  { id: 'screen', label: 'Screen shows' },
  { id: 'timer', label: 'Timer reports' },
];

const code = `function onClick() {
  setCount(count + 1);
  setTimeout(() => report(count), 2000);
}`;

export function StaleTimerLab() {
  const [count, setCount] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const runStart = useRef(0);
  const pending = useRef(0);
  const latest = useRef(0);
  const sequence = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active) clearTimeout(timer);
      active.clear();
    };
  }, []);

  function addAndReport() {
    const now = performance.now();
    const fresh = pending.current === 0;
    if (fresh) runStart.current = now;
    const at = Math.round(now - runStart.current);
    const snapshot = count;
    sequence.current += 1;
    const id = sequence.current;
    latest.current = snapshot + 1;
    pending.current += 1;
    setCount(snapshot + 1);
    setEvents((previous) => [
      ...(fresh ? [] : previous),
      { id: `read-${id}`, lane: 'handler', start: at, label: String(snapshot), kind: 'task' },
      { id: `show-${id}`, lane: 'screen', start: at, label: String(snapshot + 1), kind: 'render' },
    ]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      pending.current -= 1;
      setEvents((previous) => [
        ...previous,
        {
          id: `report-${id}`,
          lane: 'timer',
          start: at + delayMs,
          label: String(snapshot),
          kind: 'effect',
        },
      ]);
      setReport({ reported: snapshot, shown: latest.current });
    }, delayMs);
    timers.current.add(timer);
  }

  function reset() {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    pending.current = 0;
    latest.current = 0;
    setCount(0);
    setEvents([]);
    setReport(null);
  }

  const duration = Math.max(minDuration, ...events.map((event) => event.start + 500));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="kit-btn" onClick={addAndReport}>
          Add 1, report in 2 s
        </button>
        <button type="button" className="kit-btn" onClick={reset}>
          Reset
        </button>
        <p className="font-mono text-[0.86rem]">
          count on screen: <b className="font-medium tabular-nums">{count}</b>
        </p>
      </div>

      <Timeline lanes={lanes} events={events} duration={duration} />

      <p
        role="status"
        aria-label="Latest report"
        className={cn(
          'flex min-h-[3.2em] items-start gap-2 border-l-2 pl-3 text-[0.88rem]',
          report ? 'tone-warn border-warn' : 'border-(--tc,var(--accent)) text-muted',
        )}
      >
        {report ? (
          <>
            <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {`The timer reported ${report.reported} while the screen showed ${report.shown}. It read count from the render that created it.`}
          </>
        ) : (
          'Press the button, then press it again before the two seconds are up.'
        )}
      </p>

      <CodePeek title="The handler" code={code} />
    </div>
  );
}
