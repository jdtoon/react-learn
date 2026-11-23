import { Bell } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import { cn } from '../../kit/cn';
import { place, type PlacedNode } from './xray';

type Version = 'written' | 'fixed';
type Status = 'ok' | 'warn' | 'bad';

const noop = () => undefined;

function statusOf(node: PlacedNode): Status {
  if (node.mouseOnly) return 'warn';
  if (node.kind === 'control' && node.source === 'none') return 'bad';
  if (node.source === 'placeholder' || node.source === 'title') return 'warn';
  return 'ok';
}

function describe(node: PlacedNode): string {
  const quoted = node.name ? `"${node.name}"` : '';
  if (node.mouseOnly) return `no tab stop, mouse only: ${quoted}`;
  const lead = node.tab === null ? '' : `#${node.tab} `;
  if (node.kind === 'landmark') return node.role;
  if (node.kind === 'heading') return `${node.role} ${quoted}`;
  if (node.source === 'none') return `${lead}${node.role}, no name`;
  const fragile = node.source === 'placeholder' ? ' (placeholder only)' : '';
  return `${lead}${node.role} ${quoted}${fragile}`;
}

const chipTone: Record<Status, string> = {
  ok: 'border-accent bg-accent/15',
  warn: 'border-warn bg-warn/25',
  bad: 'border-bad bg-bad/25',
};

const outlineTone: Record<Status, string> = {
  ok: 'border-accent',
  warn: 'border-warn',
  bad: 'border-bad',
};

function AsWritten() {
  return (
    <>
      <div
        data-mouse-only
        onClick={noop}
        className="cursor-pointer font-display text-[1rem] font-semibold"
      >
        Daily Ledger
      </div>
      <a href="#news" onClick={(event) => event.preventDefault()} className="text-[0.9rem] underline">
        News
      </a>
      <input
        type="text"
        placeholder="Search"
        className="h-9 w-full rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
      />
      <button type="button" className="kit-btn w-9 px-0">
        <Bell aria-hidden="true" size={16} />
      </button>
      <div className="font-display text-[1.1rem] font-semibold">Subscribe to the digest</div>
      <div data-mouse-only onClick={noop} className="kit-btn cursor-pointer">
        Subscribe
      </div>
      <button type="button" tabIndex={3} className="kit-btn">
        Maybe later
      </button>
    </>
  );
}

function Fixed() {
  const searchId = useId();
  return (
    <>
      <header className="contents">
        <a
          href="#home"
          onClick={(event) => event.preventDefault()}
          className="font-display text-[1rem] font-semibold"
        >
          Daily Ledger
        </a>
      </header>
      <nav aria-label="Main" className="contents">
        <a href="#news" onClick={(event) => event.preventDefault()} className="text-[0.9rem] underline">
          News
        </a>
      </nav>
      <label htmlFor={searchId} className="sr-only">
        Search
      </label>
      <input
        id={searchId}
        type="search"
        placeholder="Search"
        className="h-9 w-full rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
      />
      <button type="button" aria-label="Notifications" className="kit-btn w-9 px-0">
        <Bell aria-hidden="true" size={16} />
      </button>
      <main className="contents">
        <h2 className="font-display text-[1.1rem] font-semibold">Subscribe to the digest</h2>
        <button type="button" className="kit-btn">
          Subscribe
        </button>
        <button type="button" className="kit-btn">
          Maybe later
        </button>
      </main>
    </>
  );
}

export function XrayLab() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [version, setVersion] = useState<Version>('written');
  const [xray, setXray] = useState(false);
  const [nodes, setNodes] = useState<PlacedNode[]>([]);
  const [focused, setFocused] = useState<EventTarget | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setNodes(place(root));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [version]);

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) setFocused(null);
  }

  const overlay = nodes.filter((node) => node.kind !== 'landmark');
  const stops = nodes.filter((node) => node.tab !== null).length;
  const unnamed = nodes.filter((node) => node.kind === 'control' && node.source === 'none').length;
  const mouseOnly = nodes.filter((node) => node.mouseOnly).length;
  const landmarks = nodes.filter((node) => node.kind === 'landmark').length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Version" className="kit-seg">
          <button
            type="button"
            aria-pressed={version === 'written'}
            onClick={() => setVersion('written')}
          >
            As written
          </button>
          <button type="button" aria-pressed={version === 'fixed'} onClick={() => setVersion('fixed')}>
            Fixed
          </button>
        </div>
        <button
          type="button"
          className="kit-btn"
          aria-pressed={xray}
          onClick={() => setXray((on) => !on)}
        >
          X-ray
        </button>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div
          ref={rootRef}
          onFocus={(event) => setFocused(event.target)}
          onBlur={onBlur}
          className="relative grid max-w-sm justify-items-start gap-7 rounded-xl border border-line bg-surface p-4 pt-8"
        >
          {version === 'written' ? <AsWritten /> : <Fixed />}
          {xray && (
            <div aria-hidden="true" data-xray-layer className="pointer-events-none absolute inset-0">
              {overlay.map((node, index) => {
                const status = statusOf(node);
                const active = node.el === focused;
                return (
                  <div key={index}>
                    <div
                      className={cn(
                        'absolute rounded border-2',
                        outlineTone[status],
                        node.mouseOnly && 'border-dashed',
                      )}
                      style={{
                        left: node.left - 2,
                        top: node.top - 2,
                        width: node.width + 4,
                        height: node.height + 4,
                      }}
                    />
                    <span
                      data-chip={node.tab ?? 'none'}
                      className={cn(
                        'absolute max-w-full truncate rounded border px-1.5 font-mono text-[0.64rem] leading-4 text-fg',
                        chipTone[status],
                        active && 'ring-2 ring-fg',
                      )}
                      style={{ left: node.left - 2, top: node.top - 22 }}
                    >
                      {describe(node)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid min-w-0 content-start gap-3">
          <p className="eyebrow">Accessibility tree</p>
          <ul aria-label="Accessibility tree" className="grid gap-1 font-mono text-[0.76rem]">
            {nodes.map((node, index) => {
              const status = statusOf(node);
              return (
                <li
                  key={index}
                  className={cn(
                    status === 'bad' && 'tone-bad',
                    status === 'warn' && 'tone-warn',
                    node.kind === 'landmark' && 'text-muted',
                  )}
                >
                  {describe(node)}
                </li>
              );
            })}
          </ul>
          <p
            role="status"
            aria-label="Summary"
            className="border-l-2 border-(--tc,var(--accent)) pl-3 text-[0.88rem] text-muted"
          >
            {`${stops} tab stops, ${unnamed} without a name, ${mouseOnly} mouse only, ${landmarks} landmarks.`}
          </p>
        </div>
      </div>
    </div>
  );
}
