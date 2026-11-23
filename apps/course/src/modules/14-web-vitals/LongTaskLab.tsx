import { useRef, useState } from 'react';
import { CodePeek, Meter, Timeline, type TimelineEvent } from '../../kit';
import { VitalsReadout } from './VitalsReadout';

type Style = 'long' | 'sliced';

interface Slice {
  start: number;
  end: number;
}

interface Run {
  style: Style;
  work: number;
  latency: number;
  frames: number;
  slices: Slice[];
}

const workChoices = [150, 300, 600];
const sliceMs = 30;

const slicedCode =
  'async function runInSlices(totalMs: number) {\n  let done = 0;\n  while (done < totalMs) {\n    await scheduler.yield();\n    doWork(Math.min(30, totalMs - done));\n    done += 30;\n  }\n}';

function burn(ms: number): Slice {
  const start = performance.now();
  while (performance.now() - start < ms) {
    continue;
  }
  return { start, end: performance.now() };
}

function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function nextFrame(stamp: number): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve(performance.now() - stamp));
  });
}

export function LongTaskLab() {
  const [work, setWork] = useState(300);
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [taps, setTaps] = useState(0);
  const [tapWait, setTapWait] = useState<number | null>(null);
  const running = useRef(false);

  async function execute(style: Style, stamp: number) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setRun(null);

    let workEnd = Infinity;
    let frames = 0;
    const countFrame = () => {
      if (performance.now() >= workEnd) return;
      frames += 1;
      requestAnimationFrame(countFrame);
    };
    requestAnimationFrame(countFrame);
    const paint = nextFrame(stamp);

    const slices: Slice[] = [];
    if (style === 'long') {
      slices.push(burn(work));
    } else {
      let done = 0;
      while (done < work) {
        await yieldToMain();
        slices.push(burn(Math.min(sliceMs, work - done)));
        done += sliceMs;
      }
    }
    workEnd = performance.now();

    const latency = await paint;
    setRun({
      style,
      work,
      latency,
      frames,
      slices: slices.map((slice) => ({ start: slice.start - stamp, end: slice.end - stamp })),
    });
    setBusy(false);
    running.current = false;
  }

  const events: TimelineEvent[] = [];
  let span = 100;
  if (run) {
    run.slices.forEach((slice, index) => {
      const length = Math.round(slice.end - slice.start);
      events.push({
        id: `slice-${index}`,
        lane: 'main',
        start: slice.start,
        end: slice.end,
        label: run.style === 'long' ? `one task, ${length} ms` : `${length}`,
        kind: 'task',
      });
    });
    events.push({
      id: 'paint',
      lane: 'screen',
      start: run.latency,
      label: '',
      kind: 'paint',
    });
    const lastEnd = Math.max(run.latency, ...run.slices.map((slice) => slice.end));
    span = Math.ceil((lastEnd + 30) / 50) * 50;
  }
  const longest = run ? Math.max(...run.slices.map((slice) => slice.end - slice.start)) : 0;

  return (
    <div className="grid gap-4">
      <VitalsReadout />

      <div role="group" aria-label="Amount of work" className="flex flex-wrap items-center gap-3">
        <span className="text-[0.88rem] text-muted">Work per click</span>
        <div className="kit-seg">
          {workChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={choice === work}
              onClick={() => setWork(choice)}
            >
              {`${choice} ms`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="kit-btn"
          aria-disabled={busy ? true : undefined}
          onClick={(event) => void execute('long', event.timeStamp)}
        >
          Run as one long task
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={busy ? true : undefined}
          onClick={(event) => void execute('sliced', event.timeStamp)}
        >
          Run in slices and yield
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          className="kit-btn"
          onClick={(event) => {
            setTaps((count) => count + 1);
            setTapWait(Math.round(performance.now() - event.timeStamp));
          }}
        >
          Tap counter
        </button>
        <p className="font-mono text-[0.8rem] text-muted" role="status" aria-label="Tap result">
          {`taps ${taps}`}
          {tapWait !== null && `, last tap waited ${tapWait} ms for its handler`}
        </p>
      </div>

      {busy && (
        <p className="text-[0.88rem] text-muted" role="status">
          Working
        </p>
      )}

      {run ? (
        <div className="grid gap-4">
          <p className="max-w-[68ch] text-[0.88rem] text-muted" role="status" aria-label="Result">
            {run.style === 'long'
              ? `One task held the main thread for ${Math.round(longest)} ms. No frame could be painted until it ended, and ${run.frames} frames were painted while it ran.`
              : `The same ${run.work} ms of work ran as ${run.slices.length} slices of at most ${sliceMs} ms. ${run.frames} frames were painted while it ran, and input could be handled between slices.`}
          </p>
          <Timeline
            lanes={[
              { id: 'main', label: 'Main thread' },
              { id: 'screen', label: 'Screen' },
            ]}
            events={events}
            duration={span}
          />
          <p className="text-[0.78rem] text-faint">Time zero is the click.</p>
          <div className="grid gap-3">
            <Meter
              label="Latency to next paint"
              value={Math.round(run.latency)}
              max={1000}
              unit="ms"
              thresholds={{ warn: 200, bad: 500 }}
            />
            <Meter
              label="Longest single task"
              value={Math.round(longest)}
              max={700}
              unit="ms"
              thresholds={{ warn: 50, bad: 200 }}
            />
          </div>
        </div>
      ) : (
        !busy && (
          <p className="text-[0.88rem] text-muted">
            Run one of the two styles to see the timeline and the latency.
          </p>
        )
      )}

      <CodePeek title="Yielding between slices" code={slicedCode} lang="ts" />
    </div>
  );
}
