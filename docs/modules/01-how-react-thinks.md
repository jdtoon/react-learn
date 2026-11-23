> Generated from the app's content. Edit `apps/course/src/modules/01-how-react-thinks/content.ts`.

# 01. How React thinks

**Foundations** · Module 01 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/01-how-react-thinks)

**The one idea:** You describe what the UI should look like for a given state. React works out the DOM changes.

## After this you can

- Describe a screen as a function of props and state, and say what React does with the description
- Tell an element, a component and an instance apart, and say which one is a plain object
- Decide where data lives: props flow down and are read-only, and state has one owner

## The model

### UI is a function of state

React asks you to describe the screen for one moment: given these props and this state, here is the UI. You do not write the steps from the previous screen to the next. When state changes, React calls your component again, compares the new description with the last and changes only the DOM that differs.

The imperative alternative keeps the DOM as the source of truth and mutates it from every event handler. Each handler must know every part of the screen it affects, so the cases to get right grow with handlers times affected parts.

### Elements, components, instances

A component is a function. Calling it returns **elements**: plain objects such as `{ type, props, key }` that describe what you want. An element is not a DOM node and is cheap to create. React keeps an **instance** for each mounted component, holding its state and its place in the tree, and creates DOM nodes for the host elements.

You write components and return elements. React owns instances and nodes. Every render produces a new tree of elements, while instances and nodes persist.

### One-way data flow

Data moves down the tree. A parent passes **props** to its children and a child may not change them. **State** is memory that one component owns, kept by React between renders.

A child that needs to change the parent data calls a function the parent passed down, and the parent sets its own state. Props and state are the only inputs to a render. Anything you can calculate from them is not another piece of state.

### What the model costs

Describing the result makes the UI predictable and testable from inputs alone. Concurrent rendering, server rendering and the React Compiler all depend on render being a pure calculation that React can repeat or discard.

The price is discipline. Render must not mutate its inputs, touch the DOM or start timers. Side effects belong in event handlers and effects.

## Labs

The labs run in the app. Each one below links to the live version.

### Describe or command?

Try this:

- Press **Add tea**, then **Add coffee**. Watch the hand-written operations pile up while the described side makes one call per press
- Add tea and coffee a few times, then press **Clear cart** once. Compare how many operations each side needed for that one event
- Tick **Forget one branch**, add an item, then press **Clear cart**. The hand-written checkout stays enabled on an empty cart, and the described screen cannot drift

[Open the live lab](https://jdtoon.github.io/react-learn/modules/01-how-react-thinks#lab-describe-or-command)

### Element X-ray

Try this:

- Press **Grace**. Only the lines that mention the name differ from the previous description
- Press **All the way down**, then toggle **Online**. Function components expand until only host elements and text remain
- Press **Render again, same props**. The render count climbs, the page and the description stay the same, and the two elements are different objects

[Open the live lab](https://jdtoon.github.io/react-learn/modules/01-how-react-thinks#lab-element-xray)

## Pitfalls

### Reaching into the DOM to change what React renders

- **Symptom:** The screen and the data disagree until something else forces a re-render
- **Cause:** React compares each new description with the previous one, not with the live DOM. A node edited by hand is not repaired, so state and page drift apart
- **Fix:** Put the value in state and render it. Use a ref only for things React does not draw, such as focus or scroll position

Bad:

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  function onClick() {
    setCount(count + 1);
    document.getElementById("badge").textContent = String(count + 1);
  }
  return <button onClick={onClick}>Add</button>;
}
```

Good:

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>Add</button>
      <span id="badge">{count}</span>
    </>
  );
}
```

### Side effects during render

- **Symptom:** Analytics events fire twice, a title flickers, or a counter outside React drifts in development
- **Cause:** React may render a component more than once, or discard a render, so anything the function does besides returning elements can repeat or never be undone. StrictMode shows this on purpose
- **Fix:** Keep render a calculation. Do the work in the event handler that caused it, or in an effect when it must follow the screen

Bad:

```tsx
function Page({ title }) {
  document.title = title;
  analytics.track("page_view");
  return <h1>{title}</h1>;
}
```

Good:

```tsx
function Page({ title }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <h1>{title}</h1>;
}
```

### Mutating props

- **Symptom:** A list changes order in a component that never owned it, or memoised siblings go stale
- **Cause:** Props are the parent data, passed by reference. `sort`, `push` or an assignment changes the parent array in the middle of a render
- **Fix:** Copy before you change. `toSorted` and spread return a new array and leave the original alone

Bad:

```tsx
function Leaderboard({ scores }) {
  scores.sort((a, b) => b - a);
  return <List items={scores} />;
}
```

Good:

```tsx
function Leaderboard({ scores }) {
  const ranked = scores.toSorted((a, b) => b - a);
  return <List items={ranked} />;
}
```

### Calling a component as a function

- **Symptom:** A hook rule error, state that belongs to the wrong component, or a subtree that resets unexpectedly
- **Cause:** A direct call runs the function inside the caller, so its hooks and state belong to the caller and React never sees a component at that position
- **Fix:** Render it as an element with JSX so React creates an instance of its own

Bad:

```tsx
function Page() {
  return <main>{Sidebar({ links })}</main>;
}
```

Good:

```tsx
function Page() {
  return (
    <main>
      <Sidebar links={links} />
    </main>
  );
}
```

## In the meeting

**Say**

- We describe the UI for a given state and React works out the DOM changes. We do not write the steps between screens.
- Props come down from the parent and are read-only. State has one owner. When a child needs to change something, the owner passes it a function.
- An element is a plain object describing what to render. Creating them is cheap. The cost sits in what React does with them afterwards.

**Ask**

- Which component owns this state, and does anything above it also need it?
- Is this value state, or can we calculate it from the props and state we already have?
- Does this render do anything other than calculate JSX?

**Red flags**

- Direct DOM writes such as `document.querySelector` or `innerHTML` inside a component React also renders
- A component that mutates its props or a module-level variable while rendering
- A value in state that two handlers must both remember to update
- A component called as a plain function instead of rendered as an element

**Trade-off:** Describing the UI as a function of state removes a whole class of out-of-sync bugs and costs a render model you have to keep pure, plus the work of finding the right owner for each piece of state.

## Self-check

1. A teammate fixes a stale label by setting `textContent` on the node inside a click handler of a React component. What goes wrong?

   <details>
   <summary>Answer</summary>

   React diffs against the previous elements, not the live DOM, so it will not repair the edit. The page and the state disagree until that text next changes. Put the value in state and render it, so the screen is always derived from state.

   </details>

2. A child component needs to change a value owned by its grandparent. How should the data flow, and why not let the child edit it?

   <details>
   <summary>Answer</summary>

   The owner passes a function down as a prop, through the parent. The child calls it and the owner sets its own state, which renders down again with new props. Props are read-only so the owner stays the one place the value changes.

   </details>

3. In `return <Badge online />`, what is `<Badge online />`, and what does React keep for a mounted Badge between renders?

   <details>
   <summary>Answer</summary>

   It is an element: a plain object with a type, props and key, created again on every render. Between renders React keeps an instance, which holds the state and the place in the tree, and the DOM nodes it produced.

   </details>

## Go deeper

- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Keeping components pure](https://react.dev/learn/keeping-components-pure)
- [Sharing state between components](https://react.dev/learn/sharing-state-between-components)
- [Describing the UI](https://react.dev/learn/describing-the-ui)
- [createElement](https://react.dev/reference/react/createElement)
