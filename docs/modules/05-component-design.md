> Generated from the app's content. Edit `apps/course/src/modules/05-component-design/content.ts`.

# 05. Component design & composition

**Architecture** · Module 05 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/05-component-design)

**The one idea:** Compose with children and small parts instead of configuring one component with dozens of props.

## After this you can

- Replace a prop-heavy component with a composable API and explain the trade in review
- Decide whether a component should be controlled, uncontrolled or both, and who owns the value
- Spot `cloneElement` injection and boolean layout flags as design smells

## The model

### Composition over configuration

A component with a prop for every variation grows a branch for every requirement, and its props type becomes the real API. Composition inverts this: the component owns structure and behaviour, and the caller supplies the content. `children` is the simplest slot, and props that take elements, such as `header` or `footer`, cover a few more. Reach for composition when boolean flags change layout, or when props exist only to pass something through to a child.

### Compound and headless

Compound components share implicit state through context. `Tabs`, `Tabs.List`, `Tabs.Tab` and `Tabs.Panel` cooperate while the caller controls markup and order. Headless components and hooks go further: they own state, keyboard handling and ARIA, and no styling. A custom hook is the reuse unit for logic, a component the reuse unit for structure. Avoid `cloneElement` and `Children.map` to inject props, because a wrapper component in between breaks them.

### Controlled or uncontrolled

An uncontrolled component keeps its own state and takes a `defaultValue`. A controlled one is given its value and reports changes through `onChange`. Good libraries support both with one hook: use the prop when it is defined, otherwise internal state. Controlled gives the parent authority to read, set and veto. Pick one mode per instance for its whole life, because switching mid-life discards state and React warns.

### Types that keep the API honest

Make invalid combinations unrepresentable with discriminated unions, such as `{ kind: "link"; href: string } | { kind: "button"; onClick: () => void }`. Generic components keep item types flowing through a `Select` or a `Table`. Prefer a small closed set of variants over free-form style props. In React 19, `ref` is an ordinary prop, so there is no `forwardRef` wrapper to write.

## Labs

The labs run in the app. Each one below links to the live version.

### Prop explosion or parts?

Try this:

- In **Configured**, tick the requirements from the top. Watch the props meter and the branch count climb while the call site grows
- Switch to **Composed** with the same boxes ticked. The card looks identical and the `Card` API does not change
- Tick **Put the badge over the image** in each mode and compare the call site: a new prop and branch, or one line moved

