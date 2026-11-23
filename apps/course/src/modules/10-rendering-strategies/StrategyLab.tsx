import { useState } from 'react';
import { Meter, Stepper, Timeline, type TimelineEvent, type TimelineLane } from '../../kit';
import { cn } from '../../kit/cn';

type StrategyId = 'csr' | 'ssr' | 'ssg' | 'streaming' | 'rsc';
type Screen = 'blank' | 'skeleton' | 'partial' | 'content';

interface Phase {
  at: number;
  title: string;
  description: string;
  screen: Screen;
  interactive: boolean;
}

interface Strategy {
  id: StrategyId;
  label: string;
  summary: string;
  events: TimelineEvent[];
  phases: Phase[];
  contentMs: number;
  interactiveMs: number;
  jsKb: number;
}

const duration = 1300;

const lanes: TimelineLane[] = [
  { id: 'server', label: 'Server or CDN' },
  { id: 'network', label: 'Network' },
  { id: 'browser', label: 'Browser' },
];

const strategies: Strategy[] = [
  {
    id: 'csr',
    label: 'CSR',
    summary:
      'The server returns an empty shell. The browser downloads the script, runs it, and only then asks for data.',
    events: [
      { id: 'serve', lane: 'server', start: 10, end: 50, label: 'serve empty shell', kind: 'task' },
      { id: 'html', lane: 'network', start: 50, end: 120, label: 'HTML shell', kind: 'network' },
      { id: 'js', lane: 'network', start: 120, end: 560, label: 'app.js 280 KB', kind: 'network' },
      {
        id: 'data',
        lane: 'network',
        start: 640,
        end: 1040,
        label: 'GET /api/product',
        kind: 'network',
      },
      { id: 'run', lane: 'browser', start: 560, end: 620, label: 'run script', kind: 'task' },
      {
        id: 'skeleton',
        lane: 'browser',
        start: 620,
        end: 660,
        label: 'render skeleton',
        kind: 'render',
      },
      { id: 'paint1', lane: 'browser', start: 660, end: 680, label: 'paint', kind: 'paint' },
      {
        id: 'render',
        lane: 'browser',
        start: 1040,
        end: 1080,
        label: 'render content',
        kind: 'render',
      },
      { id: 'paint2', lane: 'browser', start: 1080, end: 1100, label: 'paint', kind: 'paint' },
    ],
    phases: [
      {
        at: 120,
        title: 'An empty shell arrives',
        description:
          'The HTML holds a root div and a script tag. Nothing is rendered yet, so the screen is blank.',
        screen: 'blank',
        interactive: false,
      },
      {
        at: 560,
        title: 'The script has downloaded',
        description:
          'All 280 KB must arrive before React can start. The user has seen nothing for over half a second.',
        screen: 'blank',
        interactive: false,
      },
      {
        at: 680,
        title: 'A skeleton paints',
        description:
          'React renders in the browser and paints the loading state. Only now does the app request its data.',
        screen: 'skeleton',
        interactive: false,
      },
      {
        at: 1100,
        title: 'Content appears and works',
        description:
          'The data arrives, React renders it and paints. The page is interactive at once, because the browser rendered it with its handlers attached. Nothing needs hydrating.',
        screen: 'content',
        interactive: true,
      },
    ],
    contentMs: 1100,
    interactiveMs: 1100,
    jsKb: 280,
  },
  {
    id: 'ssr',
    label: 'SSR',
    summary:
      'The server fetches the data and renders HTML for every request. The browser shows it at once, then hydrates.',
    events: [
      {
        id: 'fetch',
        lane: 'server',
        start: 20,
        end: 420,
        label: 'fetch product and reviews',
        kind: 'network',
      },
      { id: 'render', lane: 'server', start: 420, end: 500, label: 'render HTML', kind: 'render' },
      {
        id: 'html',
        lane: 'network',
        start: 500,
        end: 580,
        label: 'HTML response',
        kind: 'network',
      },
      { id: 'js', lane: 'network', start: 580, end: 1020, label: 'app.js 280 KB', kind: 'network' },
      { id: 'paint', lane: 'browser', start: 580, end: 600, label: 'paint HTML', kind: 'paint' },
      { id: 'run', lane: 'browser', start: 1020, end: 1080, label: 'run script', kind: 'task' },
      { id: 'hydrate', lane: 'browser', start: 1080, end: 1240, label: 'hydrate', kind: 'effect' },
    ],
    phases: [
      {
        at: 420,
        title: 'The server waits for all its data',
        description:
          'Nothing is sent until the slowest query finishes, so the screen stays blank. Per-request rendering also costs server time.',
        screen: 'blank',
        interactive: false,
      },
      {
        at: 600,
        title: 'The HTML paints',
        description:
          'Real content appears long before CSR could show it. The buttons are only markup, so tapping them does nothing yet.',
        screen: 'content',
        interactive: false,
      },
      {
        at: 1020,
        title: 'The script arrives',
        description:
          'The browser has downloaded the same 280 KB of component code. The page still looks ready and is not.',
        screen: 'content',
        interactive: false,
      },
      {
        at: 1240,
        title: 'Hydration completes',
        description:
          'React runs the components against the existing HTML and attaches handlers. Now the page works.',
        screen: 'content',
        interactive: true,
      },
    ],
    contentMs: 600,
    interactiveMs: 1240,
    jsKb: 280,
  },
  {
    id: 'ssg',
    label: 'SSG',
    summary:
      'The HTML was rendered once, at build time. A CDN serves the file, so no server renders anything per request.',
    events: [
      { id: 'cdn', lane: 'server', start: 10, end: 40, label: 'CDN serves a file', kind: 'task' },
      {
        id: 'html',
        lane: 'network',
        start: 40,
        end: 110,
        label: 'HTML from the edge',
        kind: 'network',
      },
      { id: 'js', lane: 'network', start: 110, end: 550, label: 'app.js 280 KB', kind: 'network' },
      { id: 'paint', lane: 'browser', start: 110, end: 130, label: 'paint HTML', kind: 'paint' },
      { id: 'run', lane: 'browser', start: 550, end: 610, label: 'run script', kind: 'task' },
      { id: 'hydrate', lane: 'browser', start: 610, end: 770, label: 'hydrate', kind: 'effect' },
    ],
    phases: [
      {
        at: 40,
        title: 'The request reaches the CDN',
        description:
          'The page already exists as a file. No data is fetched and nothing is rendered for this visitor.',
        screen: 'blank',
        interactive: false,
      },
      {
        at: 130,
        title: 'The HTML paints',
        description:
          'The fastest first content of the five. The data is frozen at the last build, so it can be stale.',
        screen: 'content',
        interactive: false,
      },
      {
        at: 550,
        title: 'The script arrives',
        description: 'Same 280 KB as SSR. The page looks ready and still ignores taps.',
        screen: 'content',
        interactive: false,
      },
      {
        at: 770,
        title: 'Hydration completes',
        description: 'Handlers attach and the page works. The gap is the cost of hydration again.',
        screen: 'content',
        interactive: true,
      },
    ],
    contentMs: 130,
    interactiveMs: 770,
    jsKb: 280,
  },
  {
    id: 'streaming',
    label: 'Streaming SSR',
    summary:
      'The server sends the shell as soon as the fast data is ready, then streams the slow section into its Suspense boundary.',
    events: [
      { id: 'shell', lane: 'server', start: 20, end: 70, label: 'render shell', kind: 'render' },
      {
        id: 'product',
        lane: 'server',
        start: 70,
        end: 220,
        label: 'fetch product',
        kind: 'network',
      },
      {
        id: 'reviews',
        lane: 'server',
        start: 220,
        end: 470,
        label: 'fetch reviews',
        kind: 'network',
      },
      {
        id: 'chunk',
        lane: 'server',
        start: 470,
        end: 510,
        label: 'render reviews',
        kind: 'render',
      },
      {
        id: 'html',
        lane: 'network',
        start: 220,
        end: 300,
        label: 'HTML shell and product',
        kind: 'network',
      },
      { id: 'js', lane: 'network', start: 300, end: 740, label: 'app.js 280 KB', kind: 'network' },
      {
        id: 'stream',
        lane: 'network',
        start: 510,
        end: 570,
        label: 'streamed reviews',
        kind: 'network',
      },
      { id: 'paint1', lane: 'browser', start: 300, end: 320, label: 'paint shell', kind: 'paint' },
      {
        id: 'paint2',
        lane: 'browser',
        start: 570,
        end: 590,
        label: 'paint reviews',
        kind: 'paint',
      },
      { id: 'run', lane: 'browser', start: 740, end: 800, label: 'run script', kind: 'task' },
      { id: 'hydrate', lane: 'browser', start: 800, end: 960, label: 'hydrate', kind: 'effect' },
    ],
    phases: [
      {
        at: 220,
        title: 'The server starts early',
        description:
          'The shell renders at once and the fast query finishes. The server does not wait for the slow reviews query.',
        screen: 'blank',
        interactive: false,
      },
      {
        at: 320,
        title: 'The shell and product paint',
        description:
          'First content arrives about 280 ms before SSR could send anything. The reviews boundary shows its fallback.',
        screen: 'partial',
        interactive: false,
      },
      {
        at: 590,
        title: 'The reviews stream in',
        description:
          'The server finishes the slow section and streams it into the same page, with no scripts needed to place it.',
        screen: 'content',
        interactive: false,
      },
      {
        at: 960,
        title: 'Hydration completes',
        description:
          'Selective hydration works through each boundary as its code arrives. Total JavaScript is unchanged from SSR.',
        screen: 'content',
        interactive: true,
      },
    ],
    contentMs: 320,
    interactiveMs: 960,
    jsKb: 280,
  },
  {
    id: 'rsc',
    label: 'RSC',
    summary:
      'Server Components render on the server and stream. Only the interactive client components ship as JavaScript and hydrate.',
    events: [
      {
        id: 'shell',
        lane: 'server',
        start: 20,
        end: 70,
        label: 'render Server Components',
        kind: 'render',
      },
      {
        id: 'product',
        lane: 'server',
        start: 70,
        end: 220,
        label: 'read product',
        kind: 'network',
      },
      {
        id: 'reviews',
        lane: 'server',
        start: 220,
        end: 470,
        label: 'read reviews',
        kind: 'network',
      },
      {
        id: 'chunk',
        lane: 'server',
        start: 470,
        end: 510,
        label: 'render reviews',
        kind: 'render',
      },
      {
        id: 'html',
        lane: 'network',
        start: 220,
        end: 300,
        label: 'HTML and payload',
        kind: 'network',
      },
      { id: 'js', lane: 'network', start: 300, end: 490, label: 'app.js 120 KB', kind: 'network' },
      {
        id: 'stream',
        lane: 'network',
        start: 510,
        end: 570,
        label: 'streamed reviews',
        kind: 'network',
      },
      { id: 'paint1', lane: 'browser', start: 300, end: 320, label: 'paint shell', kind: 'paint' },
      { id: 'run', lane: 'browser', start: 490, end: 530, label: 'run script', kind: 'task' },
      {
        id: 'hydrate',
        lane: 'browser',
        start: 530,
        end: 600,
        label: 'hydrate islands',
        kind: 'effect',
      },
      {
        id: 'paint2',
        lane: 'browser',
        start: 570,
        end: 590,
        label: 'paint reviews',
        kind: 'paint',
      },
    ],
    phases: [
      {
        at: 220,
        title: 'Server Components run on the server',
        description:
          'Components read their data directly and render. Their code and libraries stay on the server.',
        screen: 'blank',
        interactive: false,
      },
      {
        at: 320,
        title: 'The shell and product paint',
        description:
          'Like streaming SSR, content arrives early. The payload carries the rendered tree for the client to reuse.',
        screen: 'partial',
        interactive: false,
      },
      {
        at: 490,
        title: 'A much smaller script arrives',
        description:
          'Only the client components ship: 120 KB instead of 280 KB. It downloads and runs sooner.',
        screen: 'partial',
        interactive: false,
      },
      {
        at: 600,
        title: 'Reviews stream in and islands hydrate',
        description:
          'There is less to hydrate, so the gap between content and interactivity shrinks to about 280 ms.',
        screen: 'content',
        interactive: true,
      },
    ],
    contentMs: 320,
    interactiveMs: 600,
    jsKb: 120,
  },
];

