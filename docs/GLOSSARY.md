> Generated from the app's content. Edit the `content.ts` file of each module in `apps/course/src/modules/`.

# Glossary

Every key term in one line, in A to Z order, with the module that teaches it.

Jump to: [B](#b) · [C](#c) · [K](#k) · [M](#m) · [R](#r) · [S](#s) · [T](#t)

## B

- **Bail-out**: React skipping work for a component and its children because nothing they depend on changed: identical state by Object.is, shallowly equal props under memo, or an element React already has. See [02. Rendering & reconciliation](modules/02-rendering.md).

## C

- **Commit**: Applying only the differences from a render to the DOM, then running layout effects. See [02. Rendering & reconciliation](modules/02-rendering.md).

## K

- **Key**: A stable identity for an element among its siblings, used to match it across renders and to reset state on purpose. See [02. Rendering & reconciliation](modules/02-rendering.md).

## M

- **Memoisation (memo)**: Wrapping a component so React skips its render when every prop is shallowly equal to last time. See [02. Rendering & reconciliation](modules/02-rendering.md).

## R

- **Reconciliation**: Comparing the new element tree with the previous one, by type and key, to decide what to keep, update or remount. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Render**: React calling your component functions to compute the next element tree. It must be pure and does not touch the DOM. See [02. Rendering & reconciliation](modules/02-rendering.md).

## S

- **StrictMode**: A development-only wrapper that renders twice and re-runs effect setup and cleanup to expose impure code. See [02. Rendering & reconciliation](modules/02-rendering.md).

## T

- **Trigger**: The event that schedules a render: a first mount, a state update, or a change in an external store. A component then renders because it mounted, owns the changed state, subscribes to the changed store, has a parent that rendered, or reads a context that changed. See [02. Rendering & reconciliation](modules/02-rendering.md).
