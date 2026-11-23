import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { LabSpec, MeetingCard, Pitfall } from '../content/types';
import {
  Callout,
  CodePeek,
  Compare,
  LabFrame,
  MeetingCardView,
  Meter,
  PitfallCard,
  RenderBox,
  RichText,
  SelfCheck,
  Stepper,
  Timeline,
  Waterfall,
  createRng,
  simulateRequest,
  type TimelineEvent,
  type TimelineLane,
  type WaterfallRequest,
} from '../kit';

interface Specimen {
  id: string;
  name: string;
  signature: string;
  note: string;
}

const specimens: Specimen[] = [
  {
    id: 'rich-text',
    name: 'RichText',
    signature: '{ text: string }',
    note: 'Inline code and bold for any content string.',
  },
  {
    id: 'render-box',
    name: 'RenderBox',
    signature: '{ label: string; children?: ReactNode; memoized?: boolean; className?: string }',
    note: 'Counts commits and flashes. Colour comes from the nearest --tc property.',
  },
  {
    id: 'lab-frame',
    name: 'LabFrame',
    signature: '{ spec: LabSpec; children: ReactNode }',
    note: 'Title, Try this checklist, the lab, and the What just happened reveal.',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    signature: '{ lanes; events; duration; cursor? }',
    note: 'Lanes on a shared time axis. Overlapping events in a lane stack into rows.',
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    signature: '{ requests; total }',
    note: 'Rows show start, end and status. Pending rows are striped.',
  },
  {
    id: 'compare',
    name: 'Compare',
    signature: '{ items; initial? }',
    note: 'Two items sit side by side from 900px wide. Three or more stay a toggle.',
  },
  {
    id: 'meter',
    name: 'Meter',
    signature: '{ label; value; max; unit?; thresholds? }',
    note: 'Higher is worse by default. Set warn above bad when lower is worse.',
  },
  {
    id: 'stepper',
    name: 'Stepper',
    signature: '{ steps; autoplayMs? }',
    note: 'Previous, next and play. Arrow keys also step while focus is inside.',
  },
  {
    id: 'code-peek',
    name: 'CodePeek',
    signature: "{ code; lang?: 'tsx' | 'ts' | 'css' | 'html' | 'bash'; title?; defaultOpen? }",
    note: 'Collapsed by default, highlighted, with a copy button.',
  },
  {
    id: 'callout',
    name: 'Callout',
    signature: "{ tone: 'info' | 'warn' | 'insight'; title?; children }",
    note: 'Three tones. The insight tone follows the track colour.',
  },
  {
    id: 'pitfall-card',
    name: 'PitfallCard',
    signature: '{ pitfall: Pitfall }',
    note: 'Symptom, cause and fix, with an optional bad and good snippet.',
  },
  {
    id: 'meeting-card',
    name: 'MeetingCardView',
    signature: '{ card: MeetingCard }',
    note: 'Say, ask, red flags and the trade-off.',
  },
  {
    id: 'self-check',
    name: 'SelfCheck',
    signature: '{ items: ModuleContent["selfCheck"] }',
    note: 'Questions with a reveal. Nothing is scored or stored.',
  },
  {
    id: 'sim',
    name: 'sim.ts',
    signature:
      'sleep(ms, signal?) · simulateRequest({ value, latencyMs, failRate?, rng?, signal? }) · createRng(seed)',
    note: 'Deterministic helpers for labs that need latency or failures.',
  },
];

function SpecimenSection({ specimen, children }: { specimen: Specimen; children: ReactNode }) {
  const headingId = `${specimen.id}-heading`;
  return (
    <section
      id={specimen.id}
      aria-labelledby={headingId}
      className="grid scroll-mt-20 gap-4 border-t border-line pt-8"
    >
      <header className="grid gap-1.5">
        <h2 id={headingId}>{specimen.name}</h2>
        <p className="font-mono text-[0.74rem] leading-relaxed text-muted [overflow-wrap:anywhere]">
          {specimen.signature}
        </p>
        <p className="max-w-[64ch] text-[0.92rem] text-muted">{specimen.note}</p>
      </header>
      {children}
    </section>
  );
}

const MemoSidebar = memo(function MemoSidebar() {
  return <RenderBox label="<Sidebar>" memoized />;
});

function PlainSidebar() {
  return <RenderBox label="<Sidebar>" />;
}

function Post({ name }: { name: string }) {
  const [likes, setLikes] = useState(0);
  return (
    <RenderBox label={`<${name}>`}>
      <button
        type="button"
        className="kit-btn justify-self-start"
        onClick={() => setLikes(likes + 1)}
      >
        {`Like Post (${likes})`}
      </button>
    </RenderBox>
  );
}

