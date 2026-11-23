import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Meter } from '../../kit';
import { VitalsReadout } from './VitalsReadout';

interface Page {
  image: boolean;
  banner: boolean;
  details: boolean;
}

interface Shift {
  id: number;
  label: string;
  score: number;
  counted: boolean;
}

interface Box {
  top: number;
  height: number;
}

const emptyPage: Page = { image: false, banner: false, details: false };
const imageDelay = 700;
const bannerDelay = 1500;

function readBoxes(frame: HTMLElement): Map<string, Box> {
  const frameTop = frame.getBoundingClientRect().top;
  const boxes = new Map<string, Box>();
  frame.querySelectorAll<HTMLElement>('[data-shift]').forEach((element) => {
    const rect = element.getBoundingClientRect();
    boxes.set(element.dataset.shift ?? '', { top: rect.top - frameTop, height: rect.height });
  });
  return boxes;
}

function scoreShift(
  before: Map<string, Box>,
  after: Map<string, Box>,
  width: number,
  height: number,
): number {
  const clip = (value: number) => Math.min(Math.max(value, 0), height);
  const spans: [number, number][] = [];
  let farthest = 0;
  after.forEach((now, id) => {
    const was = before.get(id);
    if (!was) return;
    const distance = Math.abs(now.top - was.top);
    if (distance < 0.5) return;
    farthest = Math.max(farthest, distance);
    spans.push([clip(was.top), clip(was.top + was.height)]);
    spans.push([clip(now.top), clip(now.top + now.height)]);
  });
  spans.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let reach = 0;
  for (const [start, end] of spans) {
    const from = Math.max(start, reach);
    if (end > from) covered += end - from;
    reach = Math.max(reach, end);
  }
  return (covered / height) * (farthest / Math.max(width, height));
}

