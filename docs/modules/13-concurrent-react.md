> Generated from the app's content. Edit `apps/course/src/modules/13-concurrent-react/content.ts`.

# 13. Concurrent React

**Performance** · Module 13 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/13-concurrent-react)

**The one idea:** Transitions let urgent updates (typing) interrupt expensive ones (filtering a huge list).

## After this you can

- Explain how React prioritises updates and why a transition render can be paused and restarted
- Choose between `useTransition` and `useDeferredValue`, and say what each needs from the slow subtree
- Use `<Activity>` to keep a tab alive, and state what happens to its effects while it is hidden

## The model

### Priorities, not parallelism

Concurrent React is not multithreading. It is a renderer that can pause. Updates carry a priority: typing and clicking are urgent, and an update marked as a **transition** is not. React renders the urgent update first and commits it, then works through the transition in time slices of about 5 ms, checking between components for anything more urgent.

If a keystroke arrives mid-render, React abandons the stale transition render and restarts with the newest state. Nothing is committed half finished.

### Two tools, one idea

`useTransition` gives you `startTransition` to wrap a state update, plus an `isPending` flag. Use it when you own the setter. `useDeferredValue(value)` returns a copy that lags during urgent renders and catches up in the background. Use it when the value arrives from props or a hook you do not control.

Both need a slow subtree React can skip. If the list is not memoised, it re-renders on the urgent pass anyway and nothing is gained. Slicing happens between components, so one component that takes 200 ms cannot be split. Transitions also keep revealed Suspense content on screen instead of falling back to a spinner.

### Activity

`<Activity mode="hidden">` hides a subtree with CSS and keeps its state and DOM. It cleans up the subtree's effects as if it had unmounted, and renders it at low priority. Use it for tabs, wizards and drawers people revisit, or to pre-render the likely next screen. Conditional rendering throws all of that away.

Hidden trees cost memory, and their effects stop, so never rely on one running while hidden.

## Labs

The labs run in the app. Each one below links to the live version.

### Jank meter

Try this:

- In **Blocking** with a heavy list, press **Type "transition" for me**. Each keystroke waits for the whole list, so the bars climb into the red
- Switch to **useTransition** and type again. The input stays quick, the list lags behind the text and dims, and it catches up once you stop
- Try **useDeferredValue**. It gives the same result with no setter to wrap
- Untick **Wrap the list in memo** in a non-blocking mode and type again. The benefit disappears, because the list re-renders on every urgent pass

[Open the live lab](https://jdtoon.github.io/react-learn/modules/13-concurrent-react#lab-jank-meter)

### Tabs that keep state

Try this:

- In **Unmount on switch**, type in **Compose**, open **Timer** for a few seconds, then return to **Compose**. The draft is gone. The log shows the timer cleaned up and started again from zero
- Switch to **Activity, hidden** and repeat. The draft survives and the timer resumes from where it stopped, although the log still shows its effect cleaned up and set up again
- Open **Catalogue** in each mode and compare the switch time, then leave and return

[Open the live lab](https://jdtoon.github.io/react-learn/modules/13-concurrent-react#lab-activity-tabs)

## Pitfalls

### A slow child that is not memoised

- **Symptom:** The transition or deferred value is in place, yet typing is as laggy as before
- **Cause:** The urgent render still re-renders the slow list with the old value, because without `memo` a child follows its parent. The background render is not what hurts
- **Fix:** Wrap the slow component in `memo` and pass it only the transitioned or deferred value, or enable the Compiler, which does this for you

Bad:

```tsx
function Search({ items }) {
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <SlowList items={items} query={deferred} />
    </>
  );
}
```

Good:

```tsx
const SlowList = memo(function SlowList({ items, query }) {
  return <List items={items} query={query} />;
});
```

### Putting the input itself in the transition

- **Symptom:** Characters appear late or jump back while typing in a controlled input
- **Cause:** A transition is low priority by design, so the text echo waits behind other work. Controlled inputs need their value updated urgently
- **Fix:** Keep the input state urgent and transition only the state that drives the expensive render

Bad:

```tsx
startTransition(() => setText(e.target.value));
```

Good:

```tsx
setText(e.target.value);
startTransition(() => setQuery(e.target.value));
```

### Expecting a transition to make slow code fast

- **Symptom:** A transition is added, the page feels smoother, and the CPU profile is unchanged
- **Cause:** A transition reorders and slices work. It does not remove it, and an interrupted render may be thrown away and repeated. One component that renders for 200 ms cannot be sliced at all
- **Fix:** Reduce the work first with windowing, memoisation or moving it off the main thread, then use a transition for what remains

### Relying on effects in a hidden Activity

- **Symptom:** A feed stops polling, a socket closes or an analytics timer pauses when its tab is hidden
- **Cause:** A hidden Activity cleans up its effects as if the component had unmounted, and sets them up again when it becomes visible
- **Fix:** Keep subscriptions that must outlive the tab above the Activity boundary, or accept the pause and refresh on return

## In the meeting

**Say**

- Concurrent React is about priority, not threads. Rendering can pause and restart, so an urgent update like typing is not queued behind a slow one.
- Transition the update that causes the slow render, never the input itself. The input stays urgent.
- `useDeferredValue` is the same idea when we cannot wrap the setter. It only helps if the slow child is memoised.
- `<Activity>` hides a tab and keeps its state, but it cleans up that tab's effects while hidden.

**Ask**

- What exactly is slow: many components, or one component with an expensive render? A transition only helps with the first.
- Is the slow child memoised, or does it re-render on every keystroke anyway?
- What does the user see while the update is pending: the old content, a dimmed list, a skeleton?
- Do any effects in the hidden tab need to keep running?

**Red flags**

- `startTransition` wrapped around the state of a controlled input
- `useDeferredValue` feeding a slow child that is not memoised
- A transition used to hide an expensive render rather than measuring and reducing it
- A hidden tab expected to keep polling or holding a connection open

**Trade-off:** Transitions keep input responsive but the result arrives later, may be rendered more than once and shows stale UI meanwhile. Activity trades memory and background render work for instant tab switches that keep state.

## Self-check

1. A search box filters 5,000 rows. You wrap `setQuery` in `startTransition` and the input still stutters. Name two likely causes.

   <details>
   <summary>Answer</summary>

   The list is not memoised, so it re-renders on the urgent pass with the old query. Or the cost sits in one component, which cannot be sliced. A third possibility is that the input value itself is inside the transition.

   </details>

2. When do you pick `useDeferredValue` over `useTransition`?

   <details>
   <summary>Answer</summary>

   When you do not own the setter, for example the value arrives as a prop or from a hook. `useTransition` wraps the update where you call it and gives `isPending`. Both give an urgent render with the old value first, then an interruptible render with the new one.

   </details>

3. A tab is hidden with `<Activity mode="hidden">`. What happens to its state, its DOM and its effects?

   <details>
   <summary>Answer</summary>

   State and DOM are kept, and the DOM is hidden with CSS. Effects are cleaned up as if the component had unmounted, and run again when it becomes visible. It can still re-render, at low priority.

   </details>

## Go deeper

- [useTransition](https://react.dev/reference/react/useTransition)
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [Activity](https://react.dev/reference/react/Activity)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Interaction to Next Paint (INP)](https://web.dev/articles/inp)