function Feed() {
  const [version, setVersion] = useState(0);
  return (
    <RenderBox label="<Feed>">
      <button
        type="button"
        className="kit-btn justify-self-start"
        onClick={() => setVersion(version + 1)}
      >
        {`Change Feed state (${version})`}
      </button>
      <Post name="Post A" />
      <Post name="Post B" />
    </RenderBox>
  );
}

function RenderTreeDemo() {
  const [version, setVersion] = useState(0);
  const [memoSidebar, setMemoSidebar] = useState(false);
  const Sidebar = memoSidebar ? MemoSidebar : PlainSidebar;

  return (
    <div className="grid gap-4">
      <RenderBox label="<App>">
        <button
          type="button"
          className="kit-btn justify-self-start"
          onClick={() => setVersion(version + 1)}
        >
          {`Change App state (${version})`}
        </button>
        <div className="grid items-start gap-2 sm:grid-cols-2">
          <Sidebar />
          <Feed />
        </div>
      </RenderBox>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
        <input
          type="checkbox"
          className="kit-check mt-0"
          checked={memoSidebar}
          onChange={(event) => setMemoSidebar(event.target.checked)}
        />
        Wrap Sidebar in memo
      </label>
    </div>
  );
}

const MemoStatic = memo(function MemoStatic() {
  return <RenderBox label="<Static>" memoized />;
});

function CounterLab() {
  const [count, setCount] = useState(0);
  return (
    <div className="grid gap-3">
      <RenderBox label="<Counter>">
        <p className="font-mono text-[0.86rem]">{`count = ${count}`}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <RenderBox label="<Label>" />
          <MemoStatic />
        </div>
      </RenderBox>
      <button
        type="button"
        className="kit-btn justify-self-start"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  );
}

const labSpec: LabSpec = {
  id: 'kit-demo',
  title: 'Counter lab',
  tryThis: [
    'Press **Increment** and watch which boxes flash',
    'Check the render counts on `<Label>` and the memoised `<Static>`',
  ],
  whatHappened:
    'The state lives in the counter, so it renders again along with everything it renders. `<Static>` is wrapped in `memo` and its props never change, so React skips it.',
};

const timelineLanes: TimelineLane[] = [
  { id: 'react', label: 'React' },
  { id: 'effects', label: 'Effects' },
  { id: 'network', label: 'Network' },
  { id: 'browser', label: 'Browser' },
];

const timelineEvents: TimelineEvent[] = [
  { id: 'e1', lane: 'react', start: 0, end: 12, label: 'render <App>', kind: 'render' },
  { id: 'e2', lane: 'react', start: 4, end: 10, label: 'render <Feed>', kind: 'render' },
  { id: 'e3', lane: 'react', start: 12, end: 15, label: 'commit', kind: 'commit' },
  { id: 'e4', lane: 'effects', start: 16, end: 22, label: 'subscribe', kind: 'effect' },
  { id: 'e5', lane: 'network', start: 22, end: 74, label: 'GET /posts', kind: 'network' },
  { id: 'e6', lane: 'browser', start: 15, end: 18, label: 'paint', kind: 'paint' },
  { id: 'e7', lane: 'react', start: 80, end: 83, label: 'commit', kind: 'commit' },
  { id: 'e8', lane: 'effects', start: 83, end: 86, label: 'cleanup', kind: 'cleanup' },
  { id: 'e9', lane: 'browser', start: 26, end: 70, label: 'idle', kind: 'idle' },
  { id: 'e10', lane: 'browser', start: 86, label: 'long task', kind: 'task', end: 98 },
];

const staticRequests: WaterfallRequest[] = [
  { id: 'r1', label: 'GET /api/user', start: 0, end: 220 },
  { id: 'r2', label: 'GET /api/posts', start: 220, end: 640 },
  { id: 'r3', label: 'GET /api/comments', start: 640, end: 900, status: 'error' },
  { id: 'r4', label: 'GET /api/avatar', start: 640, end: 1100, status: 'pending' },
];

const pitfall: Pitfall = {
  title: 'Index keys on a list that reorders',
  symptom: 'Typed text lands in the wrong row after an insert',
  cause: 'The key is the array index, so state follows the **position**, not the item',
  fix: 'Use a stable id from the data as the key',
  bad: 'items.map((item, index) => (\n  <Row key={index} item={item} />\n))',
  good: 'items.map((item) => (\n  <Row key={item.id} item={item} />\n))',
};

