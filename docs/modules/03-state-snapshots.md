> Generated from the app's content. Edit `apps/course/src/modules/03-state-snapshots/content.ts`.

# 03. State & the snapshot model

**Foundations** · Module 03 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/03-state-snapshots)

**The one idea:** State is a snapshot per render. Setting it schedules a new render; it does not change a variable.

## After this you can

- Predict which value a handler, timer or closure sees from the render that created it
- Choose between a plain value and an updater function, and explain batching
- Review state for mutation, derived values and duplicated data

## The model

### State is a snapshot

Each render sees a fixed value of state, like a photograph. `setCount(count + 1)` does not change the `count` in the function that is running. It asks React to render again with a new value. Every handler and closure made in that render keeps the old snapshot, including a timeout that fires later.

### Batching and updaters

React batches every update from one event into a single render. Three calls of `setCount(count + 1)` all read the same snapshot, so they add 1 once. An updater, `setCount(c => c + 1)`, is queued and applied to the latest value, so three calls add 3.

Use an updater whenever the next value depends on the previous one. Since React 18, batching also covers timeouts, promises and native handlers. Updater functions must be pure, because React may call them twice in development.

### Immutability

React compares state with `Object.is`. Mutate an array or object in place and the reference is unchanged, so React sees nothing to do and anything memoised on it goes stale. Copy instead: `{ ...user, name }`, `[...items, item]`, `items.toSorted()`.

Treat state as read-only. Deeply nested data is awkward to copy, so flatten it or use Immer.

### The shape of state

Keep the minimum. A value you can calculate from props or state is derived: compute it while rendering instead of storing and syncing it. Avoid duplicated state, contradictory flags such as `isLoading` with `isError`, and props mirrored into state.

Keep state in the component that uses it. Lift it to the nearest common parent only when two siblings need the same value.

## Labs

The labs run in the app. Each one below links to the live version.

### Three calls, one render

Try this:

- Press **Add 3 with count + 1** on the left and **Add 3 with an updater** on the right
- Press each button again. The left counter climbs by 1 each time, the right one by 3
- Compare the render counts. Each press adds one render to both counters, however many calls the handler makes

[Open the live lab](https://jdtoon.github.io/react-learn/modules/03-state-snapshots#lab-batching)

### What the timer remembers

Try this:

- Press **Add 1, report in 2 s** once and wait. The screen shows 1, but the timer reports 0, the count from the render in which you clicked
- Press it three times within two seconds. The timer reports 0, 1 and 2 while the screen reads 3
- Read the lanes top to bottom. Each click reads its own snapshot, the screen moves on, and the timer reports the old value two seconds later

[Open the live lab](https://jdtoon.github.io/react-learn/modules/03-state-snapshots#lab-stale-timer)

## Pitfalls

### Reading state straight after setting it

- **Symptom:** A log line right after the setter shows the old value, or calling the setter three times adds only 1
- **Cause:** The variable is the snapshot of the render that is running. Setting state queues the next snapshot and never rewrites this one
- **Fix:** Use the value you computed, not the variable. When the next value depends on the previous one, pass an updater

Bad:

```tsx
function onClick() {
  setCount(count + 1);
  console.log(count);
}
```

Good:

```tsx
function onClick() {
  const next = count + 1;
  setCount(next);
  console.log(next);
}
```

### Mutating state in place

- **Symptom:** The list does not update until something else renders, or a memoised child shows stale data
- **Cause:** `push` changes the existing array, so `Object.is` sees the same reference and React bails out. The change also leaks into earlier snapshots
- **Fix:** Create a new array or object and set that

Bad:

```tsx
function add(item) {
  items.push(item);
  setItems(items);
}
```

Good:

```tsx
function add(item) {
  setItems([...items, item]);
}
```

### Storing derived data in state

- **Symptom:** Two values disagree after an update, or a duplicate effect keeps them in step
- **Cause:** The filtered list or full name was copied into state, so every change must be remembered in two places and sooner or later one is missed
- **Fix:** Store the source and calculate the rest while rendering. Reach for `useMemo` only after measuring a slow calculation

Bad:

```tsx
const [filtered, setFiltered] = useState(items);
useEffect(() => {
  setFiltered(items.filter((item) => item.name.includes(query)));
}, [items, query]);
```

Good:

```tsx
const filtered = items.filter((item) => item.name.includes(query));
```

### A stale closure in a timer

- **Symptom:** A counter driven by `setInterval` stops at 1, or a delayed callback reports an old value
- **Cause:** The callback closes over the count of the render that created it and keeps using that snapshot on every tick
- **Fix:** Use an updater so the new value comes from the latest state, not from the closure

Bad:

```tsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []);
```

Good:

```tsx
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

## In the meeting

**Say**

- State is a snapshot. Setting it schedules a render with a new value and does not change the variable in the function that is running.
- Updates in one event are batched into one render. When the next value depends on the previous one, we pass an updater.
- We never mutate state. We copy it, because React compares references and a mutated object looks unchanged.
- If a value can be calculated from props or state, it should not be state.

**Ask**

- Is this value stored in state, or could we derive it while rendering?
- What does this timer or async callback close over, and is that still the snapshot we want?
- Who owns this state, and do two components really need to share it?

**Red flags**

- `push`, `splice`, `sort` or direct assignment on an array or object that lives in state
- Two pieces of state that must always change together, or an effect that copies one into the other
- `setInterval` or `setTimeout` reading a state variable instead of using an updater
- Flags such as `isLoading` and `isError` that can both be true

**Trade-off:** Copying state on every update keeps changes visible to React and makes undo and memoisation straightforward, at the cost of some allocation and awkward code for deeply nested data. Flatten the shape or use Immer where it hurts.

## Self-check

1. A handler calls `setCount(count + 1)` three times with `count` at 0, then logs `count`. What is logged, and what does the next render show?

   <details>
   <summary>Answer</summary>

   It logs 0, and the next render shows 1. Every call read the same snapshot and queued "set to 1". With `setCount(c => c + 1)` three times, React applies the queue in order and the next render shows 3.

   </details>

2. A `setTimeout` created in a click handler fires after the user has clicked four more times. Which count does it see, and why?

   <details>
   <summary>Answer</summary>

   The count from the render in which the handler ran. The closure captured that snapshot and never sees later ones. Pass the value in when scheduling, use an updater if it sets state, or read the latest value from a ref.

   </details>

3. `items.push(newItem); setItems(items);` does not update the screen. Why, and what is the smallest fix?

   <details>
   <summary>Answer</summary>

   The array is the same reference, so `Object.is` reports no change and React bails out. The mutation also corrupts earlier snapshots. Use `setItems([...items, newItem])`.

   </details>

## Go deeper

- [State as a snapshot](https://react.dev/learn/state-as-a-snapshot)
- [Queueing a series of state updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [Updating objects in state](https://react.dev/learn/updating-objects-in-state)
- [Choosing the state structure](https://react.dev/learn/choosing-the-state-structure)
- [useState](https://react.dev/reference/react/useState)