function clipEvents(events: TimelineEvent[], at: number): TimelineEvent[] {
  return events
    .filter((event) => event.start <= at)
    .map((event) => (event.end !== undefined && event.end > at ? { ...event, end: at } : event));
}

const screenText: Record<Screen, string> = {
  blank: 'blank page',
  skeleton: 'loading skeleton',
  partial: 'product visible, reviews loading',
  content: 'full content',
};

function Bar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('h-2.5 rounded bg-surface-2', className)} />;
}

function PhoneMock({ screen, interactive }: { screen: Screen; interactive: boolean }) {
  const showProduct = screen === 'partial' || screen === 'content';
  const status =
    screen === 'blank' || screen === 'skeleton'
      ? 'Nothing to tap yet'
      : interactive
        ? 'Interactive'
        : 'Not interactive';

  return (
    <div className="mx-auto grid w-40 gap-2 sm:mx-0">
      <div
        role="img"
        aria-label={`Phone showing ${screenText[screen]}. ${status}.`}
        className="rounded-[1.4rem] border-2 border-line bg-surface p-2"
      >
        <div className="grid min-h-52 content-start gap-2 rounded-xl bg-bg p-2.5">
          {screen === 'blank' && (
            <p aria-hidden="true" className="pt-16 text-center text-[0.72rem] text-faint">
              blank
            </p>
          )}
          {screen === 'skeleton' && (
            <div aria-hidden="true" className="grid gap-2">
              <Bar className="w-1/2" />
              <Bar className="h-12" />
              <Bar className="w-2/3" />
              <Bar className="w-1/3" />
            </div>
          )}
          {showProduct && (
            <div aria-hidden="true" className="grid gap-2">
              <p className="font-display text-[0.82rem] font-semibold">Alder 65 keyboard</p>
              <div className="h-10 rounded bg-surface-2" />
              <span
                className={cn(
                  'rounded-md px-2 py-1 text-center text-[0.72rem] font-medium',
                  interactive
                    ? 'bg-accent text-accent-fg'
                    : 'border border-dashed border-line text-muted',
                )}
              >
                Add to cart
              </span>
              <p className="pt-1 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-muted">
                Reviews
              </p>
              {screen === 'partial' ? (
                <div className="grid gap-1.5">
                  <Bar />
                  <Bar className="w-3/4" />
                </div>
              ) : (
                <div className="grid gap-1 text-[0.72rem] text-muted">
                  <p>Great board, quiet keys.</p>
                  <p>Fast delivery.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p
        className={cn(
          'text-center font-mono text-[0.68rem] uppercase tracking-[0.08em]',
          status === 'Interactive' && 'tone-ok',
          status === 'Not interactive' && 'tone-bad',
          status === 'Nothing to tap yet' && 'text-faint',
        )}
      >
        {status}
      </p>
    </div>
  );
}

function scriptProgress(strategy: Strategy, at: number): number {
  const script = strategy.events.find((event) => event.id === 'js');
  if (!script || script.end === undefined || at <= script.start) return 0;
  const done = Math.min(at, script.end) - script.start;
  return Math.round((done / (script.end - script.start)) * strategy.jsKb);
}

function Stage({ strategy, phase }: { strategy: Strategy; phase: Phase }) {
  const downloaded = scriptProgress(strategy, phase.at);
  const rows: [string, string][] = [
    ['Time', `${phase.at} ms`],
    ['On screen', screenText[phase.screen]],
    ['Interactive', phase.interactive ? 'yes' : 'no'],
    ['JavaScript downloaded', `${downloaded} of ${strategy.jsKb} KB`],
  ];

  return (
    <div className="grid gap-4">
      <Timeline
        lanes={lanes}
        events={clipEvents(strategy.events, phase.at)}
        duration={duration}
        cursor={phase.at}
      />
      <div className="grid items-center gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <PhoneMock screen={phase.screen} interactive={phase.interactive} />
        <dl
          aria-label="State at this step"
          className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 font-mono text-[0.8rem]"
        >
          {rows.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted">{name}</dt>
              <dd className="tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function ComparisonTable({ selected }: { selected: StrategyId }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[26rem] border-collapse text-left text-[0.82rem]">
        <caption className="sr-only">All strategies compared</caption>
        <thead>
          <tr className="bg-surface text-[0.7rem] uppercase tracking-[0.08em] text-muted">
            <th scope="col" className="px-3 py-1.5 font-medium">
              Strategy
            </th>
            <th scope="col" className="px-3 py-1.5 text-right font-medium">
              Content
            </th>
            <th scope="col" className="px-3 py-1.5 text-right font-medium">
              Interactive
            </th>
            <th scope="col" className="px-3 py-1.5 text-right font-medium">
              JavaScript
            </th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((item) => (
            <tr
              key={item.id}
              aria-current={item.id === selected ? 'true' : undefined}
              className="border-t border-line aria-[current=true]:bg-surface-2"
            >
              <th scope="row" className="px-3 py-1.5 font-medium">
                {item.label}
              </th>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums">{`${item.contentMs} ms`}</td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums">{`${item.interactiveMs} ms`}</td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums">{`${item.jsKb} KB`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StrategyLab() {
  const [selected, setSelected] = useState<StrategyId>('csr');
  const strategy = strategies.find((item) => item.id === selected) ?? strategies[0];
  if (!strategy) return null;

  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Rendering strategy" className="kit-seg justify-self-start">
        {strategies.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === selected}
            onClick={() => setSelected(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="max-w-[68ch] text-[0.88rem] text-muted">{strategy.summary}</p>

      <Stepper
        key={strategy.id}
        autoplayMs={1500}
        steps={strategy.phases.map((phase) => ({
          title: phase.title,
          description: phase.description,
          content: <Stage strategy={strategy} phase={phase} />,
        }))}
      />

      <div className="grid gap-3">
        <Meter
          label="Content visible"
          value={strategy.contentMs}
          max={1300}
          unit="ms"
          thresholds={{ warn: 600, bad: 1000 }}
        />
        <Meter
          label="Interactive"
          value={strategy.interactiveMs}
          max={1300}
          unit="ms"
          thresholds={{ warn: 800, bad: 1100 }}
        />
        <Meter
          label="Visible but not yet interactive"
          value={strategy.interactiveMs - strategy.contentMs}
          max={1300}
          unit="ms"
          thresholds={{ warn: 250, bad: 500 }}
        />
        <Meter
          label="JavaScript shipped"
          value={strategy.jsKb}
          max={300}
          unit="KB"
          thresholds={{ warn: 150, bad: 250 }}
        />
      </div>

      <ComparisonTable selected={strategy.id} />
    </div>
  );
}