const meetingCard: MeetingCard = {
  say: [
    'A re-render is React calling the function again, not the DOM being rebuilt.',
    'A parent rendering re-renders its children by default.',
  ],
  ask: ['Did we measure before adding `memo`?', 'Could this state live lower in the tree?'],
  redFlags: [
    '`useEffect` used to copy one piece of state into another',
    'Array index keys on a list that reorders',
  ],
  tradeoff: 'Memoisation trades memory and complexity for skipped work.',
};

const selfCheckItems = [
  {
    question: 'A parent re-renders and passes the same props to a child. Does the child render?',
    answer: 'Yes. Unless the child is wrapped in `memo`, React runs it again.',
  },
  {
    question: 'You call `setCount(count)` with the current value. What happens?',
    answer: 'React bails out. It may render the component once more but skips its children.',
  },
  {
    question: 'What does changing a `key` on a component do?',
    answer: 'React treats it as a new component and resets its state.',
  },
];

const tsxSample = `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Clicked {count} times
    </button>
  );
}`;

const cssSample = `.card {
  container-type: inline-size;
  border: 1px solid var(--line);
}

@container (min-width: 32rem) {
  .card { display: grid; }
}`;

const htmlSample = `<button type="button" aria-expanded="false">
  Details
</button>`;

const bashSample = `pnpm install
pnpm run build`;

function TwoKeyStrategies() {
  return (
    <Compare
      initial="index"
      items={[
        {
          id: 'index',
          label: 'Index keys',
          verdict: 'bad',
          content: (
            <p className="text-[0.9rem]">
              Insert a row at the top and the text you typed stays in the{' '}
              <strong>first position</strong>, now attached to a different item.
            </p>
          ),
        },
        {
          id: 'stable',
          label: 'Stable keys',
          verdict: 'good',
          content: (
            <p className="text-[0.9rem]">
              The text moves down with its item, because the key says which row is which.
            </p>
          ),
        },
      ]}
    />
  );
}

function ThreeWayCompare() {
  return (
    <Compare
      items={[
        {
          id: 'context',
          label: 'Context',
          content: (
            <Meter
              label="Components re-rendered"
              value={48}
              max={50}
              thresholds={{ warn: 20, bad: 40 }}
            />
          ),
        },
        {
          id: 'selector',
          label: 'Selector store',
          verdict: 'good',
          content: (
            <Meter
              label="Components re-rendered"
              value={3}
              max={50}
              thresholds={{ warn: 20, bad: 40 }}
            />
          ),
        },
        {
          id: 'props',
          label: 'Props',
          verdict: 'neutral',
          content: (
            <Meter
              label="Components re-rendered"
              value={12}
              max={50}
              thresholds={{ warn: 20, bad: 40 }}
            />
          ),
        },
      ]}
    />
  );
}

function SimulatedRequests() {
  const [rows, setRows] = useState<WaterfallRequest[]>([]);
  const [run, setRun] = useState(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  function start() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const nextRun = run + 1;
    setRun(nextRun);
    const rng = createRng(nextRun);
    const paths = ['/api/user', '/api/posts', '/api/comments'];
    setRows([]);

    void (async () => {
      let clock = 0;
      for (const [index, path] of paths.entries()) {
        const latencyMs = Math.round(150 + rng() * 350);
        const row: WaterfallRequest = {
          id: `${nextRun}-${index}`,
          label: `GET ${path}`,
          start: clock,
          end: clock + latencyMs,
          status: 'pending',
        };
        setRows((current) => [...current, row]);
        try {
          await simulateRequest({
            value: path,
            latencyMs,
            failRate: 0.25,
            rng,
            signal: abort.signal,
          });
        } catch {
          if (abort.signal.aborted) return;
          setRows((current) =>
            current.map((item) => (item.id === row.id ? { ...item, status: 'error' } : item)),
          );
          return;
        }
        clock += latencyMs;
        setRows((current) =>
          current.map((item) => (item.id === row.id ? { ...item, status: 'ok' } : item)),
        );
      }
    })();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="kit-btn" onClick={start}>
          {run === 0 ? 'Run three chained requests' : 'Run again with a new seed'}
        </button>
        <p className="font-mono text-[0.74rem] text-muted">
          {run === 0 ? 'seed unset' : `createRng(${run}) · failRate 0.25`}
        </p>
      </div>
      <div className="kit-stage" aria-live="polite">
        {rows.length === 0 ? (
          <p className="text-[0.9rem] text-muted">
            Each request starts when the previous one settles.
          </p>
        ) : (
          <Waterfall requests={rows} total={1500} />
        )}
      </div>
    </div>
  );
}

