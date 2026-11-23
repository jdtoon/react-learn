import { Heart, LoaderCircle, Send } from 'lucide-react';
import { useActionState, useOptimistic, useState, useSyncExternalStore } from 'react';
import { useFormStatus } from 'react-dom';
import { simulateRequest } from '../../kit';
import { cn } from '../../kit/cn';

type ServerMode = 'healthy' | 'slow' | 'flaky' | 'down';

interface ModeSpec {
  label: string;
  latencyMs: number;
  failRate: number;
  hint: string;
}

const modes: Record<ServerMode, ModeSpec> = {
  healthy: { label: 'Healthy', latencyMs: 700, failRate: 0, hint: '700 ms, never fails' },
  slow: { label: 'Slow', latencyMs: 2200, failRate: 0, hint: '2.2 s, never fails' },
  flaky: { label: 'Flaky', latencyMs: 900, failRate: 0.5, hint: '900 ms, fails half the time' },
  down: { label: 'Down', latencyMs: 900, failRate: 1, hint: '900 ms, always fails' },
};

const minCommentLength = 3;

const modeOrder: ServerMode[] = ['healthy', 'slow', 'flaky', 'down'];

interface Comment {
  id: string;
  text: string;
  pending?: boolean;
}

interface LikeState {
  liked: boolean;
  likes: number;
  error: string | null;
}

interface CommentState {
  comments: Comment[];
  draft: string;
  error: string | null;
}

const initialLike: LikeState = { liked: false, likes: 12, error: null };

const initialComments: CommentState = {
  comments: [{ id: 'c1', text: 'Congratulations on the launch' }],
  draft: '',
  error: null,
};

function createServer() {
  let likes = initialLike.likes;
  let liked = initialLike.liked;
  let comments = initialComments.comments;
  let nextId = 2;

  async function hit(mode: ServerMode) {
    const spec = modes[mode];
    await simulateRequest({ value: null, latencyMs: spec.latencyMs, failRate: spec.failRate });
  }

  return {
    async setLiked(next: boolean, mode: ServerMode) {
      await hit(mode);
      liked = next;
      likes += next ? 1 : -1;
      return { liked, likes };
    },
    async addComment(text: string, mode: ServerMode) {
      await hit(mode);
      comments = [...comments, { id: `c${nextId}`, text }];
      nextId += 1;
      return comments;
    },
  };
}

type Tone = 'info' | 'good' | 'bad';

interface LogLine {
  id: number;
  at: number;
  text: string;
  tone: Tone;
}

function createLog() {
  let lines: LogLine[] = [];
  let startedAt = performance.now();
  let counter = 0;
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => lines,
    push(text: string, tone: Tone = 'info') {
      if (lines.length === 0) startedAt = performance.now();
      counter += 1;
      lines = [
        { id: counter, at: Math.round(performance.now() - startedAt), text, tone },
        ...lines,
      ].slice(0, 14);
      emit();
    },
    clear() {
      lines = [];
      emit();
    },
  };
}

type Log = ReturnType<typeof createLog>;
type Server = ReturnType<typeof createServer>;

interface Controls {
  server: Server;
  log: Log;
  mode: ServerMode;
  optimistic: boolean;
}

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="kit-btn" disabled={pending}>
      {pending ? (
        <LoaderCircle aria-hidden="true" size={15} className="animate-spin" />
      ) : (
        <Send aria-hidden="true" size={15} />
      )}
      {pending ? busy : idle}
    </button>
  );
}

