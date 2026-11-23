> Generated from the app's content. Edit `apps/course/src/modules/04-effects-and-refs/content.ts`.

# 04. Effects, refs & synchronisation

**Foundations** · Module 04 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/04-effects-and-refs)

**The one idea:** Effects are for syncing with systems outside React, not for reacting to your own state.

## After this you can

- Say which outside system an effect synchronises with, and when it starts and stops
- Replace an effect that derives state or handles an event with render logic or a handler
- Write or review a fetch effect so a late response cannot overwrite the current one

## The model

### Effects synchronise with the outside

An effect connects a component to something React does not control: a socket, a subscription, a timer, a non-React widget, the network. It runs after the commit. Each effect describes one process: how to start synchronising and how to stop.

### The lifecycle belongs to the effect

Think start and stop, not mount and update. The dependency array lists every reactive value the effect reads. When one changes, React runs the cleanup from the previous run with the old values, then setup with the new ones. An empty array means "synchronise once", not "silence the linter".

In development, StrictMode runs setup, cleanup, setup on mount to prove the cleanup works. That is a test of your code, not a bug.

### You might not need one

Do not use an effect to derive state from props or state, to answer a user event, or to reset state when a prop changes. Render logic, event handlers and `key` cover those, and each extra effect adds a render and a frame of stale UI.

For fetching, ignore stale responses or cancel them in cleanup, or use a data library or `use()` with Suspense. `useEffectEvent` lets an effect read the latest props or state without making them dependencies, for example when logging.

### Refs and layout effects

A ref is a box that React keeps across renders and that does not trigger a render when you change it. Use it for DOM nodes, timer ids and other values the screen does not draw. In React 19 `ref` is an ordinary prop on function components, and a ref callback may return a cleanup function.

`useLayoutEffect` runs before the browser paints. Use it to measure the DOM and adjust before the user sees a frame, and remember that it blocks painting.

## Labs

The labs run in the app. Each one below links to the live version.

### Effect lanes

Try this:

- Press **travel**. Read the new step: the cleanup for `general` runs first, then the setup for `travel`
- Type in the message draft. The render count climbs and the log stays still, because no dependency changed
- Tick **Depend on an object created during render** and type again. Every keystroke runs a cleanup and a setup
- Untick it, tick **Forget the cleanup function** and switch rooms. Open connections keep rising

