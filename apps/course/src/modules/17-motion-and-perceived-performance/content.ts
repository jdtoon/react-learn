import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '17-motion-and-perceived-performance',
  number: 17,
  title: 'Motion & perceived performance',
  track: 'craft',
  oneIdea: 'How fast it feels matters as much as how fast it is.',
  minutes: 12,
  phase: 4,
  outcomes: [
    'Choose between a spinner, a skeleton and an optimistic update for a given wait, and defend the choice with timing and layout stability',
    'Explain how `<ViewTransition>` hands a React update to the browser, and which updates it animates',
    'Review motion for duration, easing, animated properties and `prefers-reduced-motion`',
  ],
  sections: [
    {
      heading: 'Feel is a budget',
      paragraphs: [
        'Users judge speed by feedback, not by the network. Under about 100 ms an interface feels instant, around 1 s the user keeps their flow, and past 10 s they leave. The first job is to acknowledge the action within 100 ms, even when the result takes longer.',
        'Three tools cover most waits. A **spinner** says "working" and nothing else. A **skeleton** draws the final layout in grey, so content lands without shifting and the wait reads as progress. An **optimistic** update shows the expected result at once and reconciles with the server later.',
      ],
    },
    {
      heading: 'Pick by what you know',
      paragraphs: [
        'Use a spinner for short or unpredictable waits and for actions with no visible result. Use a skeleton when you know the shape of what is coming. The wait is the same length, but the skeleton avoids layout shift, which counts against CLS.',
        'Use optimistic UI when an action is reversible and almost always succeeds, such as a like or a comment. `useOptimistic` holds a temporary value while an Action runs and drops it when the Action settles, so a failure rolls back without extra code. Keep it away from payments and anything irreversible.',
      ],
    },
    {
      heading: 'View Transitions',
      paragraphs: [
        "`<ViewTransition>` is stable in React 19.3. When an update runs inside `startTransition`, an Action or a Suspense reveal, React calls the browser's `document.startViewTransition`. The browser snapshots the old and new states, cross-fades them and moves matching elements. Synchronous updates commit immediately and are not animated.",
        'Give `name` to pair elements across screens, and style the `::view-transition-*` pseudo-elements in CSS. A browser without support still updates, with no animation.',
      ],
    },
    {
      heading: 'Timing and restraint',
      paragraphs: [
        'Motion should explain a change, not delay it. Keep UI transitions between 150 and 300 ms, ease out for things entering and ease in for things leaving, and animate `transform` and `opacity` so the compositor does the work (module 11). Honour `prefers-reduced-motion` by removing movement and keeping simple fades. An exit animation needs the element to stay mounted until it finishes, which `<ViewTransition>` handles for you.',
      ],
    },
  ],
  labs: [
    {
      id: 'loading-three-ways',
      title: 'Same flow, three ways',
      tryThis: [
        'Choose **Spinner** with the **Typical** delay. Press **Reload comments**, then **Post comment**, and read the Feedback, Content and Layout jump columns',
        'Switch to **Skeleton** and repeat. Feedback and Content match the spinner, but the layout jump drops to 0 px',
        'Switch to **Optimistic** and post. The comment is on screen almost at once, dimmed until the server confirms it',
        'With **Optimistic** selected, tick **Server fails** and post again. The comment appears, then rolls back with an error',
      ],
      whatHappened:
        'All three strategies wait for the same simulated server, so the real time to final content is the same for the spinner and the skeleton. What differs is what the user sees meanwhile. The spinner swaps a small box for a taller list, and the page jumps. The skeleton reserves the final rows, so nothing moves. The optimistic strategy puts the comment on screen in the same commit as the click and removes the wait for content altogether. `useOptimistic` keeps that row only while the Action runs, so on failure it vanishes without any cleanup code. The readings are measured with `performance.now()` and the rendered height of the list.',
    },
    {
      id: 'view-transition',
      title: 'React 19.3 ViewTransition',
      tryThis: [
        'With **ViewTransition** on and **startTransition** selected, press **Shuffle**. Cards glide to their new places and the event log fills in',
        'Tick **Slow motion** and press **Add card** or click a card to remove it. Watch the enter and exit cross-fades',
        'Switch the update mode to **Plain setState** and shuffle again. The cards jump with no animation, although the wrapper is still there',
        'Turn **ViewTransition** off and shuffle. The update is identical and the animation is gone',
      ],
      whatHappened:
        'Each card is wrapped in `<ViewTransition key={card.id}>`. When the update runs inside `startTransition`, React asks the browser to snapshot the old state, applies the DOM change and lets the browser animate between the two. Cards with the same name move, new ones fade in, removed ones fade out. A plain `setState` in a click handler commits synchronously, so React cannot hand it to the browser and nothing animates. Setting `default="none"` opts every card out while leaving the markup untouched.',
    },
  ],
  pitfalls: [
    {
      title: 'A spinner where the shape is known',
      symptom:
        'The page jumps when data arrives and the content the user was reading is pushed down',
      cause:
        'The spinner box is a different height from the content, so the arrival is a layout shift that counts against CLS',
      fix: 'Render a skeleton with the same dimensions as the final content, or reserve space with a fixed `min-height`',
      bad: '{isLoading ? <Spinner /> : <CommentList items={items} />}',
      good: '{isLoading ? <CommentListSkeleton rows={3} /> : <CommentList items={items} />}',
    },
    {
      title: 'Optimistic UI on an action that cannot be undone',
      symptom: 'The user sees "Paid" and then an error, or an order appears that never existed',
      cause:
        'The interface showed success before the server agreed, and there is nothing sensible to roll back to',
      fix: 'Reserve optimistic updates for cheap, reversible actions. For anything else show a pending state and wait for the server. Always tell the user when a rollback happens',
    },
    {
      title: 'Wrapping in ViewTransition but updating synchronously',
      symptom: 'The component is wrapped and nothing animates',
      cause:
        'View transitions only run for updates inside a transition, an Action or a Suspense reveal. A plain state update commits immediately',
      fix: 'Wrap the update in `startTransition`',
      bad: 'function shuffle() {\n  setCards(shuffled(cards));\n}',
      good: 'function shuffle() {\n  startTransition(() => setCards(shuffled(cards)));\n}',
    },
    {
      title: 'Motion that ignores reduced-motion and animates layout',
      symptom:
        'Animations stutter on cheap phones, and users who asked for less motion still get sliding panels',
      cause:
        'Properties such as `width`, `top` and `margin` force layout on every frame, and no `prefers-reduced-motion` rule is present',
      fix: 'Animate `transform` and `opacity`, and switch movement off under the media query',
      bad: '.panel {\n  transition: left 400ms;\n}',
      good: '.panel {\n  transition: transform 200ms ease-out;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .panel {\n    transition: none;\n  }\n}',
    },
  ],
  meeting: {
    say: [
      'The 100 ms budget is about feedback, not completion. Acknowledge the action at once, even if the result takes a second.',
      'A skeleton does not make the request faster. It prevents layout shift and makes the wait read as progress.',
      'Optimistic UI suits reversible actions that nearly always succeed, and it needs a rollback path the user can see.',
      '`<ViewTransition>` only animates updates that run inside a transition, an Action or a Suspense reveal.',
    ],
    ask: [
      'What does the user see in the first 100 ms after the click, and what do they see on failure?',
      'Does the placeholder match the final layout, and what does that do to CLS?',
      'Does this animation animate only `transform` and `opacity`, and does it respect `prefers-reduced-motion`?',
    ],
    redFlags: [
      'A full-page spinner replacing content the user was already reading',
      'Optimistic updates on payments, deletes with no undo, or anything with side effects',
      'Animations longer than 400 ms that block interaction, or that play on every route change',
    ],
    tradeoff:
      'Optimistic UI and rich motion buy a faster feel, and cost extra states to design, rollback code to test and more motion to keep accessible.',
  },
  selfCheck: [
    {
      question:
        'A spinner and a skeleton both show for 1.2 s before the same content arrives. What does the skeleton change, measurably?',
      answer:
        'Not the wait. It reserves the final layout, so the content arrives without shifting the page and CLS stays low. It also makes the wait read as progress.',
    },
    {
      question:
        'You wrap each list item in `<ViewTransition>` and call `setItems(shuffled)` in a click handler. Nothing animates. Why?',
      answer:
        'The update is synchronous, so it commits immediately and React cannot hand it to the browser. Wrapping it in `startTransition` lets React start a view transition around the commit.',
    },
    {
      question:
        'An optimistic comment is on screen and the request then fails. What does `useOptimistic` do, and what is still your job?',
      answer:
        'The optimistic value is dropped when the Action settles without committing it to real state, so the comment disappears. You still have to tell the user why, and ideally keep their draft so they can retry.',
    },
  ],
  links: [
    { label: 'ViewTransition', url: 'https://react.dev/reference/react/ViewTransition' },
    { label: 'useOptimistic', url: 'https://react.dev/reference/react/useOptimistic' },
    {
      label: 'View Transition API',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API',
    },
    { label: 'Cumulative Layout Shift', url: 'https://web.dev/articles/cls' },
    {
      label: 'prefers-reduced-motion',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion',
    },
  ],
  glossary: [
    {
      term: 'Perceived performance',
      definition:
        'How fast an interface feels to the user. It depends on feedback, continuity and layout stability as much as on raw load time.',
    },
    {
      term: 'Skeleton screen',
      definition:
        'A grey placeholder with the same layout as the content that is loading, so nothing moves when the real content arrives.',
    },
    {
      term: 'Optimistic update',
      definition:
        'Showing the expected result of an action before the server confirms it, and rolling back if the server refuses.',
    },
    {
      term: 'View Transition',
      definition:
        'A browser feature that snapshots the old and new states of the page and animates between them. React 19.3 exposes it as `<ViewTransition>`.',
    },
    {
      term: 'CLS',
      definition:
        'Cumulative Layout Shift, the Core Web Vital that scores how much visible content moves unexpectedly while the page loads.',
    },
    {
      term: 'Easing',
      definition:
        'The acceleration curve of an animation. Ease out starts fast and settles, which suits things entering, and ease in suits things leaving.',
    },
  ],
};