[Open the live lab](https://jdtoon.github.io/react-learn/modules/05-component-design#lab-prop-explosion)

### Who owns the state?

Try this:

- Stay on **Uncontrolled**. Type a note in Profile, tick **Profile has unsaved changes** and click Billing. The tab moves and the parent only hears afterwards
- Press **Jump to Billing**, then return to Profile. The note is gone, because remounting was the only way to set an uncontrolled tab
- Switch to **Controlled** and repeat. While the box is ticked the parent refuses both moves. Untick it and the jump keeps your note

[Open the live lab](https://jdtoon.github.io/react-learn/modules/05-component-design#lab-state-ownership)

## Pitfalls

### Boolean props that change layout

- **Symptom:** A button takes `isPrimary`, `isLarge`, `isOutline` and `isLoading`, and nobody knows what happens when all four are set
- **Cause:** Each flag multiplies the states the component must handle, and invalid combinations still type-check
- **Fix:** Use one closed `variant` union for the visual choice and compose the rest, such as a spinner passed as `children`

Bad:

```tsx
<Button isPrimary isOutline isLarge isLoading />
```

Good:

```tsx
<Button variant="outline" size="lg">
  <Spinner />
  Saving
</Button>
```

### Injecting props with cloneElement or Children.map

- **Symptom:** A tab list works until someone wraps a tab in their own component, and then it silently stops being selected
- **Cause:** The parent edits only its direct child elements, so a wrapper receives the injected prop and does not forward it
- **Fix:** Share state through context so a part works at any depth

Bad:

```tsx
Children.map(children, (child) =>
  cloneElement(child, { active: child.props.value === value }),
)
```

Good:

```tsx
function Tab({ value, children }) {
  const { current, select } = useTabs();
  return (
    <button aria-selected={current === value} onClick={() => select(value)}>
      {children}
    </button>
  );
}
```

### Switching between controlled and uncontrolled

- **Symptom:** A field loses what the user typed, and the console warns about changing an input from uncontrolled to controlled
- **Cause:** The value prop was `undefined` on one render and defined on the next, so ownership of the state moved mid-life
- **Fix:** Initialise with a defined value, or remount the component with a `key` when the mode must change

Bad:

```tsx
const [name, setName] = useState();
<input value={name} onChange={(e) => setName(e.target.value)} />
```

Good:

```tsx
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />
```

### Render-prop sprawl

- **Symptom:** A table takes `renderHeader`, `renderRow`, `renderEmpty`, `renderFooter` and `renderLoading`, and every caller passes all five
- **Cause:** The component still owns the structure and asks the caller to fill every hole, which is configuration written as functions
- **Fix:** Expose parts or a headless hook and let the caller assemble the structure

## In the meeting

**Say**

- If layout flags keep arriving on one component, give callers the parts instead of another prop.
- Compound components share state through context so callers control markup and order. Headless components own behaviour and accessibility but no styling.
- Controlled means the parent owns the value. Uncontrolled means the component does. Support both with one hook, and never flip an instance between them.
- Discriminated unions make invalid prop combinations fail to compile.

**Ask**

- How many props change the layout of this component, and which exist for only one caller?
- Is this controlled or uncontrolled, and can the parent veto a change?
- Could a custom hook own this logic so we stop copying the same effects between components?
- What happens when a caller wraps one of these parts in their own component?

**Red flags**

- Boolean props that toggle layout, such as `isCompact`, `withFooter` or `noPadding`
- `cloneElement` or `Children.map` used to inject props into children
- A component that accepts `value` and `defaultValue` but ignores one of them
- A growing family of `renderX` props on a single component
- A reusable component whose props type is a long list of optional fields

**Trade-off:** Composition keeps components small and gives callers control, but callers must assemble the parts correctly and the common case takes more JSX than one configured prop would.

## Self-check

1. A `Card` has `title`, `image`, `badge`, `badgePosition`, `footer`, `footerAlign` and `compact` props, and each sprint adds another. What is the structural problem and the usual remedy?

   <details>
   <summary>Answer</summary>

   Every requirement adds a prop and a branch inside the component, so the props type becomes the real API and the component must anticipate every layout. Give it parts instead, such as `Card.Media`, `Card.Title` and `Card.Actions`, so callers compose the layout and the card stays small.

   </details>

2. A `Tabs` component accepts `value` and `defaultValue`. A parent passes `value={undefined}` on the first render and a string later. What goes wrong?

   <details>
   <summary>Answer</summary>

   The instance starts uncontrolled with its own state and then becomes controlled, so the internal state is abandoned and built-in inputs warn. Choose one mode for the life of the instance, or remount with a `key` when the mode has to change.

   </details>

3. Why does `Children.map(children, (child) => cloneElement(child, { active }))` break when a caller wraps a tab in their own `MyTab` component?

   <details>
   <summary>Answer</summary>

   It injects props into the direct child element only. `MyTab` receives `active` and must forward it, which nobody remembers to do. A compound component shares state through context, so a part works at any depth.

   </details>

## Go deeper

- [Passing props, including JSX as children](https://react.dev/learn/passing-props-to-a-component)
- [Sharing state between components (controlled and uncontrolled)](https://react.dev/learn/sharing-state-between-components)
- [Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [cloneElement and its alternatives](https://react.dev/reference/react/cloneElement)
- [TypeScript: discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