[Open the live lab](https://jdtoon.github.io/react-learn/modules/04-effects-and-refs#lab-effect-lanes)

### Fetch race

Try this:

- With **No cleanup**, press **Run the race**. Grace answers first, Ada answers last and the panel ends on Ada
- Switch to **Ignore flag** and run it again. Ada still arrives last, and her response is dropped
- Switch to **AbortController** and run it again. Ada's request is cancelled as soon as Grace is selected

[Open the live lab](https://jdtoon.github.io/react-learn/modules/04-effects-and-refs#lab-fetch-race)

## Pitfalls

### Fetching without cleanup

- **Symptom:** Results belong to an older query or user, and the bug appears only on slow networks
- **Cause:** Responses return in any order and each one sets state. The last to arrive wins, not the last requested
- **Fix:** Cancel the request in cleanup, or ignore its response. A data library or Suspense with `use()` handles this for you

Bad:

```tsx
useEffect(() => {
  fetchResults(query).then(setResults);
}, [query]);
```

Good:

```tsx
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((data) => {
    if (!ignore) setResults(data);
  });
  return () => {
    ignore = true;
  };
}, [query]);
```

### An effect that only derives state

- **Symptom:** An extra render on every change and one frame of stale output
- **Cause:** The effect runs after the commit, so the screen paints with the old value first, then renders again with the copy
- **Fix:** Calculate the value while rendering. If a prop change should reset state, give the component a `key`

Bad:

```tsx
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(first + " " + last);
}, [first, last]);
```

Good:

```tsx
const fullName = first + " " + last;
```

### Silencing the dependency lint

- **Symptom:** An effect keeps using an old prop or state value, or an empty array hides a bug
- **Cause:** The effect reads a reactive value that is missing from the array, so it closes over a stale snapshot
- **Fix:** List the value. If that re-runs the effect too often, move the function inside it, or read the latest value with `useEffectEvent`

Bad:

```tsx
useEffect(() => {
  const id = setInterval(() => log(roomId), 1000);
  return () => clearInterval(id);
}, []);
```

Good:

```tsx
const onTick = useEffectEvent(() => log(roomId));

useEffect(() => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}, []);
```

### Setup without cleanup

- **Symptom:** Handlers fire twice, memory grows, or StrictMode in development shows doubled behaviour
- **Cause:** Each run adds a listener, subscription or timer and nothing removes it, so they pile up
- **Fix:** Return a function that undoes exactly what setup did

Bad:

```tsx
useEffect(() => {
  window.addEventListener("resize", onResize);
}, []);
```

Good:

```tsx
useEffect(() => {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);
```

### Reading a ref during render

- **Symptom:** The screen lags one update behind, or the value is null on first render
- **Cause:** Changing `ref.current` does not schedule a render, and React sets DOM refs only at commit. Render cannot rely on either
- **Fix:** Read refs in event handlers and effects. If the screen must show the value, keep it in state

Bad:

```tsx
function Box() {
  const ref = useRef(null);
  const width = ref.current.offsetWidth;
  return <div ref={ref}>{width}</div>;
}
```

Good:

```tsx
function Box() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    setWidth(ref.current.offsetWidth);
  }, []);
  return <div ref={ref}>{width}</div>;
}
```

## In the meeting

**Say**

- An effect is for synchronising with something outside React, such as a socket, a timer or a browser API. If it only moves data between our own state, it should not be an effect.
- Each effect describes one synchronisation: how to start and how to stop. React re-runs it when its dependencies change, so cleanup is part of the contract.
- StrictMode runs setup and cleanup once more in development to check that stopping works. That is a test, not a bug.
- For fetching, we cancel or ignore stale responses, or use a data library. A bare fetch in an effect gives us races and no cache.

**Ask**

- What outside system does this effect synchronise with, and how does it stop?
- Could this be calculated during render, handled in the event that caused it, or reset with a key?
- Why is each dependency there, and what happens when a late response arrives after the user has moved on?

**Red flags**

- An effect whose body is just `setX(f(y))`
- A fetch in an effect with no cleanup, `AbortController` or ignore flag
- A disable directive on the `exhaustive-deps` lint rule
- Effects chained together, each setting the state the next one watches
- `ref.current` read or written during render

**Trade-off:** Effects reach the outside world, so each one is code React cannot reason about and that must clean up after itself; moving logic into render, events and keys keeps it visible, at the cost of deciding where each rule belongs.

## Self-check

1. In development an effect that opens a connection logs "connect, disconnect, connect" on mount. Is that a bug, and what does it tell you?

   <details>
   <summary>Answer</summary>

   No. StrictMode runs setup, cleanup and setup again once to check that the effect can stop and restart cleanly. If it misbehaves, the cleanup is missing or incomplete. Production runs it once.

   </details>

2. A user clicks "Add to cart" and you need to post to the server. Effect or event handler, and why?

   <details>
   <summary>Answer</summary>

   Event handler. The cause is a specific user action, not the fact that the component rendered. An effect would also run for any re-render that changes its dependencies, and twice on mount in StrictMode. Effects fit synchronising with what is on screen, such as a connection for the current room.

   </details>

3. A search box fetches inside an effect with `[query]` as the dependency, and results sometimes belong to an older query. Why, and what are two fixes?

   <details>
   <summary>Answer</summary>

   Responses arrive in any order and the last to arrive wins, not the last requested. Cancel the previous request in cleanup with `AbortController`, or set an ignore flag so its response is dropped. A data library or `use()` with Suspense also handles it.

   </details>

## Go deeper

- [Synchronizing with effects](https://react.dev/learn/synchronizing-with-effects)
- [You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Lifecycle of reactive effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [Separating events from effects](https://react.dev/learn/separating-events-from-effects)
- [Referencing values with refs](https://react.dev/learn/referencing-values-with-refs)
