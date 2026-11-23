import { useState } from 'react';
import { RenderBox } from '../../kit';

type Mode = 'direct' | 'updater';

interface Reads {
  queued: string[];
  outcome: string;
}

const modeLabels: Record<Mode, string> = {
  direct: 'setCount(count + 1)',
  updater: 'setCount(c => c + 1)',
};

function Counter({ mode }: { mode: Mode }) {
  const [count, setCount] = useState(0);
  const [reads, setReads] = useState<Reads | null>(null);

  function addThree() {
    if (mode === 'direct') {
      setCount(count + 1);
      setCount(count + 1);
      setCount(count + 1);
      setReads({
        queued: [1, 2, 3].map(() => `setCount(${count} + 1) queues "set to ${count + 1}"`),
        outcome: `React took the last queued value, so the next render shows ${count + 1}.`,
      });
      return;
    }
    setCount((current) => current + 1);
    setCount((current) => current + 1);
    setCount((current) => current + 1);
    setReads({
      queued: [1, 2, 3].map(() => 'setCount(c => c + 1) queues "add 1"'),
      outcome: `React ran the queue in order, ${count} to ${count + 3}, so the next render shows ${count + 3}.`,
    });
  }

  return (
    <RenderBox label={mode === 'direct' ? '<DirectCounter>' : '<UpdaterCounter>'}>
      <div className="grid gap-2.5">
        <p className="font-mono text-[0.78rem] text-muted">{modeLabels[mode]}</p>
        <p className="font-display text-[2rem] leading-none font-semibold tabular-nums">
          <span className="sr-only">Count </span>
          {count}
        </p>
        <button type="button" className="kit-btn justify-self-start" onClick={addThree}>
          {`Add 3 with ${mode === 'direct' ? 'count + 1' : 'an updater'}`}
        </button>
        {reads ? (
          <div className="grid gap-1.5 text-[0.8rem]">
            <ul aria-label="Queued updates" className="grid gap-1">
              {reads.queued.map((line, index) => (
                <li
                  key={index}
                  className="rounded border border-line bg-surface-2 px-2 py-1 font-mono text-[0.72rem]"
                >
                  {line}
                </li>
              ))}
            </ul>
            <p className="text-muted">{reads.outcome}</p>
          </div>
        ) : (
          <p className="text-[0.8rem] text-faint">Press the button to queue three updates.</p>
        )}
      </div>
    </RenderBox>
  );
}

export function BatchingLab() {
  const [generation, setGeneration] = useState(0);

  return (
    <div className="@container grid gap-4">
      <div className="grid items-start gap-3 @xl:grid-cols-2">
        <Counter key={`direct-${generation}`} mode="direct" />
        <Counter key={`updater-${generation}`} mode="updater" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="kit-btn"
          onClick={() => setGeneration((value) => value + 1)}
        >
          Reset both
        </button>
        <p className="text-[0.8rem] text-muted">
          Each press makes three calls and one render. Watch the render count, not just the number.
        </p>
      </div>
    </div>
  );
}
