import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { CodePeek } from '../../kit';

const presets = [
  { label: 'Sidebar', width: 260 },
  { label: 'Main column', width: 420 },
  { label: 'Full width', width: 620 },
];

const cssCode =
  '.card-slot {\n  container-type: inline-size;\n}\n\n@container (min-width: 24rem) {\n  .card {\n    grid-template-columns: 7rem 1fr;\n  }\n}\n\n@container (min-width: 32rem) {\n  .card-meta {\n    display: flex;\n  }\n}';

function subscribeViewport(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function viewportWidth(): number {
  return window.innerWidth;
}

function useWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(Math.round(element.clientWidth)));
    observer.observe(element);
    setWidth(Math.round(element.clientWidth));
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function CardBody({ kind }: { kind: 'container' | 'media' }) {
  const container = kind === 'container';
  return (
    <article
      data-card={kind}
      className={
        container
          ? 'grid gap-3 rounded-xl border border-line bg-surface p-3 @sm:grid-cols-[7rem_minmax(0,1fr)] @lg:grid-cols-[10rem_minmax(0,1fr)]'
          : 'grid gap-3 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)]'
      }
    >
      <div
        aria-hidden="true"
        className={
          container
            ? 'h-20 rounded-lg bg-linear-to-br from-accent/70 to-track-craft/70 @sm:h-full @sm:min-h-24'
            : 'h-20 rounded-lg bg-linear-to-br from-accent/70 to-track-craft/70 sm:h-full sm:min-h-24'
        }
      />
      <div className="grid min-w-0 content-start gap-1.5">
        <h4 className="text-[1rem]">Rendering, end to end</h4>
        <p
          className={
            container
              ? 'hidden text-[0.84rem] text-muted @sm:block'
              : 'hidden text-[0.84rem] text-muted sm:block'
          }
        >
          Trigger, render and commit, then how React decides what to keep.
        </p>
        <ul
          className={
            container
              ? 'hidden gap-3 font-mono text-[0.72rem] text-muted @lg:flex'
              : 'hidden gap-3 font-mono text-[0.72rem] text-muted lg:flex'
          }
        >
          <li>12 min</li>
          <li>3 labs</li>
          <li>Foundations</li>
        </ul>
        <button type="button" className="kit-btn mt-1 justify-self-start">
          Open module
        </button>
      </div>
    </article>
  );
}

function LayoutName({ kind }: { kind: 'container' | 'media' }) {
  const container = kind === 'container';
  return (
    <p className="font-mono text-[0.76rem] text-muted" data-layout={kind}>
      layout chosen by CSS:{' '}
      <b className="font-medium text-fg">
        <span className={container ? '@sm:hidden' : 'sm:hidden'}>stacked</span>
        <span className={container ? 'hidden @sm:inline @lg:hidden' : 'hidden sm:inline lg:hidden'}>
          image left
        </span>
        <span className={container ? 'hidden @lg:inline' : 'hidden lg:inline'}>
          image left with details
        </span>
      </b>
    </p>
  );
}

export function ContainerQueryLab() {
  const [width, setWidth] = useState(420);
  const [slotRef, actual] = useWidth();
  const viewport = useSyncExternalStore(subscribeViewport, viewportWidth, () => 0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">{`Container width: ${width} px`}</span>
          <input
            type="range"
            min={220}
            max={640}
            step={10}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
            className="w-64 max-w-full accent-(--accent)"
          />
        </label>
        <div role="group" aria-label="Container presets" className="kit-seg">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={width === preset.width}
              onClick={() => setWidth(preset.width)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-[0.78rem] text-muted" role="status" aria-label="Measurements">
        {`slot ${actual} px, viewport ${viewport} px`}
      </p>

      <div className="grid gap-5">
        <div className="grid gap-2">
          <p className="eyebrow">Container query</p>
          <div ref={slotRef} className="@container max-w-full" style={{ width }}>
            <div className="grid gap-2">
              <LayoutName kind="container" />
              <CardBody kind="container" />
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <p className="eyebrow">Media query</p>
          <div className="max-w-full" style={{ width }}>
            <div className="grid gap-2">
              <LayoutName kind="media" />
              <CardBody kind="media" />
            </div>
          </div>
        </div>
      </div>

      <CodePeek title="The container query" code={cssCode} lang="css" />
    </div>
  );
}
