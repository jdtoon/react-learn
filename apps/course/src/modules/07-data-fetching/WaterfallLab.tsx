import { useState } from 'react';
import { CodePeek, Meter, Waterfall, type WaterfallRequest } from '../../kit';

type Strategy = 'effects' | 'hoisted' | 'route' | 'cache';

interface Plan {
  requests: WaterfallRequest[];
  first: number;
  all: number;
  fresh: number;
}

const gap = 40;

const strategies: { id: Strategy; label: string; note: string; code: string }[] = [
  {
    id: 'effects',
    label: 'Effect per component',
    note: 'Each component fetches after it renders and shows its child only once it has data, so the requests queue. A 40 ms gap covers render, commit and effect before each fetch starts.',
    code: 'function Feed() {\n  const [posts, setPosts] = useState(null);\n  useEffect(() => {\n    fetchPosts().then(setPosts);\n  }, []);\n  return posts ? <Comments posts={posts} /> : <Spinner />;\n}',
  },
  {
    id: 'hoisted',
    label: 'Hoist and wait for all',
    note: 'One parent starts every request together and shows nothing until the last one lands.',
    code: 'useEffect(() => {\n  Promise.all([fetchUser(), fetchPosts(), fetchComments()]).then(setData);\n}, []);',
  },
  {
    id: 'route',
    label: 'Render as you fetch',
    note: 'A loader starts every request before any component renders. Each section has its own Suspense boundary and appears when its data lands.',
    code: 'const loader = () => ({\n  user: fetchUser(),\n  posts: fetchPosts(),\n  comments: fetchComments(),\n});\n\n<Suspense fallback={<FeedSkeleton />}>\n  <Feed postsPromise={posts} />\n</Suspense>',
  },
  {
    id: 'cache',
    label: 'Warm cache',
    note: 'The query cache already holds data from an earlier visit. It shows that at once and revalidates all three requests in the background.',
    code: 'const { data } = useQuery({\n  queryKey: ["posts"],\n  queryFn: fetchPosts,\n  staleTime: 0,\n});',
  },
];

function nearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

function plan(strategy: Strategy, latency: number, dependent: boolean): Plan {
  const userMs = latency;
  const postsMs = nearest10(latency * 1.5);
  const commentsMs = latency * 2;
  const make = (id: string, start: number, ms: number): WaterfallRequest => ({
    id,
    label: `GET /api/${id}`,
    start,
    end: start + ms,
  });

  if (strategy === 'effects') {
    const user = make('user', gap, userMs);
    const posts = make('posts', user.end + gap, postsMs);
    const comments = make('comments', posts.end + gap, commentsMs);
    return {
      requests: [user, posts, comments],
      first: user.end,
      all: comments.end,
      fresh: comments.end,
    };
  }

  const start = strategy === 'route' ? 0 : gap;
  const user = make('user', start, userMs);
  const posts = make('posts', start, postsMs);
  const comments = make(
    'comments',
    dependent && strategy !== 'cache' ? posts.end : start,
    commentsMs,
  );
  const requests = [user, posts, comments];
  const ends = requests.map((request) => request.end);
  const last = Math.max(...ends);

  if (strategy === 'hoisted') return { requests, first: last, all: last, fresh: last };
  if (strategy === 'route') return { requests, first: Math.min(...ends), all: last, fresh: last };
  return {
    requests: requests.map((request) => ({ ...request, label: `${request.label} (background)` })),
    first: 0,
    all: 0,
    fresh: last,
  };
}

export function WaterfallLab() {
  const [strategy, setStrategy] = useState<Strategy>('effects');
  const [latency, setLatency] = useState(200);
  const [dependent, setDependent] = useState(false);
  const current = strategies.find((item) => item.id === strategy) ?? strategies[0];
  const result = plan(strategy, latency, dependent);
  const axis = Math.ceil(plan('effects', latency, dependent).all / 50) * 50;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="group" aria-label="Fetch strategy" className="kit-seg">
          {strategies.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === strategy}
              onClick={() => setStrategy(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">{`Typical request latency: ${latency} ms`}</span>
          <input
            type="range"
            min={100}
            max={600}
            step={50}
            value={latency}
            onChange={(event) => setLatency(Number(event.target.value))}
            className="w-56 max-w-full accent-(--accent)"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
          <input
            type="checkbox"
            className="kit-check mt-0"
            checked={dependent}
            onChange={(event) => setDependent(event.target.checked)}
          />
          Comments need the post ids
        </label>
      </div>

      {current && <p className="max-w-[68ch] text-[0.88rem] text-muted">{current.note}</p>}

      <Waterfall requests={result.requests} total={axis} />

      <div className="grid gap-3">
        <Meter
          label="First content on screen"
          value={result.first}
          max={3000}
          unit="ms"
          thresholds={{ warn: 1000, bad: 2000 }}
        />
        <Meter
          label="All content on screen"
          value={result.all}
          max={3000}
          unit="ms"
          thresholds={{ warn: 1000, bad: 2000 }}
        />
        <Meter
          label="Fresh data on screen"
          value={result.fresh}
          max={3000}
          unit="ms"
          thresholds={{ warn: 1000, bad: 2000 }}
        />
      </div>

      {current && <CodePeek title="What the code looks like" code={current.code} />}
    </div>
  );
}