export function KitGalleryPage() {
  return (
    <div className="mx-auto grid w-full max-w-[52rem] gap-12 px-4 py-10 sm:px-8 sm:py-14">
      <title>Lab kit | React Field Guide</title>
      <header className="grid gap-4">
        <p className="eyebrow">Reference</p>
        <h1>Lab kit</h1>
        <p className="lede">
          The shared components every lab and module page is built from. Each one below runs with
          sample props, so this page doubles as the review surface and the cheat sheet for module
          authors.
        </p>
        <nav aria-label="Kit components">
          <ul className="flex flex-wrap gap-2">
            {specimens.map((specimen) => (
              <li key={specimen.id}>
                <Link
                  to={`#${specimen.id}`}
                  className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 font-mono text-[0.76rem] hover:border-accent"
                >
                  {specimen.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {specimens.map((specimen) => (
        <SpecimenSection key={specimen.id} specimen={specimen}>
          {specimen.id === 'rich-text' && (
            <p className="max-w-[64ch] leading-relaxed">
              <RichText text="Wrap a name in backticks for `code` and in double asterisks for **bold**. Both work in outcomes, paragraphs, pitfalls and meeting cards." />
            </p>
          )}
          {specimen.id === 'render-box' && (
            <div className="kit-stage">
              <RenderTreeDemo />
            </div>
          )}
          {specimen.id === 'lab-frame' && (
            <LabFrame spec={labSpec}>
              <CounterLab />
            </LabFrame>
          )}
          {specimen.id === 'timeline' && (
            <div className="kit-stage">
              <Timeline lanes={timelineLanes} events={timelineEvents} duration={100} cursor={45} />
            </div>
          )}
          {specimen.id === 'waterfall' && (
            <div className="kit-stage">
              <Waterfall requests={staticRequests} total={1200} />
            </div>
          )}
          {specimen.id === 'compare' && (
            <div className="grid gap-6">
              <TwoKeyStrategies />
              <ThreeWayCompare />
            </div>
          )}
          {specimen.id === 'meter' && (
            <div className="kit-stage grid gap-5">
              <Meter
                label="Render time"
                value={8}
                max={32}
                unit="ms"
                thresholds={{ warn: 16, bad: 24 }}
              />
              <Meter
                label="Input latency"
                value={20}
                max={32}
                unit="ms"
                thresholds={{ warn: 16, bad: 24 }}
              />
              <Meter
                label="Frame rate (lower is worse)"
                value={22}
                max={60}
                unit="fps"
                thresholds={{ warn: 50, bad: 30 }}
              />
              <Meter label="Bundle size" value={142} max={400} unit="KB" />
            </div>
          )}
          {specimen.id === 'stepper' && (
            <Stepper
              autoplayMs={1600}
              steps={[
                {
                  title: 'Trigger',
                  description: 'A state setter is called. React schedules a render.',
                  content: <RenderBox label="<App>" />,
                },
                {
                  title: 'Render',
                  description: 'React calls your component functions to get the new element tree.',
                  content: (
                    <RenderBox label="<App>">
                      <RenderBox label="<Feed>" />
                    </RenderBox>
                  ),
                },
                {
                  title: 'Commit',
                  description:
                    'React applies only the differences to the DOM, then runs layout effects.',
                  content: (
                    <Timeline
                      lanes={[{ id: 'a', label: 'React' }]}
                      events={[
                        { id: 'x', lane: 'a', start: 0, end: 12, label: 'render', kind: 'render' },
                        { id: 'y', lane: 'a', start: 12, end: 15, label: 'commit', kind: 'commit' },
                      ]}
                      duration={20}
                    />
                  ),
                },
              ]}
            />
          )}
          {specimen.id === 'code-peek' && (
            <div className="grid gap-3">
              <CodePeek title="Counter.tsx" code={tsxSample} />
              <CodePeek title="card.css" lang="css" code={cssSample} defaultOpen />
              <CodePeek title="Disclosure" lang="html" code={htmlSample} />
              <CodePeek title="Install" lang="bash" code={bashSample} />
            </div>
          )}
          {specimen.id === 'callout' && (
            <div className="grid gap-3">
              <Callout tone="info" title="Good to know">
                A re-render is cheap when the output is the same. Measure before optimising.
              </Callout>
              <Callout tone="warn" title="Watch out">
                Setting state during render loops forever unless the value settles.
              </Callout>
              <Callout tone="insight">
                <RichText text="State belongs to a **position in the tree**. Change the key and you change the identity." />
              </Callout>
            </div>
          )}
          {specimen.id === 'pitfall-card' && <PitfallCard pitfall={pitfall} />}
          {specimen.id === 'meeting-card' && <MeetingCardView card={meetingCard} />}
          {specimen.id === 'self-check' && <SelfCheck items={selfCheckItems} />}
          {specimen.id === 'sim' && <SimulatedRequests />}
        </SpecimenSection>
      ))}
    </div>
  );
}
