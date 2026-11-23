import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '07-data-fetching',
  number: 7,
  title: 'Data fetching, Suspense & errors',
  track: 'architecture',
  oneIdea:
    'Where you start a fetch decides your waterfalls. Suspense and error boundaries decide what users see meanwhile.',
  minutes: 12,
  phase: 3,
  outcomes: [
    'Predict time to content for effect, hoisted, route-level and cached fetching from the request dependencies',
    'Place Suspense and error boundaries so a slow or failing section stays contained',
    'Explain stale-while-revalidate and why a promise must not be created during render',
  ],
  sections: [
    {
      heading: 'Where the fetch starts',
      paragraphs: [
        'A fetch inside `useEffect` starts only after its component has rendered and committed. If that component renders only after the data of its parent arrived, requests run one after another: a **waterfall**. Effects also race, refetch on every mount and leave nothing cached. Start fetches earlier and together instead: in a loader or Server Component, at the route, or from an event handler, then render with what is already in flight (**render-as-you-fetch**). Where one request genuinely needs the result of another, change the API shape.',
      ],
    },
    {
      heading: 'Server-state caches',
      paragraphs: [
        'TanStack Query and SWR keep fetched data in a cache keyed by query. They share one in-flight request between identical queries, show cached data at once and refetch in the background (**stale-while-revalidate**), retry, and invalidate after a mutation. `staleTime` says how long data counts as fresh. Freshness is a product decision per query, not one global default.',
      ],
    },
    {
      heading: 'Suspense and use()',
      paragraphs: [
        '`use(promise)` reads a promise during render and suspends the component until it settles, and the nearest `<Suspense>` shows its fallback meanwhile. Create the promise outside the component, in a cache, a loader or a Server Component, because one created during render is new every time. Boundary placement is design. One high boundary means one spinner and nothing until the slowest request ends. Boundaries per section let each part appear as it arrives. A `startTransition` keeps already visible content instead of re-showing a fallback.',
      ],
    },
    {
      heading: 'Error boundaries',
      paragraphs: [
        'A rejected promise read through `use()`, or a throw during render, goes to the nearest error boundary: a class component or a wrapper such as `react-error-boundary`. It does not catch errors in plain event handlers. Place one where a failure should be contained: around a widget for local recovery, around a route for a page-level message. Every fallback needs a retry.',
      ],
    },
  ],
  labs: [
    {
      id: 'waterfall-sim',
      title: 'Waterfall simulator',
      tryThis: [
        'Pick **Effect per component** and raise the latency slider. Each request waits for the one before it, so time to content is the sum',
        'Switch to **Hoist and wait for all**, then **Render as you fetch**. The requests overlap and the first content arrives earlier',
        'Tick **Comments need the post ids** under each strategy. No strategy can start that request early',
        'Pick **Warm cache** and compare first content with fresh data',
      ],
      whatHappened:
        'With an effect per component, each fetch starts only after its parent has rendered with data, so the bars stack and time to content is the sum of the latencies. Starting every request together at the route makes the bars overlap, and time to content becomes the slowest request. Per-section Suspense then shows each part as its data lands, while a single gate waits for the slowest. A dependency between two requests is a floor that parallelism cannot remove: fix it in the API. A warm cache shows stale content at once and revalidates in the background, so first content is immediate and fresh data still arrives after the slowest request.',
    },
    {
      id: 'boundary-placement',
      title: 'Where do the boundaries go?',
      tryThis: [
        'Choose **One around the page** and press **Reload page**. The header has no data, yet it appears only when the slowest section does',
        'Switch to **One per section**. Each section appears as it arrives and the header is there at once',
        'Tick **Comments request fails** with the error boundary **Around the page**, then switch it to **Around the widget**',
        'With the failure showing, untick **Comments request fails** and press **Retry**. Only the comments reload',
      ],
      whatHappened:
        'A Suspense boundary reveals its content only when everything inside has resolved, so a boundary around the page ties every section, and the header, to the slowest request. Boundaries per section let each part appear when its own data lands. An error boundary works the same way for failure: the nearest one above the throwing component replaces its subtree, so one around the page loses the whole screen to a failing widget, while one around the widget keeps the rest and offers a retry. All requests start together here, so only the boundaries change what the user sees.',
    },
  ],
  pitfalls: [
    {
      title: 'Fetching in effects down a component tree',
      symptom:
        'Spinners appear one after another, and the page takes the sum of its request times to settle',
      cause:
        'A child mounts only after its parent has data, so its effect, and its request, starts late even when it needs nothing from the parent',
      fix: 'Start independent requests together at the route or in a loader, and pass the results or promises down',
      bad: 'function Page() {\n  const user = useUser();\n  return user ? <Feed /> : <Spinner />;\n}\n\nfunction Feed() {\n  const posts = usePosts();\n  return posts ? <List posts={posts} /> : <Spinner />;\n}',
      good: 'const userPromise = fetchUser();\nconst postsPromise = fetchPosts();\n\n<Page user={userPromise} posts={postsPromise} />',
    },
    {
      title: 'Creating the promise during render',
      symptom: 'A component suspends again and again, or the same request fires on every render',
      cause:
        'A promise created in render is a new object each time, so React never sees one settle for the component it is waiting on',
      fix: 'Create the promise in a loader, a cache or a Server Component and pass it in, then read it with `use()`',
      bad: 'function Profile({ id }) {\n  const user = use(fetchUser(id));\n  return <h1>{user.name}</h1>;\n}',
      good: 'function Profile({ userPromise }) {\n  const user = use(userPromise);\n  return <h1>{user.name}</h1>;\n}',
    },
    {
      title: 'One Suspense boundary for the whole page',
      symptom:
        'The whole screen, including static parts such as the header, stays blank until the slowest request finishes',
      cause:
        'A boundary reveals its content only when everything inside has resolved, so every section waits for the slowest',
      fix: 'Give each independently useful section its own boundary and a fallback of matching size',
    },
    {
      title: 'No error boundary, or only one at the root',
      symptom:
        'One failing widget replaces the whole app with an error screen, or React unmounts the tree entirely',
      cause:
        'An error thrown during render is handled by the nearest boundary above it, and the root is often the only one',
      fix: 'Wrap each section that can fail in its own boundary with a retry, and keep a route-level one for the rest',
    },
  ],
  meeting: {
    say: [
      'Where does this fetch start? If it starts in a component that renders only after its parent has data, we have a waterfall.',
      'Start requests at the route or in a loader and render with what is in flight. Suspense decides what users see meanwhile.',
      'Server state belongs in a cache: shared in-flight requests, stale-while-revalidate and invalidation. `staleTime` is a per-query product decision.',
      'Boundaries are UX. Suspense places loading states, error boundaries contain failure, and both sit near the thing that can fail.',
    ],
    ask: [
      'Which of these requests truly depend on each other, and which are serial only because of the component structure?',
      'How stale can this data be before users notice, and what invalidates it?',
      'What does the user see if this widget fails, and can they retry without reloading the page?',
      'Is this promise created during render, or somewhere stable?',
    ],
    redFlags: [
      '`useEffect` plus `useState` for `data`, `loading` and `error` in every component',
      'A child that fetches only after its parent has data it does not use',
      'A single Suspense boundary or error boundary at the root of the app',
      '`use(fetch(...))` called inside the component that renders',
      'An error fallback with no retry',
    ],
    tradeoff:
      'Fetching early and in parallel cuts time to content but moves data requirements up the tree and couples routes to data, and a cache adds staleness you must choose per query.',
  },
  selfCheck: [
    {
      question:
        '`Layout` fetches the user in an effect and renders `Feed`, which fetches posts in its own effect. Each takes 300 ms. When does the feed appear, and what would you change?',
      answer:
        'At about 600 ms plus render gaps, because Feed mounts only after Layout has data. Start both requests together at the route or in a loader and render with the promises, so the feed appears at about 300 ms. If posts truly needed the user id, change the API so one request returns both.',
    },
    {
      question: 'A component calls `use(fetchPosts())` directly. What happens?',
      answer:
        'It creates a new promise on every render, so React never sees one settle and the component suspends again, possibly in a loop. Create the promise outside render, in a cache, a loader or a Server Component, and pass it in.',
    },
    {
      question:
        'Where does the error from a rejected promise read with `use()` go, and does the same boundary catch a failing click handler?',
      answer:
        'To the nearest error boundary above the component that read it. A plain click handler is not caught, because boundaries handle errors thrown during render; handle those in the handler or set state.',
    },
  ],
  links: [
    { label: 'use', url: 'https://react.dev/reference/react/use' },
    { label: 'Suspense', url: 'https://react.dev/reference/react/Suspense' },
    {
      label: 'Catching rendering errors with an error boundary',
      url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
    },
    {
      label: 'TanStack Query: important defaults',
      url: 'https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults',
    },
  ],
  glossary: [
    {
      term: 'Waterfall',
      definition:
        'Requests that run one after another because each starts only after the previous one finished, so latencies add up.',
    },
    {
      term: 'Render-as-you-fetch',
      definition:
        'Starting requests before rendering, at the route or in a loader, then rendering with the promises already in flight.',
    },
    {
      term: 'Stale-while-revalidate',
      definition:
        'Showing cached data immediately while refetching in the background, then swapping in the fresh result.',
    },
    {
      term: 'staleTime',
      definition:
        'How long cached data counts as fresh. Within that window a query returns the cache without refetching.',
    },
    {
      term: 'Suspense boundary',
      definition:
        'A `<Suspense>` element that shows its fallback until every component beneath it that suspended has resolved.',
    },
    {
      term: 'Error boundary',
      definition:
        'A component that catches errors thrown while rendering its subtree and shows a fallback instead of unmounting the app.',
    },
  ],
};
