import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CodePeek, Meter } from '../../kit';
import { cn } from '../../kit/cn';
import { createFrameStore, frameBudgetMs, type FrameStore } from './frameStore';
import { burn, prefersReducedMotion, yieldToMain } from './work';

const scaleMs = 100;
const sliceMs = 8;
const totalSlicedMs = 200;

const slicedCode = `const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

async function processInSlices(items) {
  let sliceStart = performance.now();
  for (const item of items) {
    process(item);
    if (performance.now() - sliceStart > 8) {
      await yieldToMain();
      sliceStart = performance.now();
    }
  }
}`;

function levelOf(delta: number): 'ok' | 'warn' | 'bad' {
  if (delta <= 20) return 'ok';
  if (delta <= 50) return 'warn';
  return 'bad';
}

function Mover({ running }: { running: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const ball = ballRef.current;
    if (!track || !ball) return;
    if (!running) {
      ball.style.transform = 'translateX(0px)';
      return;
    }
    let handle = 0;
    const tick = (now: number) => {
      const distance = track.clientWidth - ball.offsetWidth;
      const phase = (now % 2400) / 2400;
      const t = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      ball.style.transform = `translateX(${t * distance}px)`;
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [running]);

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      className="relative h-10 overflow-hidden rounded-lg border border-line bg-surface-2"
    >
      <div
        ref={ballRef}
        className="absolute top-1 left-0 size-8 rounded-full bg-(--tc,var(--accent))"
      />
    </div>
  );
}

function FrameStrip({ store }: { store: FrameStore }) {
  const { deltas } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const budgetLine = (frameBudgetMs / scaleMs) * 100;

  return (
    <div className="grid gap-1.5">
      <div
        role="img"
        aria-label="Frame times for the last 90 frames, newest on the right. The line marks the 16.7 millisecond budget."
        className="relative flex h-28 items-end gap-px overflow-hidden rounded-lg border border-line bg-surface-2 px-1"
      >
        {deltas.map((delta, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              'min-w-0 flex-1 rounded-t-[1px]',
              levelOf(delta) === 'ok' && 'bg-ok',
              levelOf(delta) === 'warn' && 'bg-warn',
              levelOf(delta) === 'bad' && 'bg-bad',
            )}
            style={{ height: `${Math.min(delta / scaleMs, 1) * 100}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-fg/60"
          style={{ bottom: `${budgetLine}%` }}
        />
      </div>
      <p className="flex justify-between font-mono text-[0.72rem] text-faint">
        <span>{`bars clip at ${scaleMs} ms`}</span>
        <span>{`dashed line: ${frameBudgetMs} ms budget (60 Hz)`}</span>
      </p>
    </div>
  );
}

function FrameReadouts({ store }: { store: FrameStore }) {
  const { longest, missed, frames } = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-end">
      <Meter
        label="Longest frame since reset"
        value={Math.round(longest)}
        max={250}
        unit="ms"
        thresholds={{ warn: 20, bad: 50 }}
      />
      <p className="font-mono text-[0.86rem] tabular-nums">
        <b className="font-display text-[1.6rem] leading-none font-semibold">{missed}</b>
        <span className="ml-2 text-muted">{`frames missed of ${frames}`}</span>
      </p>
    </div>
  );
}

export function FrameBudgetLab() {
  const [store] = useState(createFrameStore);
  const [moving, setMoving] = useState(() => !prefersReducedMotion());
  const [slicing, setSlicing] = useState(false);
  const [status, setStatus] = useState(
    'Press a button to put work on the main thread, and watch the box and the bars.',
  );

  useEffect(() => store.start(), [store]);

  function runBlocking(ms: number) {
    burn(ms);
    const frames = Math.round(ms / frameBudgetMs);
    setStatus(
      frames < 1
        ? `Ran ${ms} ms in one task. That fits inside a frame, so nothing was missed.`
        : `Ran ${ms} ms in one task. Nothing could paint or respond for that long, about ${frames} frame${frames === 1 ? '' : 's'}.`,
    );
  }

  async function runSliced() {
    if (slicing) return;
    setSlicing(true);
    setStatus(`Running ${totalSlicedMs} ms of work in ${sliceMs} ms slices…`);
    const startedAt = performance.now();
    let done = 0;
    let slices = 0;
    let longestSlice = 0;
    while (done < totalSlicedMs) {
      const sliceStart = performance.now();
      burn(Math.min(sliceMs, totalSlicedMs - done));
      longestSlice = Math.max(longestSlice, performance.now() - sliceStart);
      done += sliceMs;
      slices += 1;
      await yieldToMain();
    }
    const wall = Math.round(performance.now() - startedAt);
    setSlicing(false);
    setStatus(
      `Ran ${totalSlicedMs} ms of work in ${slices} slices, longest ${Math.round(longestSlice)} ms. It finished ${wall} ms after the press, and the page stayed responsive throughout.`,
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="kit-btn" onClick={() => runBlocking(8)}>
          Run 8 ms task
        </button>
        <button type="button" className="kit-btn" onClick={() => runBlocking(50)}>
          Run 50 ms task
        </button>
        <button type="button" className="kit-btn" onClick={() => runBlocking(200)}>
          Run 200 ms task
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={slicing ? true : undefined}
          onClick={() => void runSliced()}
        >
          Run 200 ms in 8 ms slices
        </button>
      </div>

      <Mover running={moving} />

      <FrameStrip store={store} />
      <FrameReadouts store={store} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="kit-btn" onClick={() => store.reset()}>
          Reset readouts
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-pressed={moving}
          onClick={() => setMoving((on) => !on)}
        >
          Move the box
        </button>
        <span className="text-[0.8rem] text-faint">
          The box is moved by JavaScript on every frame, so it shares the main thread.
        </span>
      </div>

      <p
        role="status"
        aria-label="What the main thread did"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {status}
      </p>

      <CodePeek title="Slicing work and yielding" code={slicedCode} lang="ts" />
    </div>
  );
}