function StatusReadout({
  isPending,
  confirmed,
  shown,
}: {
  isPending: boolean;
  confirmed: number;
  shown: number;
}) {
  const { pending, data } = useFormStatus();
  const submitting = pending ? JSON.stringify(data?.get('text') ?? '') : 'null';
  const rows: [string, string][] = [
    ['isPending (useActionState, in the form owner)', String(isPending)],
    ['pending (useFormStatus, in a child)', String(pending)],
    ["data.get('text') (useFormStatus)", submitting],
    ['confirmed comments (action state)', String(confirmed)],
    ['shown comments (useOptimistic)', String(shown)],
  ];

  return (
    <dl
      aria-label="Pending state"
      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[0.76rem]"
    >
      {rows.map(([name, value]) => (
        <div key={name} className="contents">
          <dt className="text-muted">{name}</dt>
          <dd
            data-field={name.split(' ')[0]}
            className={cn(
              'text-right tabular-nums',
              value === 'true' && 'tone-warn',
              value === 'false' && 'text-faint',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LikeForm({ server, log, mode, optimistic }: Controls) {
  const [state, likeAction, isPending] = useActionState(
    async (previous: LikeState): Promise<LikeState> => {
      const next = !previous.liked;
      log.push(next ? 'Like submitted' : 'Unlike submitted');
      try {
        const saved = await server.setLiked(next, mode);
        log.push(`Server confirmed: ${saved.likes} likes`, 'good');
        return { liked: saved.liked, likes: saved.likes, error: null };
      } catch {
        log.push('Server failed. The optimistic value is discarded', 'bad');
        return { ...previous, error: 'Could not save your like. The count is back where it was.' };
      }
    },
    initialLike,
  );

  const [shown, setOptimistic] = useOptimistic(state, (current, liked: boolean): LikeState => ({
    ...current,
    liked,
    likes: current.likes + (liked ? 1 : -1),
  }));

  function submit() {
    if (optimistic) setOptimistic(!shown.liked);
    likeAction();
  }

  return (
    <form action={submit} className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" aria-pressed={shown.liked} aria-busy={isPending} className="kit-btn">
          <Heart
            aria-hidden="true"
            size={15}
            fill={shown.liked ? 'currentColor' : 'none'}
            className={shown.liked ? 'text-bad' : undefined}
          />
          {shown.liked ? 'Liked' : 'Like'}
        </button>
        <p aria-label="Likes" className="font-mono text-[0.82rem] tabular-nums text-muted">
          <b data-field="likes" className="font-medium text-fg">{`${shown.likes} likes`}</b>
          {`  (confirmed ${state.likes})`}
        </p>
      </div>
      {state.error && (
        <p role="alert" className="tone-bad text-[0.84rem]">
          {state.error}
        </p>
      )}
    </form>
  );
}

function readComment(formData: FormData): string {
  return String(formData.get('text') ?? '').trim();
}

function CommentForm({ server, log, mode, optimistic }: Controls) {
  const [state, saveAction, isPending] = useActionState(
    async (previous: CommentState, formData: FormData): Promise<CommentState> => {
      const text = readComment(formData);
      if (text.length < minCommentLength) {
        log.push('Rejected before sending: fewer than 3 characters', 'bad');
        return { ...previous, draft: text, error: 'Write at least 3 characters.' };
      }
      log.push(`Comment "${text}" submitted`);
      try {
        const comments = await server.addComment(text, mode);
        log.push('Server confirmed the comment', 'good');
        return { comments, draft: '', error: null };
      } catch {
        log.push('Server failed. The optimistic comment is discarded', 'bad');
        return {
          ...previous,
          draft: text,
          error: 'Could not post your comment. Your text is back in the box.',
        };
      }
    },
    initialComments,
  );

  const [shown, addOptimistic] = useOptimistic(
    state.comments,
    (current, text: string): Comment[] => [
      ...current,
      { id: `optimistic-${current.length}`, text, pending: true },
    ],
  );

  function submit(formData: FormData) {
    const text = readComment(formData);
    if (optimistic && text.length >= minCommentLength) addOptimistic(text);
    saveAction(formData);
  }

  return (
    <form action={submit} className="grid gap-3">
      <ul aria-label="Comments" className="grid gap-1.5">
        {shown.map((comment) => (
          <li
            key={comment.id}
            data-pending={comment.pending ? 'true' : undefined}
            className={cn(
              'flex items-baseline justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-1.5 text-[0.88rem]',
              comment.pending && 'border-dashed text-muted',
            )}
          >
            <span className="min-w-0 break-words">{comment.text}</span>
            {comment.pending && (
              <span className="shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.08em] tone-warn">
                Sending
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-start gap-2">
        <input
          type="text"
          name="text"
          aria-label="Comment"
          placeholder="Add a comment"
          defaultValue={state.draft}
          className="h-9 min-w-0 flex-1 basis-48 rounded-lg border border-line bg-bg px-3 text-[0.9rem] placeholder:text-faint"
        />
        <SubmitButton idle="Post" busy="Posting" />
      </div>
      {state.error && (
        <p role="alert" className="tone-bad text-[0.84rem]">
          {state.error}
        </p>
      )}
      <StatusReadout isPending={isPending} confirmed={state.comments.length} shown={shown.length} />
    </form>
  );
}

function EventLog({ log }: { log: Log }) {
  const lines = useSyncExternalStore(log.subscribe, log.getSnapshot);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Event log</p>
        <button type="button" className="text-[0.78rem] text-muted underline" onClick={log.clear}>
          Clear
        </button>
      </div>
      <ol
        aria-label="Event log"
        className="grid min-h-[7.5rem] content-start gap-0.5 rounded-lg border border-line bg-bg p-2 font-mono text-[0.76rem]"
      >
        {lines.length === 0 && (
          <li className="text-faint">Nothing yet. Press Like or post a comment.</li>
        )}
        {lines.map((line) => (
          <li key={line.id} className="flex gap-3">
            <span className="w-14 shrink-0 text-right tabular-nums text-faint">{`${line.at} ms`}</span>
            <span
              className={cn(
                'min-w-0 break-words',
                line.tone === 'good' && 'tone-ok',
                line.tone === 'bad' && 'tone-bad',
              )}
            >
              {line.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Demo({ mode, optimistic }: { mode: ServerMode; optimistic: boolean }) {
  const [server] = useState(createServer);
  const [log] = useState(createLog);
  const controls: Controls = { server, log, mode, optimistic };

  return (
    <div className="grid gap-4">
      <article className="grid gap-3 rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-0.5">
          <p className="font-display font-semibold">Ada Lovelace</p>
          <p className="text-[0.9rem] text-muted">Shipped the billing migration this morning.</p>
        </div>
        <LikeForm {...controls} />
        <CommentForm {...controls} />
      </article>
      <EventLog log={log} />
    </div>
  );
}

export function OptimisticLab() {
  const [mode, setMode] = useState<ServerMode>('healthy');
  const [optimistic, setOptimistic] = useState(true);
  const [generation, setGeneration] = useState(0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Server behaviour" className="kit-seg">
          {modeOrder.map((id) => (
            <button key={id} type="button" aria-pressed={id === mode} onClick={() => setMode(id)}>
              {modes[id].label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[0.78rem] text-muted">{modes[mode].hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={optimistic}
            onChange={(event) => setOptimistic(event.target.checked)}
          />
          Optimistic updates
        </label>
        <button
          type="button"
          className="kit-btn"
          onClick={() => setGeneration((value) => value + 1)}
        >
          Reset demo
        </button>
      </div>
      <Demo key={generation} mode={mode} optimistic={optimistic} />
    </div>
  );
}
