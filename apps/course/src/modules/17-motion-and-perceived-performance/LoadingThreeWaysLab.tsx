import { Loader2 } from 'lucide-react';
import {
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import { CodePeek, Meter, sleep } from '../../kit';
import { cn } from '../../kit/cn';

type Strategy = 'spinner' | 'skeleton' | 'optimistic';
type Kind = 'load' | 'post';

interface Comment {
  id: string;
  author: string;
  text: string;
  ago: string;
  pending?: boolean;
}

interface Reading {
  feedback: number;
  content: number | null;
  jump: number;
  rolledBack?: boolean;
}

type Readings = Record<Strategy, Partial<Record<Kind, Reading>>>;

interface Mark {
  kind: Kind;
  t0: number;
  id?: string;
  feedback?: number;
  failed?: boolean;
}

const strategies: { id: Strategy; label: string; summary: string }[] = [
  {
    id: 'spinner',
    label: 'Spinner',
    summary:
      'A small spinner replaces the content, and the real content appears when the server answers.',
  },
  {
    id: 'skeleton',
    label: 'Skeleton',
    summary: 'Grey rows with the final layout stand in for the content until it arrives.',
  },
  {
    id: 'optimistic',
    label: 'Optimistic',
    summary:
      'The old list stays on screen while it refreshes, and a posted comment appears at once with `useOptimistic`.',
  },
];

const delays = [
  { ms: 300, label: 'Fast (300 ms)' },
  { ms: 1200, label: 'Typical (1.2 s)' },
  { ms: 2500, label: 'Slow (2.5 s)' },
];

const seed: Comment[] = [
  { id: 's1', author: 'Mina', text: 'The new checkout flow is much clearer.', ago: '2h' },
  { id: 's2', author: 'Tomas', text: 'Can we get the receipt by email too?', ago: '5h' },
  { id: 's3', author: 'Priya', text: 'Delivered to Cape Town in two days.', ago: '1d' },
];

const emptyReadings: Readings = { spinner: {}, skeleton: {}, optimistic: {} };

const code = `const [optimisticComments, addOptimistic] = useOptimistic(
  comments,
  (current, next: Comment) => [{ ...next, pending: true }, ...current],
);

function post(comment: Comment) {
  startTransition(async () => {
    addOptimistic(comment);
    await save(comment);
    startTransition(() => setComments((current) => [comment, ...current]));
  });
}`;

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <li
      data-pending={comment.pending ? 'true' : undefined}
      className={cn(
        'flex h-16 items-center gap-3 rounded-lg border border-line bg-surface px-3',
        comment.pending && 'opacity-60',
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-[0.8rem] font-semibold"
      >
        {comment.author.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <p className="text-[0.78rem] text-muted">
          {comment.author} · {comment.pending ? 'sending' : comment.ago}
        </p>
        <p className="truncate text-[0.9rem]">{comment.text}</p>
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li
      aria-hidden="true"
      className="flex h-16 animate-pulse items-center gap-3 rounded-lg border border-line bg-surface px-3"
    >
      <span className="size-8 shrink-0 rounded-full bg-surface-2" />
      <div className="grid flex-1 gap-1.5">
        <span className="h-2.5 w-1/4 rounded bg-surface-2" />
        <span className="h-3 w-3/4 rounded bg-surface-2" />
      </div>
    </li>
  );
}

interface PanelProps {
  strategy: Strategy;
  delayMs: number;
  fails: boolean;
  onReading: (strategy: Strategy, kind: Kind, reading: Reading) => void;
}

function CommentsPanel({ strategy, delayMs, fails, onReading }: PanelProps) {
  const [phase, setPhase] = useState<'ready' | 'loading' | 'refreshing'>('ready');
  const [comments, setComments] = useState<Comment[]>(seed);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('Looks good to me');
  const [error, setError] = useState('');
  const [optimisticComments, addOptimistic] = useOptimistic(
    comments,
    (current: Comment[], next: Comment) => [{ ...next, pending: true }, ...current],
  );
  const [isPending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);
  const mark = useRef<Mark | null>(null);
  const lastHeight = useRef(0);
  const lastPost = useRef<Reading | null>(null);
  const busy = phase !== 'ready' || sending || isPending;

  useLayoutEffect(() => {
    const height = bodyRef.current?.offsetHeight ?? 0;
    const m = mark.current;
    if (m) {
      const now = performance.now();
      const arrived =
        m.kind === 'load'
          ? phase !== 'loading'
          : optimisticComments.some((comment) => comment.id === m.id);
      const feedbackVisible =
        m.kind === 'load'
          ? phase !== 'ready'
          : sending || optimisticComments.some((comment) => comment.id === m.id);
      const firstFeedbackNow = m.feedback === undefined && feedbackVisible;
      if (feedbackVisible && m.feedback === undefined) m.feedback = now - m.t0;
      const done = (reading: Reading) => {
        mark.current = null;
        if (m.kind === 'post') lastPost.current = reading;
        onReading(strategy, m.kind, reading);
      };
      if (m.failed) {
        done({ feedback: m.feedback ?? 0, content: null, jump: 0 });
      } else if (arrived) {
        done({
          feedback: m.feedback ?? 0,
          content: now - m.t0,
          jump: firstFeedbackNow ? 0 : Math.abs(height - lastHeight.current),
        });
      }
    }
    lastHeight.current = height;
  });

  async function reload() {
    if (busy) return;
    mark.current = { kind: 'load', t0: performance.now() };
    setPhase(strategy === 'optimistic' ? 'refreshing' : 'loading');
    await sleep(delayMs);
    setPhase('ready');
  }

  async function post(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: 'You',
      text: draft.trim() || 'Looks good to me',
      ago: 'now',
    };
    setError('');
    mark.current = { kind: 'post', t0: performance.now(), id: comment.id };

    if (strategy === 'optimistic') {
      startTransition(async () => {
        addOptimistic(comment);
        await sleep(delayMs);
        if (fails) {
          startTransition(() =>
            setError('The server refused the comment, so the row rolled back.'),
          );
          if (lastPost.current) {
            onReading(strategy, 'post', { ...lastPost.current, rolledBack: true });
          }
          return;
        }
        startTransition(() => setComments((current) => [comment, ...current]));
      });
      return;
    }

    setSending(true);
    await sleep(delayMs);
    if (fails) {
      if (mark.current) mark.current.failed = true;
      setError('The server refused the comment, so nothing was added.');
      setSending(false);
      return;
    }
    setComments((current) => [comment, ...current]);
    setSending(false);
  }

  const showPlaceholder = sending && strategy === 'skeleton';
  const rows = optimisticComments;

  return (
    <div className="grid gap-3">
      <form onSubmit={post} className="flex flex-wrap items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Comment text</span>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-3 text-[0.9rem]"
          />
        </label>
        <button type="submit" className="kit-btn" aria-disabled={busy ? true : undefined}>
          {sending && strategy === 'spinner' ? (
            <>
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
              Posting
            </>
          ) : (
            'Post comment'
          )}
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-disabled={busy ? true : undefined}
          onClick={() => void reload()}
        >
          Reload comments
        </button>
      </form>

      <div
        ref={bodyRef}
        aria-label="Comments"
        aria-busy={phase === 'loading' || sending}
        className="grid content-start gap-2"
      >
        {phase === 'loading' && strategy === 'spinner' && (
          <div role="status" className="grid h-24 place-items-center text-muted">
            <Loader2 aria-label="Loading comments" size={22} className="animate-spin" />
          </div>
        )}
        {phase === 'loading' && strategy === 'skeleton' && (
          <ul className="grid gap-2" aria-label="Loading comments">
            {rows.map((comment) => (
              <SkeletonRow key={comment.id} />
            ))}
          </ul>
        )}
        {phase !== 'loading' && (
          <ul className="grid gap-2">
            {showPlaceholder && <SkeletonRow />}
            {rows.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </ul>
        )}
      </div>

      {phase === 'refreshing' && (
        <p role="status" className="font-mono text-[0.76rem] text-muted">
          Refreshing in the background. The list stays on screen.
        </p>
      )}
      {error && (
        <p role="alert" className="text-[0.86rem] tone-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function ms(value: number | null | undefined): string {
  if (value === undefined) return '-';
  if (value === null) return 'never';
  return `${Math.round(value)} ms`;
}

function px(value: number | undefined): string {
  return value === undefined ? '-' : `${Math.round(value)} px`;
}

export function LoadingThreeWaysLab() {
  const [strategy, setStrategy] = useState<Strategy>('spinner');
  const [delayMs, setDelayMs] = useState(1200);
  const [fails, setFails] = useState(false);
  const [readings, setReadings] = useState<Readings>(emptyReadings);
  const [latest, setLatest] = useState<{ strategy: Strategy; reading: Reading } | null>(null);

  function record(from: Strategy, kind: Kind, reading: Reading) {
    setReadings((current) => ({ ...current, [from]: { ...current[from], [kind]: reading } }));
    setLatest({ strategy: from, reading });
  }

  const active = strategies.find((item) => item.id === strategy);
  const shown = latest?.strategy === strategy ? latest.reading : null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Loading strategy" className="kit-seg">
          {strategies.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={strategy === item.id}
              onClick={() => setStrategy(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Server delay" className="kit-seg">
          {delays.map((item) => (
            <button
              key={item.ms}
              type="button"
              aria-pressed={delayMs === item.ms}
              onClick={() => setDelayMs(item.ms)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[0.86rem]">
          <input type="checkbox" checked={fails} onChange={(e) => setFails(e.target.checked)} />
          Server fails
        </label>
      </div>

      <p className="text-[0.88rem] text-muted">{active?.summary}</p>

      <div className="kit-stage">
        <CommentsPanel
          key={strategy}
          strategy={strategy}
          delayMs={delayMs}
          fails={fails}
          onReading={record}
        />
      </div>

      <Meter
        label="Wait before your content shows (latest run, this strategy)"
        value={shown?.content != null ? Math.round(shown.content) : 0}
        max={2500}
        unit="ms"
        thresholds={{ warn: 100, bad: 1000 }}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-left text-[0.84rem]">
          <caption className="sr-only">Measured readings for each strategy</caption>
          <thead>
            <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Strategy
              </th>
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Action
              </th>
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Feedback
              </th>
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Content
              </th>
              <th scope="col" className="py-1.5 font-medium">
                Layout jump
              </th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {strategies.flatMap((item) =>
              (['load', 'post'] as const).map((kind) => {
                const reading = readings[item.id][kind];
                return (
                  <tr
                    key={`${item.id}-${kind}`}
                    data-active={item.id === strategy ? 'true' : undefined}
                    className={cn(
                      'border-b border-line',
                      item.id === strategy ? 'bg-surface' : 'text-muted',
                    )}
                  >
                    <th scope="row" className="py-1.5 pr-3 font-medium">
                      {kind === 'load' ? item.label : ''}
                    </th>
                    <td className="py-1.5 pr-3">{kind === 'load' ? 'Reload' : 'Post'}</td>
                    <td className="py-1.5 pr-3">{ms(reading?.feedback)}</td>
                    <td className="py-1.5 pr-3">
                      {ms(reading?.content)}
                      {reading?.rolledBack && <span className="ml-1.5 tone-bad">rolled back</span>}
                    </td>
                    <td className="py-1.5">{px(reading?.jump)}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>

      <CodePeek code={code} title="The optimistic version" />
    </div>
  );
}