export function LayoutShiftLab() {
  const frameRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [reserve, setReserve] = useState(false);
  const [floatBanner, setFloatBanner] = useState(true);
  const [page, setPage] = useState<Page>(emptyPage);
  const [log, setLog] = useState<Shift[]>([]);
  const [running, setRunning] = useState(false);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  function apply(label: string, excused: boolean, update: (page: Page) => Page) {
    const frame = frameRef.current;
    if (!frame) return;
    const before = readBoxes(frame);
    flushSync(() => setPage(update));
    const after = readBoxes(frame);
    const score = scoreShift(before, after, frame.clientWidth, frame.clientHeight);
    setLog((entries) => [...entries, { id: entries.length + 1, label, score, counted: !excused }]);
  }

  function changeOption(change: () => void) {
    clearTimers();
    change();
    setPage(emptyPage);
    setLog([]);
    setRunning(false);
  }

  function load() {
    clearTimers();
    setPage(emptyPage);
    setLog([]);
    setRunning(true);
    timers.current = [
      window.setTimeout(
        () => apply('Hero image arrived', false, (current) => ({ ...current, image: true })),
        imageDelay,
      ),
      window.setTimeout(
        () => apply('Banner arrived', false, (current) => ({ ...current, banner: true })),
        bannerDelay,
      ),
      window.setTimeout(() => setRunning(false), bannerDelay + 100),
    ];
  }

  function toggleDetails() {
    apply(page.details ? 'Details collapsed after your click' : 'Details expanded after your click', true, (current) => ({
      ...current,
      details: !current.details,
    }));
  }

  const total = log.filter((entry) => entry.counted).reduce((sum, entry) => sum + entry.score, 0);
  const rounded = Math.round(total * 1000) / 1000;

  return (
    <div className="grid gap-4">
      <VitalsReadout />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem]">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={reserve}
            onChange={(event) => changeOption(() => setReserve(event.target.checked))}
          />
          Reserve the image space
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem]">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={floatBanner}
            onChange={(event) => changeOption(() => setFloatBanner(event.target.checked))}
          />
          Float the banner over the content
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="kit-btn" onClick={load}>
          Load the page
        </button>
        <button type="button" className="kit-btn" onClick={toggleDetails}>
          {page.details ? 'Collapse details' : 'Expand details'}
        </button>
        <button
          type="button"
          className="kit-btn"
          onClick={() => changeOption(() => undefined)}
        >
          Reset
        </button>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div
          ref={frameRef}
          role="group"
          aria-label="Phone-sized page"
          className="relative h-[28rem] w-full max-w-[22rem] overflow-hidden rounded-xl border border-line bg-surface"
        >
          <header
            data-shift="header"
            className="flex h-10 items-center border-b border-line px-3 font-display text-[0.85rem] font-semibold"
          >
            Daily Ledger
          </header>
          {page.banner && !floatBanner && (
            <div
              data-shift="banner"
              className="flex h-14 items-center bg-warn/25 px-3 text-[0.8rem] font-medium"
            >
              Subscribe for the weekly digest
            </div>
          )}
          <div
            data-shift="hero"
            style={reserve ? { aspectRatio: '2 / 1' } : undefined}
            className="bg-surface-2"
          >
            {page.image ? (
              <div
                role="img"
                aria-label="Hero image"
                className="aspect-[2/1] w-full bg-linear-to-br from-accent/70 to-track-craft/70"
              />
            ) : (
              reserve && (
                <div className="grid h-full w-full place-items-center text-[0.75rem] text-muted">
                  Image loading
                </div>
              )
            )}
          </div>
          <h4 data-shift="title" className="px-3 pt-3 text-[0.98rem]">
            The week the build got fast
          </h4>
          <p data-shift="p1" className="px-3 pt-1.5 text-[0.8rem] text-muted">
            Bundles shrank, builds dropped under a second and nobody could quite say why it felt
            different.
          </p>
          <p data-shift="p2" className="px-3 pt-1.5 text-[0.8rem] text-muted">
            The answer, it turned out, was mostly what had stopped moving around.
          </p>
          {page.details && (
            <div
              data-shift="details"
              className="mx-3 mt-2 flex h-16 items-center rounded-lg bg-surface-2 px-3 text-[0.8rem]"
            >
              Details: three people, two weeks, one config file.
            </div>
          )}
          <div
            data-shift="related"
            className="mx-3 mt-3 grid gap-1 rounded-lg border border-line p-2 text-[0.8rem]"
          >
            <b className="font-medium">Related</b>
            <span className="text-muted">Why the cache is always the answer</span>
            <span className="text-muted">Ten tabs, one decision</span>
          </div>
          {page.banner && floatBanner && (
            <div className="absolute inset-x-2 bottom-2 rounded-lg bg-warn/30 px-3 py-2 text-[0.8rem] font-medium backdrop-blur-sm">
              Subscribe for the weekly digest
            </div>
          )}
        </div>

        <div className="grid min-w-0 gap-3">
          <Meter
            label="Layout shift score (this phone-sized frame)"
            value={rounded}
            max={0.75}
            thresholds={{ warn: 0.1, bad: 0.25 }}
          />
          <ol aria-label="Layout shifts" className="grid gap-1 font-mono text-[0.78rem]">
            {log.map((entry) => (
              <li key={entry.id} className={entry.counted ? undefined : 'text-faint'}>
                {`${entry.label}: +${entry.score.toFixed(3)}${entry.counted ? '' : ' (excused: your own input)'}`}
              </li>
            ))}
          </ol>
          <p
            role="status"
            aria-label="Result"
            className="min-h-[3.2em] border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
          >
            {running
              ? 'Loading. The image and the banner arrive after the first paint.'
              : log.length === 0
                ? 'Press Load the page. The text paints first, then the image and the banner arrive.'
                : rounded === 0
                  ? 'Nothing that counts moved. The score is 0.'
                  : 'Everything below the late content moved. Compare with the fixes in the options.'}
          </p>
        </div>
      </div>
    </div>
  );
}
