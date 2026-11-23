> Generated from the app's content. Edit the `content.ts` file of each module in `apps/course/src/modules/`.

# Meeting cheatsheet

What to say, what to ask and what to watch for, one card per module. The live version is at https://jdtoon.github.io/react-learn/meeting.

## Foundations

### 02. Rendering & reconciliation

*A re-render is React calling your function again. The DOM only changes where the output differs.*

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

[Full module guide](modules/02-rendering.md)
