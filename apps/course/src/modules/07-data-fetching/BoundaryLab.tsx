import {
  Component,
  Suspense,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Timeline, simulateRequest, type TimelineEvent } from '../../kit';

type SuspenseMode = 'page' | 'section';
type ErrorMode = 'page' | 'widget';
type Section = 'Header' | 'Profile' | 'Feed' | 'Comments';
type RevealKind = 'content' | 'error';

interface Settings {
  suspense: SuspenseMode;
  error: ErrorMode;
  failComments: boolean;
}

interface Profile {
  name: string;
  role: string;
}

interface Resources {
  Profile: Promise<Profile>;
  Feed: Promise<string[]>;
  Comments: Promise<string[]>;
}

interface Run {
  id: number;
  startedAt: number;
  resources: Resources;
}

interface Reveal {
  section: Section;
  kind: RevealKind;
  at: number;
}

const latencies = { Profile: 400, Feed: 900, Comments: 1400 };
const timelineDuration = 1800;
const lanes = (['Header', 'Profile', 'Feed', 'Comments'] as const).map((id) => ({ id, label: id }));

const profileData: Profile = { name: 'Ada Lovelace', role: 'Staff engineer' };
const feedData = ['Shipped the billing migration', 'Reviewed the cache RFC', 'Fixed a flaky test'];
const commentsData = ['Looks good to me', 'Can we add a test for the retry path?'];

function request<T>(value: T, latencyMs: number, fail: boolean): Promise<T> {
  const promise = simulateRequest({ value, latencyMs, failRate: fail ? 1 : 0 });
  promise.catch(() => undefined);
  return promise;
}

function createRun(id: number, failComments: boolean): Run {
  return {
    id,
    startedAt: performance.now(),
    resources: {
      Profile: request(profileData, latencies.Profile, false),
      Feed: request(feedData, latencies.Feed, false),
      Comments: request(commentsData, latencies.Comments, failComments),
    },
  };
}

type Report = (section: Section, kind: RevealKind) => void;

const ReportContext = createContext<Report>(() => undefined);

function useReveal(section: Section, kind: RevealKind) {
  const report = use(ReportContext);
  useEffect(() => {
    report(section, kind);
  }, [report, section, kind]);
}

interface BoundaryProps {
  onReset: () => void;
  fallback: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

class FailureBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  reset = () => {
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    return this.state.error
      ? this.props.fallback(this.state.error, this.reset)
      : this.props.children;
  }
}

