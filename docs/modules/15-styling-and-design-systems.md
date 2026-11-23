> Generated from the app's content. Edit `apps/course/src/modules/15-styling-and-design-systems/content.ts`.

# 15. Styling & design systems

**Craft** · Module 15 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/15-styling-and-design-systems)

**The one idea:** Tokens are the contract between design and code. The styling tool is a detail.

## After this you can

- Describe the three token layers and say which one theming changes
- Compare global CSS, CSS Modules, utility-first, runtime CSS-in-JS and zero-runtime options by cost and fit
- Choose between container and media queries, and between headless primitives and a full kit

## The model

### Tokens are the contract

A design token is a named design decision. Three layers keep them honest. **Primitive** tokens are raw values: `--brand-600`, `--space-4`. **Semantic** tokens say what a value is for: `--color-action`, `--color-surface`. **Component** tokens belong to one part: `--button-bg`. Components read semantic or component tokens and never primitives. Theming then swaps the semantic layer, so dark mode points `--color-surface` at a different primitive and no component changes. CSS custom properties make this native: they cascade, inherit and update live, with no rebuild and no JavaScript.

### The styling tool is a detail

Global CSS is simple and collides at scale. CSS Modules scope class names at build time. Utility-first CSS such as Tailwind keeps styles beside the markup and limits values to a scale. Runtime CSS-in-JS, such as styled-components and Emotion, builds and injects styles while rendering. That costs CPU on every update, complicates streaming and concurrent rendering, and needs client code in server components, so teams moved to build-time options: the three above, or zero-runtime tools such as vanilla-extract, Panda and StyleX. All of them can read the same tokens, so choose by team habit and build cost.

### Build or buy components

Headless primitives (Radix, React Aria, Base UI) supply behaviour and accessibility without styles, so your tokens decide the look. A full kit such as MUI ships faster and bends your design towards its own. Copy-in collections such as shadcn/ui put the source in your repo, so you own it and its upgrades. Storybook documents each state, and visual regression tests catch drift.

### Modern CSS removes workarounds

**Container queries** let a component respond to the space it is given, not the viewport, which is what reusable components need. `:has()` selects a parent by its children. **Cascade layers** make the order of styles explicit, so third-party CSS never wins by accident. Anchor positioning places popovers relative to their trigger without JavaScript measuring.

## Labs

The labs run in the app. Each one below links to the live version.

### Token playground

Try this:

- Drag **Brand hue**. Every primitive recomputes, the semantic tokens follow, and the sample UI recolours without any component changing
- Switch to **Dark**. Only the semantic layer changes: the same component tokens now resolve to different primitives
- Tick **Button reads a primitive directly** and switch theme. The button ignores the remap and stops matching the link beside it
- Change **Corner radius** and note which components share the one primitive

