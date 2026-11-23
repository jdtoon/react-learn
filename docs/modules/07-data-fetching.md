> Generated from the app's content. Edit `apps/course/src/modules/07-data-fetching/content.ts`.

# 07. Data fetching, Suspense & errors

**Architecture** · Module 07 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/07-data-fetching)

**The one idea:** Where you start a fetch decides your waterfalls. Suspense and error boundaries decide what users see meanwhile.

## After this you can

- Predict time to content for effect, hoisted, route-level and cached fetching from the request dependencies
- Place Suspense and error boundaries so a slow or failing section stays contained
- Explain stale-while-revalidate and why a promise must not be created during render

## The model

### Where the fetch starts

A fetch inside `useEffect` starts only after its component has rendered and committed. If that component renders only after the data of its parent arrived, requests run one after another: a **waterfall**. Effects also race, refetch on every mount and leave nothing cached. Start fetches earlier and together instead: in a loader or Server Component, at the route, or from an event handler, then render with what is already in flight (**render-as-you-fetch**). Where one request genuinely needs the result of another, change the API shape.

### Server-state caches

TanStack Query and SWR keep fetched data in a cache keyed by query. They share one in-flight request between identical queries, show cached data at once and refetch in the background (**stale-while-revalidate**), retry, and invalidate after a mutation. `staleTime` says how long data counts as fresh. Freshness is a product decision per query, not one global default.

### Suspense and use()

`use(promise)` reads a promise during render and suspends the component until it settles, and the nearest `<Suspense>` shows its fallback meanwhile. Create the promise outside the component, in a cache, a loader or a Server Component, because one created during render is new every time. Boundary placement is design. One high boundary means one spinner and nothing until the slowest request ends. Boundaries per section let each part appear as it arrives. A `startTransition` keeps already visible content instead of re-showing a fallback.

### Error boundaries

A rejected promise read through `use()`, or a throw during render, goes to the nearest error boundary: a class component or a wrapper such as `react-error-boundary`. It does not catch errors in plain event handlers. Place one where a failure should be contained: around a widget for local recovery, around a route for a page-level message. Every fallback needs a retry.

## Labs

The labs run in the app. Each one below links to the live version.

### Waterfall simulator

Try this:

- Pick **Effect per component** and raise the latency slider. Each request waits for the one before it, so time to content is the sum
- Switch to **Hoist and wait for all**, then **Render as you fetch**. The requests overlap and the first content arrives earlier
- Tick **Comments need the post ids** under each strategy. No strategy can start that request early
- Pick **Warm cache** and compare first content with fresh data

[Open the live lab](https://jdtoon.github.io/react-learn/modules/07-data-fetching#lab-waterfall-sim)

### Where do the boundaries go?

Try this:

- Choose **One around the page** and press **Reload page**. The header has no data, yet it appears only when the slowest section does
- Switch to **One per section**. Each section appears as it arrives and the header is there at once
- Tick **Comments request fails** with the error boundary **Around the page**, then switch it to **Around the widget**
- With the failure showing, untick **Comments request fails** and press **Retry**. Only the comments reload

[Open the live lab](https://jdtoon.github.io/react-learn/modules/07-data-fetching#lab-boundary-placement)

## Pitfalls

### Fetching in effects down a component tree

- **Symptom:** Spinners appear one after another, and the page takes the sum of its request times to settle
- **Cause:** A child mounts only after its parent has data, so its effect, and its request, starts late even when it needs nothing from the parent
- **Fix:** Start independent requests together at the route or in a loader, and pass the results or promises down

Bad:

```tsx
function Page() {
  const user = useUser();
  return user ? <Feed /> : <Spinner />;
}

function Feed() {
  const posts = usePosts();
  return posts ? <List posts={posts} /> : <Spinner />;
}
```

Good:

```tsx
const userPromise = fetchUser();
const postsPromise = fetchPosts();

<Page user={userPromise} posts={postsPromise} />
```

### Creating the promise during render

- **Symptom:** A component suspends again and again, or the same request fires on every render
- **Cause:** A promise created in render is a new object each time, so React never sees one settle for the component it is waiting on
- **Fix:** Create the promise in a loader, a cache or a Server Component and pass it in, then read it with `use()`

Bad:

```tsx
function Profile({ id }) {
  const user = use(fetchUser(id));
  return <h1>{user.name}</h1>;
}
```

Good:

```tsx
function Profile({ userPromise }) {
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}
```

### One Suspense boundary for the whole page

- **Symptom:** The whole screen, including static parts such as the header, stays blank until the slowest request finishes
- **Cause:** A boundary reveals its content only when everything inside has resolved, so every section waits for the slowest
- **Fix:** Give each independently useful section its own boundary and a fallback of matching size

### No error boundary, or only one at the root

- **Symptom:** One failing widget replaces the whole app with an error screen, or React unmounts the tree entirely
- **Cause:** An error thrown during render is handled by the nearest boundary above it, and the root is often the only one
- **Fix:** Wrap each section that can fail in its own boundary with a retry, and keep a route-level one for the rest

## In the meeting

**Say**

- Where does this fetch start? If it starts in a component that renders only after its parent has data, we have a waterfall.
- Start requests at the route or in a loader and render with what is in flight. Suspense decides what users see meanwhile.
- Server state belongs in a cache: shared in-flight requests, stale-while-revalidate and invalidation. `staleTime` is a per-query product decision.
- Boundaries are UX. Suspense places loading states, error boundaries contain failure, and both sit near the thing that can fail.

**Ask**

- Which of these requests truly depend on each other, and which are serial only because of the component structure?
- How stale can this data be before users notice, and what invalidates it?
- What does the user see if this widget fails, and can they retry without reloading the page?
- Is this promise created during render, or somewhere stable?

**Red flags**

- `useEffect` plus `useState` for `data`, `loading` and `error` in every component
- A child that fetches only after its parent has data it does not use
- A single Suspense boundary or error boundary at the root of the app
- `use(fetch(...))` called inside the component that renders
- An error fallback with no retry

**Trade-off:** Fetching early and in parallel cuts time to content but moves data requirements up the tree and couples routes to data, and a cache adds staleness you must choose per query.

## Self-check

1. `Layout` fetches the user in an effect and renders `Feed`, which fetches posts in its own effect. Each takes 300 ms. When does the feed appear, and what would you change?

   <details>
   <summary>Answer</summary>

   At about 600 ms plus render gaps, because Feed mounts only after Layout has data. Start both requests together at the route or in a loader and render with the promises, so the feed appears at about 300 ms. If posts truly needed the user id, change the API so one request returns both.

   </details>

2. A component calls `use(fetchPosts())` directly. What happens?

   <details>
   <summary>Answer</summary>

   It creates a new promise on every render, so React never sees one settle and the component suspends again, possibly in a loop. Create the promise outside render, in a cache, a loader or a Server Component, and pass it in.

   </details>

3. Where does the error from a rejected promise read with `use()` go, and does the same boundary catch a failing click handler?

   <details>
   <summary>Answer</summary>

   To the nearest error boundary above the component that read it. A plain click handler is not caught, because boundaries handle errors thrown during render; handle those in the handler or set state.

   </details>

## Go deeper

- [use](https://react.dev/reference/react/use)
- [Suspense](https://react.dev/reference/react/Suspense)
- [Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [TanStack Query: important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