function ErrorNotice({ error, onRetry }: { error: Error; onRetry: () => void }) {
  useReveal('Comments', 'error');
  return (
    <div role="alert" className="grid gap-2 rounded-lg border border-bad bg-surface p-3">
      <p className="tone-bad text-[0.88rem]">{`Something went wrong: ${error.message}`}</p>
      <button type="button" className="kit-btn justify-self-start" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function renderFailure(error: Error, reset: () => void) {
  return <ErrorNotice error={error} onRetry={reset} />;
}

function MaybeSuspense({
  on,
  fallback,
  children,
}: {
  on: boolean;
  fallback: ReactNode;
  children: ReactNode;
}) {
  return on ? <Suspense fallback={fallback}>{children}</Suspense> : <>{children}</>;
}

function MaybeBoundary({
  on,
  onReset,
  children,
}: {
  on: boolean;
  onReset: () => void;
  children: ReactNode;
}) {
  return on ? (
    <FailureBoundary onReset={onReset} fallback={renderFailure}>
      {children}
    </FailureBoundary>
  ) : (
    <>{children}</>
  );
}

function Skeleton({ label, lines }: { label: string; lines: number }) {
  return (
    <div
      role="status"
      aria-label={`Loading ${label}`}
      className="grid gap-2 rounded-lg border border-dashed border-line p-3"
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-3 rounded bg-surface-2 motion-safe:animate-pulse"
          style={{ width: `${90 - index * 22}%` }}
        />
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="grid gap-1.5 rounded-lg border border-line bg-surface p-3"
    >
      <p className="eyebrow">{title}</p>
      {children}
    </section>
  );
}

function Header() {
  useReveal('Header', 'content');
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <span className="font-display font-semibold">Acme dashboard</span>
      <span className="text-[0.8rem] text-muted">Home · Reports · Team</span>
    </header>
  );
}

function ProfileCard({ promise }: { promise: Promise<Profile> }) {
  const data = use(promise);
  useReveal('Profile', 'content');
  return (
    <Panel title="Profile">
      <p className="text-[0.92rem] font-medium">{data.name}</p>
      <p className="text-[0.82rem] text-muted">{data.role}</p>
    </Panel>
  );
}

function BulletList({
  title,
  section,
  promise,
}: {
  title: string;
  section: Section;
  promise: Promise<string[]>;
}) {
  const items = use(promise);
  useReveal(section, 'content');
  return (
    <Panel title={title}>
      <ul className="grid gap-1 text-[0.86rem] text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  );
}

function describe(settings: Settings): string {
  const loading =
    settings.suspense === 'page'
      ? 'One Suspense boundary wraps the page, so nothing appears until the slowest request settles (1400 ms), and the header waits with it.'
      : 'Each section has its own Suspense boundary, so the header is immediate and Profile, Feed and Comments appear at about 400, 900 and 1400 ms.';
  if (!settings.failComments) return loading;
  const failure =
    settings.error === 'page'
      ? 'The comments request fails, so the error boundary around the page replaces the whole screen with one message. Untick the box and press Retry to let it recover.'
      : 'The comments request fails, and the error boundary around the widget contains it: the rest of the page stays. Untick the box and press Retry to let it recover.';
  return `${loading} ${failure}`;
}

export function BoundaryLab() {
  const [settings, setSettings] = useState<Settings>({
    suspense: 'page',
    error: 'page',
    failComments: false,
  });
  const [run, setRun] = useState(() => createRun(0, false));
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const runRef = useRef(run);
  const seen = useRef(new Set<Section>());

  const report = useCallback<Report>((section, kind) => {
    if (seen.current.has(section)) return;
    seen.current.add(section);
    const at = Math.round(performance.now() - runRef.current.startedAt);
    setReveals((previous) => [...previous, { section, kind, at }]);
  }, []);

  function start(config: Settings) {
    const next = createRun(runRef.current.id + 1, config.failComments);
    runRef.current = next;
    seen.current.clear();
    setRun(next);
    setReveals([]);
  }

  function change(patch: Partial<Settings>, reload = true) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (reload) start(next);
  }

  function retryComments() {
    const next: Run = {
      ...runRef.current,
      resources: {
        ...runRef.current.resources,
        Comments: request(commentsData, latencies.Comments, settings.failComments),
      },
    };
    runRef.current = next;
    setRun(next);
  }

  const perSection = settings.suspense === 'section';
  const events: TimelineEvent[] = [
    ...(['Profile', 'Feed', 'Comments'] as const).map((section): TimelineEvent => ({
      id: `request-${section}`,
      lane: section,
      start: 0,
      end: latencies[section],
      label: 'request',
      kind: 'network',
    })),
    ...reveals.map((reveal): TimelineEvent => ({
      id: `reveal-${reveal.section}`,
      lane: reveal.section,
      start: reveal.at,
      label: reveal.kind === 'error' ? 'error shown' : 'visible',
      kind: 'paint',
    })),
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Suspense boundaries" className="kit-seg">
          <button
            type="button"
            aria-pressed={!perSection}
            onClick={() => change({ suspense: 'page' })}
          >
            One around the page
          </button>
          <button
            type="button"
            aria-pressed={perSection}
            onClick={() => change({ suspense: 'section' })}
          >
            One per section
          </button>
        </div>
        <div role="group" aria-label="Error boundary" className="kit-seg">
          <button
            type="button"
            aria-pressed={settings.error === 'page'}
            onClick={() => change({ error: 'page' })}
          >
            Error: around the page
          </button>
          <button
            type="button"
            aria-pressed={settings.error === 'widget'}
            onClick={() => change({ error: 'widget' })}
          >
            Error: around the widget
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={settings.failComments}
            onChange={(event) =>
              change({ failComments: event.target.checked }, event.target.checked)
            }
          />
          Comments request fails
        </label>
        <button type="button" className="kit-btn" onClick={() => start(settings)}>
          Reload page
        </button>
      </div>

      <p className="max-w-[68ch] text-[0.88rem] text-muted">{describe(settings)}</p>

      <ReportContext value={report}>
        <div
          key={run.id}
          role="group"
          aria-label="Page preview"
          className="grid min-h-48 content-start gap-3 rounded-xl border border-line p-3"
        >
          <MaybeBoundary on={settings.error === 'page'} onReset={retryComments}>
            <MaybeSuspense on={!perSection} fallback={<Skeleton label="page" lines={4} />}>
              <Header />
              <MaybeSuspense on={perSection} fallback={<Skeleton label="profile" lines={2} />}>
                <ProfileCard promise={run.resources.Profile} />
              </MaybeSuspense>
              <MaybeSuspense on={perSection} fallback={<Skeleton label="feed" lines={3} />}>
                <BulletList title="Feed" section="Feed" promise={run.resources.Feed} />
              </MaybeSuspense>
              <MaybeBoundary on={settings.error === 'widget'} onReset={retryComments}>
                <MaybeSuspense on={perSection} fallback={<Skeleton label="comments" lines={2} />}>
                  <BulletList
                    title="Comments"
                    section="Comments"
                    promise={run.resources.Comments}
                  />
                </MaybeSuspense>
              </MaybeBoundary>
            </MaybeSuspense>
          </MaybeBoundary>
        </div>
      </ReportContext>

      <div className="grid gap-1">
        <p className="eyebrow">What the user saw</p>
        <Timeline lanes={lanes} events={events} duration={timelineDuration} />
      </div>
    </div>
  );
}
