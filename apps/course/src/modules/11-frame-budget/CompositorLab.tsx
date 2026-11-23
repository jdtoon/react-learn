import { useEffect, useRef, useState } from 'react';
import { CodePeek } from '../../kit';
import { burn, prefersReducedMotion } from './work';

type Property = 'left' | 'transform';

const blockMs = 600;

const code = `box.animate(
  [{ left: '0px' }, { left: '320px' }],
  { duration: 1600, iterations: Infinity, direction: 'alternate' },
);

box.animate(
  [{ transform: 'translateX(0)' }, { transform: 'translateX(320px)' }],
  { duration: 1600, iterations: Infinity, direction: 'alternate' },
);`;

const details: Record<Property, { title: string; steps: string }> = {
  left: { title: 'Animating left', steps: 'style, layout, paint, composite on the main thread' },
  transform: { title: 'Animating transform', steps: 'composite only, on the compositor thread' },
};

function GlideTrack({ property, running }: { property: Property; running: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const box = boxRef.current;
    if (!track || !box) return;
    const measure = () => setDistance(Math.max(0, track.clientWidth - box.offsetWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || !running || distance === 0) return;
    const keyframes =
      property === 'left'
        ? [{ left: '0px' }, { left: `${distance}px` }]
        : [{ transform: 'translateX(0px)' }, { transform: `translateX(${distance}px)` }];
    const animation = box.animate(keyframes, {
      duration: 1600,
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out',
    });
    return () => animation.cancel();
  }, [property, running, distance]);

  const { title, steps } = details[property];

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-display text-[0.95rem] font-semibold">{title}</p>
        <p className="font-mono text-[0.72rem] text-muted">{steps}</p>
      </div>
      <div
        ref={trackRef}
        aria-hidden="true"
        className="relative h-12 overflow-hidden rounded-lg border border-line bg-surface-2"
      >
        <div
          ref={boxRef}
          className="absolute top-1.5 left-0 size-9 rounded-lg bg-(--tc,var(--accent))"
        />
      </div>
    </div>
  );
}

export function CompositorLab() {
  const [running, setRunning] = useState(() => !prefersReducedMotion());
  const [blocks, setBlocks] = useState(0);

  function block() {
    burn(blockMs);
    setBlocks((count) => count + 1);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="kit-btn" onClick={block}>
          {`Block the main thread for ${blockMs} ms`}
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-pressed={running}
          onClick={() => setRunning((on) => !on)}
        >
          Run the animations
        </button>
      </div>

      <GlideTrack property="left" running={running} />
      <GlideTrack property="transform" running={running} />

      <p
        role="status"
        aria-label="Result"
        className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
      >
        {blocks === 0
          ? 'Both boxes run the same motion. Block the main thread and compare them.'
          : `Blocked ${blocks} time${blocks === 1 ? '' : 's'}, ${blockMs} ms each. The left box stalled and then jumped to catch up. The transform box did not notice.`}
      </p>

      <CodePeek title="The two animations" code={code} lang="ts" />
    </div>
  );
}
