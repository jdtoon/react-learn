import { ArrowRight } from 'lucide-react';
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { RenderBox } from '../../kit';
import { cn } from '../../kit/cn';
import { createRenderLog, type RenderLog } from './renderLog';

type Theme = 'light' | 'dark';

const nodeOrder = ['ThemeProvider', 'App', 'Sidebar', 'Feed', 'Post A', 'Post B', 'ThemeBadge'];
const stableLinks = ['Inbox', 'Drafts', 'Sent'];

const RenderLogContext = createContext<RenderLog>(createRenderLog());
const ThemeContext = createContext<Theme>('light');

function useReportRender(name: string) {
  const log = useContext(RenderLogContext);
  useLayoutEffect(() => {
    log.rendered(name);
  });
}

function Readout({ children }: { children: string }) {
  return <p className="font-mono text-[0.78rem] text-muted tabular-nums">{children}</p>;
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
      <input
        type="checkbox"
        className="kit-check mt-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const log = useContext(RenderLogContext);
  const [theme, setTheme] = useState<Theme>('light');
  useReportRender('ThemeProvider');

  return (
    <RenderBox label="<ThemeProvider>">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kit-btn"
          onClick={() => {
            log.trigger('Change theme');
            setTheme(theme === 'light' ? 'dark' : 'light');
          }}
        >
          Change theme
        </button>
        <Readout>{`theme ${theme}`}</Readout>
      </div>
      <ThemeContext value={theme}>{children}</ThemeContext>
    </RenderBox>
  );
}

function ThemeBadge() {
  const theme = useContext(ThemeContext);
  useReportRender('ThemeBadge');

  return (
    <RenderBox label="<ThemeBadge>">
      <p className="flex items-center gap-2 font-mono text-[0.78rem] text-muted">
        <span
          aria-hidden="true"
          className={cn(
            'size-3 rounded-full border border-line',
            theme === 'dark' ? 'bg-fg' : 'bg-surface-2',
          )}
        />
        {`context: ${theme}`}
      </p>
    </RenderBox>
  );
}

