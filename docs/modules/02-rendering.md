> Generated from the app's content. Edit `apps/course/src/modules/02-rendering/content.ts`.

# 02. Rendering & reconciliation

**Foundations** · Module 02 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/02-rendering)

**The one idea:** A re-render is React calling your function again. The DOM only changes where the output differs.

## After this you can

- Trace a state change through trigger, render and commit, and predict which components run
- Explain how element type, tree position and `key` decide whether React keeps or resets state
- Challenge a `memo` wrapper or an index key in review with a specific reason

## The model

### Trigger, render, commit

Every screen update has three steps. A **trigger** (the first mount, or a state update) schedules work. **Render** is React calling your components to compute the next element tree. It must be pure and touches no DOM. **Commit** applies the differences to the DOM, then runs layout effects.

A render can call a hundred components and commit one text change. React compares the new tree with the previous one and writes only what differs.

### What starts a render

A component renders for five reasons: it mounts, it set its own state, an external store it subscribes to changed, its parent rendered, or a context value it reads changed. A changed prop is a symptom of the parent rendering.

Rendering flows down. When a component renders, every child element it creates renders too, whether or not its props changed. Two things stop that. `memo` compares each prop with `Object.is` and skips the render when all are equal. An element React already holds, such as `children` passed through a provider, is reused as is. Inline objects, arrays and functions are never equal, so they defeat `memo`. Context changes bypass both.

Setting state to a value `Object.is` considers identical bails out and the children are skipped. React may still call the component once before it settles.

### Identity: type, position and key

After a render, React reconciles the new tree against the old one position by position. The same element type keeps the instance and updates its props. A different type discards the subtree, state included, and mounts a new one. In lists, `key` is the identity that lets React match items across inserts and reorders. Without keys React matches siblings by position and warns in development.

React holds state against a position in the tree, outside your function. The same component at the same position keeps its state when props change, even when they now describe someone else. Change its `key` and it becomes a new instance, which is the clean way to reset state.

### StrictMode and the Compiler

In development, `StrictMode` renders each component twice and runs one extra setup and cleanup cycle for every effect, to expose impure renders and missing cleanup. Production is unaffected. Run the course in development and the lab counters start at 2: they count a layout effect, and StrictMode runs it twice on mount.

The React Compiler automates much of the memoisation above. Module 12 covers it.

## Labs

The labs run in the app. Each one below links to the live version.

### Who re-renders?

Try this:

- Press **Change Feed state**. Feed, `<Post A>`, `<Post B>` and `<ThemeBadge>` render, and every other box keeps its count
- Press **Change App state**. Tick **Wrap Sidebar in memo** and press **Change App state** again: Sidebar holds its count. Now tick **Pass a fresh array to Sidebar each render** and press **Change App state** once more: Sidebar renders again
- Press **Change theme**. Only the provider and `<ThemeBadge>` render, although `<ThemeBadge>` sits deep in the tree
- Press **Set App state to same value** and watch the summary below the tree