[Open the live lab](https://jdtoon.github.io/react-learn/modules/15-styling-and-design-systems#lab-token-playground)

### Container-query card

Try this:

- Drag **Container width** from wide to narrow. The container-query card adds a detail row above 512 px, puts the image beside the text above 384 px, and stacks below that
- Watch the media-query card in the same slot. It keeps one layout, because it only knows the viewport
- Pick **Sidebar** and then **Main column**. The same component adapts to where it is placed

[Open the live lab](https://jdtoon.github.io/react-learn/modules/15-styling-and-design-systems#lab-container-query-card)

## Pitfalls

### Components that read primitives or literals

- **Symptom:** Dark mode or a rebrand misses a few components, and they look out of place
- **Cause:** A component reads a palette value or a hex code, so the theme layer never reaches it and nothing says what the colour is for
- **Fix:** Name tokens by role and have components read only semantic or component tokens. A lint rule against colour literals in component styles enforces it

Bad:

```tsx
.button {
  background: var(--blue-600);
  color: #fff;
}
```

Good:

```tsx
.button {
  background: var(--color-action);
  color: var(--color-on-action);
}
```

### Runtime CSS-in-JS on a hot path

- **Symptom:** Interactions slow down as the page grows, or styles flash on first paint
- **Cause:** Styles are serialised and injected during render, with a new class for each prop combination, so every update pays for it and server output needs extra collection
- **Fix:** Move static styling to build time and pass dynamic values as custom properties

Bad:

```tsx
const Bar = styled.div`
  width: ${(props) => props.width}px;
  color: ${(props) => props.theme.text};
`;
```

Good:

```tsx
<div
  className={styles.bar}
  style={{ "--bar-width": `${width}px` }}
/>
```

### Media queries inside reusable components

- **Symptom:** A card looks right on the page and broken in a sidebar or a dialog
- **Cause:** The breakpoint tests the viewport, so a wide screen applies the wide layout to a narrow slot
- **Fix:** Declare a container on the wrapper and query it, so the component responds to the width it receives

Bad:

```tsx
@media (min-width: 40rem) {
  .card {
    grid-template-columns: 8rem 1fr;
  }
}
```

Good:

```tsx
.card-slot {
  container-type: inline-size;
}

@container (min-width: 24rem) {
  .card {
    grid-template-columns: 8rem 1fr;
  }
}
```

### Specificity wars with `!important`

- **Symptom:** Overrides need `!important`, and a vendor stylesheet still wins in some places
- **Cause:** Selectors compete on specificity and source order. Styles outside any layer beat styles inside layers, so ordering is accidental
- **Fix:** Declare the layer order once and place vendor CSS, components and utilities in their own layers

Bad:

```tsx
.card .title {
  color: red !important;
}
```

Good:

```tsx
@layer reset, vendor, components, utilities;

@layer components {
  .title {
    color: var(--color-text);
  }
}
```

## In the meeting

**Say**

- Tokens are the contract. Primitives hold raw values, semantic tokens say what they are for, and components read only semantic or component tokens. Theming swaps the middle layer.
- The styling tool matters less than the tokens. Whatever we pick should resolve to the same custom properties and avoid injecting styles at runtime.
- Shared components should use container queries, so they adapt to the space they are placed in, not to the screen.
- Headless primitives give us behaviour and accessibility and leave the look to our tokens. A full kit trades control for speed.

**Ask**

- Do components reference tokens by role or by raw value, and what breaks if we rebrand or add a dark theme?
- Who owns the token set, and how do design and code stay in sync?
- What does this library cost at runtime, and does it work with streaming and server components?
- How do we catch visual regressions across components and themes?

**Red flags**

- Hex values or raw palette variables inside component styles
- A runtime CSS-in-JS library on a performance-sensitive or server-rendered app
- `!important` used to win specificity fights
- Breakpoints in a reusable component that test the viewport
- A design system with no owner and no visual regression checks

**Trade-off:** A strict token layer and headless primitives cost design work up front and add indirection, and they buy consistent theming, simple rebrands and components that survive new contexts.

## Self-check

1. You add a dark theme. Which token layer changes, and what must be true of the components for that to be enough?

   <details>
   <summary>Answer</summary>

   The semantic layer: dark mode points tokens such as `--color-surface` and `--color-text` at different primitives. Components must read semantic or component tokens and never primitives or colour literals, otherwise they keep their light values.

   </details>

2. A card switches to two columns above a 640 px viewport. On a wide desktop it looks broken in a 300 px sidebar. What is wrong, and what is the fix?

   <details>
   <summary>Answer</summary>

   The media query tests the viewport, which is wide, so the two-column layout lands in a narrow slot. Set `container-type: inline-size` on the wrapper and switch to an `@container` query so the card responds to the space it gets.

   </details>

3. Why did many teams move away from runtime CSS-in-JS, and what do they use instead?

   <details>
   <summary>Answer</summary>

   It builds and injects styles during render, which costs CPU on updates, complicates streaming and concurrent rendering, and needs client code in server components. Build-time options keep the authoring model without the runtime: CSS Modules, utility-first CSS, or zero-runtime libraries, with custom properties for dynamic values.

   </details>

## Go deeper

- [MDN: Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Design Tokens Community Group](https://www.designtokens.org/)