function Post({ name }: { name: string }) {
  const log = useContext(RenderLogContext);
  const [likes, setLikes] = useState(0);
  useReportRender(name);

  return (
    <RenderBox label={`<${name}>`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kit-btn"
          onClick={() => {
            log.trigger(`Like ${name}`);
            setLikes(likes + 1);
          }}
        >
          {`Like ${name}`}
        </button>
        <Readout>{`likes ${likes}`}</Readout>
      </div>
    </RenderBox>
  );
}

function Feed() {
  const log = useContext(RenderLogContext);
  const [count, setCount] = useState(0);
  useReportRender('Feed');

  return (
    <RenderBox label="<Feed>">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kit-btn"
          onClick={() => {
            log.trigger('Change Feed state');
            setCount(count + 1);
          }}
        >
          Change Feed state
        </button>
        <Readout>{`state ${count}`}</Readout>
      </div>
      <Post name="Post A" />
      <Post name="Post B" />
      <ThemeBadge />
    </RenderBox>
  );
}

interface SidebarProps {
  links: string[];
}

function Sidebar({ links, memoized = false }: SidebarProps & { memoized?: boolean }) {
  useReportRender('Sidebar');

  return (
    <RenderBox label="<Sidebar>" memoized={memoized}>
      <ul className="grid gap-0.5 text-[0.82rem] text-muted">
        {links.map((link) => (
          <li key={link}>{link}</li>
        ))}
      </ul>
    </RenderBox>
  );
}

const MemoSidebar = memo(function MemoSidebar({ links }: SidebarProps) {
  return <Sidebar links={links} memoized />;
});

function App() {
  const log = useContext(RenderLogContext);
  const [count, setCount] = useState(0);
  const [memoOn, setMemoOn] = useState(false);
  const [freshLinks, setFreshLinks] = useState(false);
  useReportRender('App');
  const links = freshLinks ? [...stableLinks] : stableLinks;

  return (
    <RenderBox label="<App>">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="kit-btn"
          onClick={() => {
            log.trigger('Change App state');
            setCount(count + 1);
          }}
        >
          Change App state
        </button>
        <button
          type="button"
          className="kit-btn"
          onClick={() => {
            log.trigger('Set App state to same value');
            setCount(count);
          }}
        >
          Set App state to same value
        </button>
        <Readout>{`state ${count}`}</Readout>
      </div>
      <div className="grid gap-1.5">
        <Toggle
          label="Wrap Sidebar in memo"
          checked={memoOn}
          onChange={(checked) => {
            log.trigger(checked ? 'Wrap Sidebar in memo' : 'Unwrap Sidebar from memo');
            setMemoOn(checked);
          }}
        />
        <Toggle
          label="Pass a fresh array to Sidebar each render"
          checked={freshLinks}
          onChange={(checked) => {
            log.trigger(checked ? 'Pass a fresh array each render' : 'Pass a stable array');
            setFreshLinks(checked);
          }}
        />
        <p className="text-[0.78rem] text-faint">
          Ticking memo swaps the component type, so Sidebar remounts and its counter restarts.
        </p>
      </div>
      <div className="grid items-start gap-2 @xl:grid-cols-[15rem_minmax(0,1fr)]">
        {memoOn ? <MemoSidebar links={links} /> : <Sidebar links={links} />}
        <Feed />
      </div>
    </RenderBox>
  );
}

function Step({
  index,
  title,
  last = false,
  children,
}: {
  index: number;
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative grid content-start gap-1.5 rounded-lg border border-line border-t-[3px] border-t-(--tc,var(--accent)) bg-surface p-3 sm:min-h-36">
      <p className="eyebrow">{`${index} ${title}`}</p>
      {children}
      {!last && (
        <ArrowRight
          aria-hidden="true"
          size={14}
          className="absolute top-1/2 -right-[0.9375rem] hidden -translate-y-1/2 text-faint sm:block"
        />
      )}
    </li>
  );
}

function ChipList({ label, items, active }: { label: string; items: string[]; active: boolean }) {
  const labelId = useId();
  return (
    <div className="grid gap-1">
      <p id={labelId} className="text-[0.74rem] text-muted">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="text-[0.82rem] text-faint">None</p>
      ) : (
        <ul aria-labelledby={labelId} className="flex flex-wrap gap-1">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[0.72rem]',
                active
                  ? 'border-(--tc,var(--accent)) bg-[color-mix(in_oklab,var(--tc,var(--accent))_16%,transparent)]'
                  : 'border-line text-faint',
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UpdatePanel() {
  const log = useContext(RenderLogContext);
  const summary = useSyncExternalStore(log.subscribe, log.getSnapshot);
  const rendered = summary ? nodeOrder.filter((name) => summary.rendered.includes(name)) : [];
  const notRendered = summary ? nodeOrder.filter((name) => !summary.rendered.includes(name)) : [];

  return (
    <div className="grid gap-2">
      <div role="status" aria-label="Last update">
        <ol className="grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,0.8fr)]">
          <Step index={1} title="Trigger">
            {summary ? (
              <p className="text-[0.92rem] font-medium">{summary.trigger}</p>
            ) : (
              <p className="text-[0.88rem] text-muted">Press a button above to start.</p>
            )}
          </Step>
          <Step index={2} title="Render">
            {summary ? (
              <>
                <p className="text-[0.92rem] font-medium">{`${rendered.length} of ${nodeOrder.length} components rendered`}</p>
                <ChipList label="Rendered" items={rendered} active />
                <ChipList label="Not rendered" items={notRendered} active={false} />
              </>
            ) : (
              <p className="text-[0.88rem] text-muted">
                React will list which components rendered into the commit.
              </p>
            )}
          </Step>
          <Step index={3} title="Commit" last>
            {summary ? (
              <p className="flex flex-col text-[0.92rem] font-medium">
                <span className="font-display text-[1.9rem] leading-none font-semibold tabular-nums">
                  {summary.domChanges}
                </span>{' '}
                <span>{summary.domChanges === 1 ? 'DOM change' : 'DOM changes'}</span>
              </p>
            ) : (
              <p className="text-[0.88rem] text-muted">And how much of the page changed.</p>
            )}
          </Step>
        </ol>
      </div>
      <p className="text-[0.74rem] text-faint">
        A component counts as rendered when its output reaches the commit, so a call React discards
        after bailing out is not counted. DOM changes are counted by a MutationObserver on the tree
        above. It ignores the counters and flash styling this lab adds, and writes that leave a
        value unchanged.
      </p>
    </div>
  );
}

export function RenderTreeLab() {
  const [log] = useState(createRenderLog);
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tree = treeRef.current;
    return tree ? log.observe(tree) : undefined;
  }, [log]);

  return (
    <RenderLogContext value={log}>
      <div className="grid gap-4">
        <div ref={treeRef} className="@container">
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </div>
        <UpdatePanel />
      </div>
    </RenderLogContext>
  );
}