[Open the live lab](https://jdtoon.github.io/react-learn/modules/02-rendering#lab-render-tree)

### Key chaos

Try this:

- Type `alpha` into the first row, then press **Insert at top**. The text stays in the top row, which now belongs to a different person
- Switch to **Stable ids**, type `alpha` into the first row and insert again. The text moves down with Ada
- With either strategy, press **Shuffle** and then **Remove first**. Compare where the text ends up

[Open the live lab](https://jdtoon.github.io/react-learn/modules/02-rendering#lab-key-chaos)

### Reset with a key

Try this:

- Type a message to Ada, pin the conversation, then switch to Grace. The draft and the pin carry over, and the render count keeps climbing
- Switch to **Key by user id** and repeat. Each user starts empty and the render count starts again

[Open the live lab](https://jdtoon.github.io/react-learn/modules/02-rendering#lab-reset-with-key)

## Pitfalls

### Index keys on a list that changes

- **Symptom:** Typed text, focus or an open row lands on the wrong item after an insert, sort or delete
- **Cause:** The key is the array index, so each instance is bound to a **position**, not to an item. React reuses it for whatever item now sits there
- **Fix:** Use a stable id that comes with the data. Never generate keys while rendering: `Math.random()` remounts every row on every render

Bad:

```tsx
items.map((item, index) => (
  <Row key={index} item={item} />
))
```

Good:

```tsx
items.map((item) => (
  <Row key={item.id} item={item} />
))
```

### Copying a prop into state and syncing it with an effect

- **Symptom:** A form shows the previous record for one frame, or keeps stale edits after the record changes
- **Cause:** `useState(prop)` reads the prop once, on mount. The effect that patches it up runs after the stale render has already been committed
- **Fix:** Key the component by the identity of the record so it remounts clean, or derive the value while rendering

Bad:

```tsx
function Editor({ user }) {
  const [bio, setBio] = useState(user.bio);
  useEffect(() => setBio(user.bio), [user.id]);
  return <input value={bio} onChange={(e) => setBio(e.target.value)} />;
}
```

Good:

```tsx
<Editor key={user.id} user={user} />
```

### Defining a component inside another component

- **Symptom:** An input loses focus and its text on every keystroke, or a subtree remounts on every parent render
- **Cause:** The inner function is a new type on every render, so React sees a different component at that position and discards the old instance
- **Fix:** Declare components at module scope and pass data in as props

Bad:

```tsx
function Form() {
  const [name, setName] = useState("");
  function NameField() {
    return <input value={name} onChange={(e) => setName(e.target.value)} />;
  }
  return <NameField />;
}
```

Good:

```tsx
function NameField({ name, onChange }) {
  return <input value={name} onChange={(e) => onChange(e.target.value)} />;
}
```

### Memo that never skips

- **Symptom:** A `memo` wrapper is in place and the profiler still shows the component rendering on every parent render
- **Cause:** A prop is a new object, array or function each render, so the shallow comparison always fails
- **Fix:** Hoist constant values out of the component, wrap callbacks in `useCallback`, or restructure so the expensive part receives `children` or lives lower in the tree

Bad:

```tsx
const Chart = memo(function Chart({ options, onSelect }) {
  return <button onClick={onSelect}>{options.title}</button>;
});

function Panel() {
  const [, setCount] = useState(0);
  return <Chart options={{ title: "Sales" }} onSelect={() => setCount((c) => c + 1)} />;
}
```

Good:

```tsx
const Chart = memo(function Chart({ options, onSelect }) {
  return <button onClick={onSelect}>{options.title}</button>;
});

const options = { title: "Sales" };

function Panel() {
  const [, setCount] = useState(0);
  const onSelect = useCallback(() => setCount((c) => c + 1), []);
  return <Chart options={options} onSelect={onSelect} />;
}
```

## In the meeting

**Say**

- A render is React calling the function again. A commit is the DOM change. Most renders commit little or nothing, so a render count alone says little about cost.
- Re-renders come from state, a parent rendering or context. A changed prop is a symptom of the parent rendering. Everything underneath runs again unless it is memoised or is `children` passed through.
- A key is identity. Index keys are fine on a list that never changes. Where items insert, reorder or delete, they attach state to the wrong item.
- To reset a component, change its key. That beats an effect that copies props into state.

**Ask**

- Where does this state live, and could it move lower so fewer components render when it changes?
- Did we profile before adding `memo`, and what did the numbers show before and after?
- What is the key on this list, and can items be inserted, reordered or removed?
- Is it slow because it renders too often, or because a single render is expensive?

**Red flags**

- `useEffect` that copies a prop or one piece of state into another
- `memo` around components whose props include inline objects or callbacks
- Array index or `Math.random()` as the key on a list that changes
- A component defined inside another component body
- Treating a re-render as a DOM update, and contorting code to avoid renders that cost nothing

**Trade-off:** Skipping renders with `memo` or by moving state down buys less work per update and costs extra code and comparisons, so it pays only where renders are frequent and expensive.

## Self-check

1. A parent renders and creates a child element with exactly the props it had last time. The child is not wrapped in `memo`. Does the child function run?

   <details>
   <summary>Answer</summary>

   Yes. The parent rendered, so it created a new element for the child, and React does not compare props without `memo`. The exception is an element React already holds, such as `children` passed through, which it skips. The DOM only changes if the child returns something different.

   </details>

2. A chat window keeps the half-typed message from the previous contact when you switch contacts. What is the smallest fix, and why does it work?

   <details>
   <summary>Answer</summary>

   Add `key={contact.id}` to the chat component. Without a key it is the same type at the same position, so React keeps its state. With the key, a different contact is a different identity and mounts fresh.

   </details>

3. A list of rows with text inputs uses the array index as the key. A new item is inserted at the top. What does the user see?

   <details>
   <summary>Answer</summary>

   Each typed value stays at its position, so it now sits beside a different item, and the last item gets a freshly mounted row. React reused instances by position instead of matching them to items.

   </details>

## Go deeper

- [Render and commit](https://react.dev/learn/render-and-commit)
- [Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state)
- [Rendering lists and keys](https://react.dev/learn/rendering-lists)
- [memo](https://react.dev/reference/react/memo)
- [A (Mostly) Complete Guide to React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/)
