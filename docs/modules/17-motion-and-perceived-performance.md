> Generated from the app's content. Edit `apps/course/src/modules/17-motion-and-perceived-performance/content.ts`.

# 17. Motion & perceived performance

**Craft** · Module 17 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/17-motion-and-perceived-performance)

**The one idea:** How fast it feels matters as much as how fast it is.

## After this you can

- Choose between a spinner, a skeleton and an optimistic update for a given wait, and defend the choice with timing and layout stability
- Explain how `<ViewTransition>` hands a React update to the browser, and which updates it animates
- Review motion for duration, easing, animated properties and `prefers-reduced-motion`

## The model

### Feel is a budget

Users judge speed by feedback, not by the network. Under about 100 ms an interface feels instant, around 1 s the user keeps their flow, and past 10 s they leave. The first job is to acknowledge the action within 100 ms, even when the result takes longer.

Three tools cover most waits. A **spinner** says "working" and nothing else. A **skeleton** draws the final layout in grey, so content lands without shifting and the wait reads as progress. An **optimistic** update shows the expected result at once and reconciles with the server later.

### Pick by what you know

Use a spinner for short or unpredictable waits and for actions with no visible result. Use a skeleton when you know the shape of what is coming. The wait is the same length, but the skeleton avoids layout shift, which counts against CLS.

Use optimistic UI when an action is reversible and almost always succeeds, such as a like or a comment. `useOptimistic` holds a temporary value while an Action runs and drops it when the Action settles, so a failure rolls back without extra code. Keep it away from payments and anything irreversible.

### View Transitions

`<ViewTransition>` is stable in React 19.3. When an update runs inside `startTransition`, an Action or a Suspense reveal, React calls the browser's `document.startViewTransition`. The browser snapshots the old and new states, cross-fades them and moves matching elements. Synchronous updates commit immediately and are not animated.

Give `name` to pair elements across screens, and style the `::view-transition-*` pseudo-elements in CSS. A browser without support still updates, with no animation.

### Timing and restraint

Motion should explain a change, not delay it. Keep UI transitions between 150 and 300 ms, ease out for things entering and ease in for things leaving, and animate `transform` and `opacity` so the compositor does the work (module 11). Honour `prefers-reduced-motion` by removing movement and keeping simple fades. An exit animation needs the element to stay mounted until it finishes, which `<ViewTransition>` handles for you.

## Labs

The labs run in the app. Each one below links to the live version.

### Same flow, three ways

Try this:

- Choose **Spinner** with the **Typical** delay. Press **Reload comments**, then **Post comment**, and read the Feedback, Content and Layout jump columns
- Switch to **Skeleton** and repeat. Feedback and Content match the spinner, but the layout jump drops to 0 px
- Switch to **Optimistic** and post. The comment is on screen almost at once, dimmed until the server confirms it
- With **Optimistic** selected, tick **Server fails** and post again. The comment appears, then rolls back with an error

[Open the live lab](https://jdtoon.github.io/react-learn/modules/17-motion-and-perceived-performance#lab-loading-three-ways)

### React 19.3 ViewTransition

Try this:

- With **ViewTransition** on and **startTransition** selected, press **Shuffle**. Cards glide to their new places and the event log fills in
- Tick **Slow motion** and press **Add card** or click a card to remove it. Watch the enter and exit cross-fades
- Switch the update mode to **Plain setState** and shuffle again. The cards jump with no animation, although the wrapper is still there
- Turn **ViewTransition** off and shuffle. The update is identical and the animation is gone

[Open the live lab](https://jdtoon.github.io/react-learn/modules/17-motion-and-perceived-performance#lab-view-transition)

## Pitfalls

### A spinner where the shape is known

- **Symptom:** The page jumps when data arrives and the content the user was reading is pushed down
- **Cause:** The spinner box is a different height from the content, so the arrival is a layout shift that counts against CLS
- **Fix:** Render a skeleton with the same dimensions as the final content, or reserve space with a fixed `min-height`

Bad:

```tsx
{isLoading ? <Spinner /> : <CommentList items={items} />}
```

Good:

```tsx
{isLoading ? <CommentListSkeleton rows={3} /> : <CommentList items={items} />}
```

### Optimistic UI on an action that cannot be undone

- **Symptom:** The user sees "Paid" and then an error, or an order appears that never existed
- **Cause:** The interface showed success before the server agreed, and there is nothing sensible to roll back to
- **Fix:** Reserve optimistic updates for cheap, reversible actions. For anything else show a pending state and wait for the server. Always tell the user when a rollback happens

### Wrapping in ViewTransition but updating synchronously

- **Symptom:** The component is wrapped and nothing animates
- **Cause:** View transitions only run for updates inside a transition, an Action or a Suspense reveal. A plain state update commits immediately
- **Fix:** Wrap the update in `startTransition`

Bad:

```tsx
function shuffle() {
  setCards(shuffled(cards));
}
```

Good:

```tsx
function shuffle() {
  startTransition(() => setCards(shuffled(cards)));
}
```

### Motion that ignores reduced-motion and animates layout

- **Symptom:** Animations stutter on cheap phones, and users who asked for less motion still get sliding panels
- **Cause:** Properties such as `width`, `top` and `margin` force layout on every frame, and no `prefers-reduced-motion` rule is present
- **Fix:** Animate `transform` and `opacity`, and switch movement off under the media query

Bad:

```tsx
.panel {
  transition: left 400ms;
}
```

Good:

```tsx
.panel {
  transition: transform 200ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
  }
}
```

## In the meeting

**Say**

- The 100 ms budget is about feedback, not completion. Acknowledge the action at once, even if the result takes a second.
- A skeleton does not make the request faster. It prevents layout shift and makes the wait read as progress.
- Optimistic UI suits reversible actions that nearly always succeed, and it needs a rollback path the user can see.
- `<ViewTransition>` only animates updates that run inside a transition, an Action or a Suspense reveal.

**Ask**

- What does the user see in the first 100 ms after the click, and what do they see on failure?
- Does the placeholder match the final layout, and what does that do to CLS?
- Does this animation animate only `transform` and `opacity`, and does it respect `prefers-reduced-motion`?

**Red flags**

- A full-page spinner replacing content the user was already reading
- Optimistic updates on payments, deletes with no undo, or anything with side effects
- Animations longer than 400 ms that block interaction, or that play on every route change

**Trade-off:** Optimistic UI and rich motion buy a faster feel, and cost extra states to design, rollback code to test and more motion to keep accessible.

## Self-check

1. A spinner and a skeleton both show for 1.2 s before the same content arrives. What does the skeleton change, measurably?

   <details>
   <summary>Answer</summary>

   Not the wait. It reserves the final layout, so the content arrives without shifting the page and CLS stays low. It also makes the wait read as progress.

   </details>

2. You wrap each list item in `<ViewTransition>` and call `setItems(shuffled)` in a click handler. Nothing animates. Why?

   <details>
   <summary>Answer</summary>

   The update is synchronous, so it commits immediately and React cannot hand it to the browser. Wrapping it in `startTransition` lets React start a view transition around the commit.

   </details>

3. An optimistic comment is on screen and the request then fails. What does `useOptimistic` do, and what is still your job?

   <details>
   <summary>Answer</summary>

   The optimistic value is dropped when the Action settles without committing it to real state, so the comment disappears. You still have to tell the user why, and ideally keep their draft so they can retry.

   </details>

## Go deeper

- [ViewTransition](https://react.dev/reference/react/ViewTransition)
- [useOptimistic](https://react.dev/reference/react/useOptimistic)
- [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Cumulative Layout Shift](https://web.dev/articles/cls)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
