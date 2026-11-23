import { memo, useEffect, useRef, useState, type ReactElement } from 'react';
import { CodePeek, Meter } from '../../kit';
import { afterPaint } from './work';

const sizes = [1_000, 10_000, 50_000];
const rowHeight = 32;
const viewportHeight = 320;
const overscan = 4;
const nodesPerRow = 3;
const statuses = ['Paid', 'Pending', 'Shipped', 'Refunded'];
const format = new Intl.NumberFormat('en-GB');

const code = `const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
const last = Math.min(count - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);

<ul style={{ height: count * rowHeight, position: 'relative' }}>
  {range(first, last).map((index) => (
    <Row
      key={index}
      style={{ position: 'absolute', transform: \`translateY(\${index * rowHeight}px)\` }}
    />
  ))}
</ul>`;

interface RowListProps {
  size: number;
  first: number;
  last: number;
  windowed: boolean;
}

function Row({ index, size, windowed }: { index: number; size: number; windowed: boolean }) {
  return (
    <li
      aria-setsize={size}
      aria-posinset={index + 1}
      className={
        windowed
          ? 'absolute inset-x-0 top-0 flex h-8 items-center gap-3 border-b border-line px-3 text-[0.84rem]'
          : 'flex h-8 items-center gap-3 border-b border-line px-3 text-[0.84rem]'
      }
      style={windowed ? { transform: `translateY(${index * rowHeight}px)` } : undefined}
    >
      <span className="w-20 shrink-0 font-mono text-muted tabular-nums">{`#${format.format(index + 1)}`}</span>
      <span className="truncate">{`Order ${format.format(index + 1)}, ${statuses[index % statuses.length]}`}</span>
    </li>
  );
}

const RowList = memo(function RowList({ size, first, last, windowed }: RowListProps) {
  const rows: ReactElement[] = [];
  for (let index = first; index <= last; index += 1) {
    rows.push(<Row key={index} index={index} size={size} windowed={windowed} />);
  }
  return (
    <ul
      className="relative m-0 list-none p-0"
      style={windowed ? { height: size * rowHeight } : undefined}
    >
      {rows}
    </ul>
  );
});

export function WindowedListLab() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const countPending = useRef(false);
  const [size, setSize] = useState(10_000);
  const [windowed, setWindowed] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [nodes, setNodes] = useState(0);
  const [updateMs, setUpdateMs] = useState(0);

  const first = windowed ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan) : 0;
  const last = windowed
    ? Math.min(size - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan)
    : size - 1;

  function countNodes(): number {
    return viewportRef.current?.getElementsByTagName('*').length ?? 0;
  }

  useEffect(() => {
    afterPaint(() => setNodes(viewportRef.current?.getElementsByTagName('*').length ?? 0));
  }, []);

  function change(apply: () => void) {
    const startedAt = performance.now();
    apply();
    setScrollTop(0);
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    afterPaint(() => {
      setUpdateMs(Math.round(performance.now() - startedAt));
      setNodes(countNodes());
    });
  }

  function onScroll(top: number) {
    if (!windowed) return;
    setScrollTop(top);
    if (countPending.current) return;
    countPending.current = true;
    afterPaint(() => {
      countPending.current = false;
      setNodes(countNodes());
    });
  }

  function jumpToMiddle() {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = (size / 2) * rowHeight;
  }

  const fullNodes = size * nodesPerRow;
  const risky = !windowed && size >= 50_000;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Number of rows" className="kit-seg">
          {sizes.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={candidate === size}
              onClick={() => change(() => setSize(candidate))}
            >
              {`${format.format(candidate)} rows`}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Rendering" className="kit-seg">
          <button
            type="button"
            aria-pressed={windowed}
            onClick={() => change(() => setWindowed(true))}
          >
            Windowing on
          </button>
          <button
            type="button"
            aria-pressed={!windowed}
            onClick={() => change(() => setWindowed(false))}
          >
            Windowing off
          </button>
        </div>
        <button type="button" className="kit-btn" onClick={jumpToMiddle}>
          Jump to the middle
        </button>
      </div>

      {risky && (
        <p className="tone-warn text-[0.84rem]">
          Rendering 50,000 rows without windowing can freeze this tab for several seconds.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Meter
          label="DOM nodes in the list"
          value={nodes}
          max={fullNodes}
          thresholds={{ warn: 800, bad: 1400 }}
        />
        <Meter
          label="Last change, click to next paint"
          value={updateMs}
          max={3000}
          unit="ms"
          thresholds={{ warn: 100, bad: 500 }}
        />
      </div>

      <p className="font-mono text-[0.78rem] text-muted tabular-nums">
        {`${format.format(last - first + 1)} of ${format.format(size)} rows rendered, ${nodesPerRow} nodes each`}
      </p>

      <div
        ref={viewportRef}
        role="region"
        aria-label="Orders"
        tabIndex={0}
        onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
        className="overflow-auto rounded-lg border border-line bg-surface"
        style={{ height: viewportHeight }}
      >
        <RowList size={size} first={first} last={last} windowed={windowed} />
      </div>

      <CodePeek title="Windowing in a few lines" code={code} />
    </div>
  );
}
