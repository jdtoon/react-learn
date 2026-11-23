import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '13-concurrent-react',
  number: 13,
  title: 'Concurrent React',
  track: 'performance',
  oneIdea:
    'Transitions let urgent updates (typing) interrupt expensive ones (filtering a huge list).',
  minutes: 12,
  phase: 2,
  outcomes: [
    'Explain how React prioritises updates and why a transition render can be paused and restarted',
    'Choose between `useTransition` and `useDeferredValue`, and say what each needs from the slow subtree',
    'Use `<Activity>` to keep a tab alive, and state what happens to its effects while it is hidden',
  ],
  sections: [
    {
      heading: 'Priorities, not parallelism',
      paragraphs: [
        'Concurrent React is not multithreading. It is a renderer that can pause. Updates carry a priority: typing and clicking are urgent, and an update marked as a **transition** is not. React renders the urgent update first and commits it, then works through the transition in time slices of about 5 ms, checking between components for anything more urgent.',
        'If a keystroke arrives mid-render, React abandons the stale transition render and restarts with the newest state. Nothing is committed half finished.',
      ],
    },
    {
      heading: 'Two tools, one idea',
      paragraphs: [
        '`useTransition` gives you `startTransition` to wrap a state update, plus an `isPending` flag. Use it when you own the setter. `useDeferredValue(value)` returns a copy that lags during urgent renders and catches up in the background. Use it when the value arrives from props or a hook you do not control.',
        'Both need a slow subtree React can skip. If the list is not memoised, it re-renders on the urgent pass anyway and nothing is gained. Slicing happens between components, so one component that takes 200 ms cannot be split. Transitions also keep revealed Suspense content on screen instead of falling back to a spinner.',
      ],
    },
    {
      heading: 'Activity',
      paragraphs: [
        '`<Activity mode="hidden">` hides a subtree with CSS and keeps its state and DOM. It cleans up the subtree\'s effects as if it had unmounted, and renders it at low priority. Use it for tabs, wizards and drawers people revisit, or to pre-render the likely next screen. Conditional rendering throws all of that away.',
        'Hidden trees cost memory, and their effects stop, so never rely on one running while hidden.',
      ],
    },
  ],
  labs: [
    {
      id: 'jank-meter',
      title: 'Jank meter',
      tryThis: [
        'In **Blocking** with a heavy list, press **Type "transition" for me**. Each keystroke waits for the whole list, so the bars climb into the red',
        'Switch to **useTransition** and type again. The input stays quick, the list lags behind the text and dims, and it catches up once you stop',
        'Try **useDeferredValue**. It gives the same result with no setter to wrap',
        'Untick **Wrap the list in memo** in a non-blocking mode and type again. The benefit disappears, because the list re-renders on every urgent pass',
      ],
      whatHappened:
        'In Blocking mode the input and the list change in one urgent render, so each key press pays for 200 rows. A transition splits that into two renders: a tiny urgent one that echoes the text, and an interruptible one for the list. When the next key arrives React drops the stale list render and starts over. The cost moves from input latency to list lag, and the total work does not shrink. It only works because memo lets the urgent pass skip the list.',
    },
    {
      id: 'activity-tabs',
      title: 'Tabs that keep state',
      tryThis: [
        'In **Unmount on switch**, type in **Compose**, open **Timer** for a few seconds, then return to **Compose**. The draft is gone. The log shows the timer cleaned up and started again from zero',
        'Switch to **Activity, hidden** and repeat. The draft survives and the timer resumes from where it stopped, although the log still shows its effect cleaned up and set up again',
        'Open **Catalogue** in each mode and compare the switch time, then leave and return',
      ],
      whatHappened:
        'Unmounting destroys a component and mounts a fresh one on return, paying the render cost every time. A hidden Activity keeps the instance, so state and DOM survive, but it still runs effect cleanup, which is why the timer stops while hidden and starts again on return. React renders hidden trees at low priority, so Catalogue can be ready before you click. The price is memory for every hidden tab.',
    },
  ],
  pitfalls: [
    {
      title: 'A slow child that is not memoised',
      symptom: 'The transition or deferred value is in place, yet typing is as laggy as before',
      cause:
        'The urgent render still re-renders the slow list with the old value, because without `memo` a child follows its parent. The background render is not what hurts',
      fix: 'Wrap the slow component in `memo` and pass it only the transitioned or deferred value, or enable the Compiler, which does this for you',
      bad: 'function Search({ items }) {\n  const [text, setText] = useState("");\n  const deferred = useDeferredValue(text);\n  return (\n    <>\n      <input value={text} onChange={(e) => setText(e.target.value)} />\n      <SlowList items={items} query={deferred} />\n    </>\n  );\n}',
      good: 'const SlowList = memo(function SlowList({ items, query }) {\n  return <List items={items} query={query} />;\n});',
    },
    {
      title: 'Putting the input itself in the transition',
      symptom: 'Characters appear late or jump back while typing in a controlled input',
      cause:
        'A transition is low priority by design, so the text echo waits behind other work. Controlled inputs need their value updated urgently',
      fix: 'Keep the input state urgent and transition only the state that drives the expensive render',
      bad: 'startTransition(() => setText(e.target.value));',
      good: 'setText(e.target.value);\nstartTransition(() => setQuery(e.target.value));',
    },
    {
      title: 'Expecting a transition to make slow code fast',
      symptom: 'A transition is added, the page feels smoother, and the CPU profile is unchanged',
      cause:
        'A transition reorders and slices work. It does not remove it, and an interrupted render may be thrown away and repeated. One component that renders for 200 ms cannot be sliced at all',
      fix: 'Reduce the work first with windowing, memoisation or moving it off the main thread, then use a transition for what remains',
    },
    {
      title: 'Relying on effects in a hidden Activity',
      symptom:
        'A feed stops polling, a socket closes or an analytics timer pauses when its tab is hidden',
      cause:
        'A hidden Activity cleans up its effects as if the component had unmounted, and sets them up again when it becomes visible',
      fix: 'Keep subscriptions that must outlive the tab above the Activity boundary, or accept the pause and refresh on return',
    },
  ],
  meeting: {
    say: [
      'Concurrent React is about priority, not threads. Rendering can pause and restart, so an urgent update like typing is not queued behind a slow one.',
      'Transition the update that causes the slow render, never the input itself. The input stays urgent.',
      '`useDeferredValue` is the same idea when we cannot wrap the setter. It only helps if the slow child is memoised.',
      "`<Activity>` hides a tab and keeps its state, but it cleans up that tab's effects while hidden.",
    ],
    ask: [
      'What exactly is slow: many components, or one component with an expensive render? A transition only helps with the first.',
      'Is the slow child memoised, or does it re-render on every keystroke anyway?',
      'What does the user see while the update is pending: the old content, a dimmed list, a skeleton?',
      'Do any effects in the hidden tab need to keep running?',
    ],
    redFlags: [
      '`startTransition` wrapped around the state of a controlled input',
      '`useDeferredValue` feeding a slow child that is not memoised',
      'A transition used to hide an expensive render rather than measuring and reducing it',
      'A hidden tab expected to keep polling or holding a connection open',
    ],
    tradeoff:
      'Transitions keep input responsive but the result arrives later, may be rendered more than once and shows stale UI meanwhile. Activity trades memory and background render work for instant tab switches that keep state.',
  },
  selfCheck: [
    {
      question:
        'A search box filters 5,000 rows. You wrap `setQuery` in `startTransition` and the input still stutters. Name two likely causes.',
      answer:
        'The list is not memoised, so it re-renders on the urgent pass with the old query. Or the cost sits in one component, which cannot be sliced. A third possibility is that the input value itself is inside the transition.',
    },
    {
      question: 'When do you pick `useDeferredValue` over `useTransition`?',
      answer:
        'When you do not own the setter, for example the value arrives as a prop or from a hook. `useTransition` wraps the update where you call it and gives `isPending`. Both give an urgent render with the old value first, then an interruptible render with the new one.',
    },
    {
      question:
        'A tab is hidden with `<Activity mode="hidden">`. What happens to its state, its DOM and its effects?',
      answer:
        'State and DOM are kept, and the DOM is hidden with CSS. Effects are cleaned up as if the component had unmounted, and run again when it becomes visible. It can still re-render, at low priority.',
    },
  ],
  links: [
    { label: 'useTransition', url: 'https://react.dev/reference/react/useTransition' },
    { label: 'useDeferredValue', url: 'https://react.dev/reference/react/useDeferredValue' },
    { label: 'Activity', url: 'https://react.dev/reference/react/Activity' },
    { label: 'React 19.2', url: 'https://react.dev/blog/2025/10/01/react-19-2' },
    { label: 'Interaction to Next Paint (INP)', url: 'https://web.dev/articles/inp' },
  ],
  glossary: [
    {
      term: 'Transition',
      definition:
        'A state update marked as non-urgent with `startTransition`. React renders it in an interruptible way and lets urgent updates go first.',
    },
    {
      term: 'Time slicing',
      definition:
        'Rendering in short slices, checking between components whether something more urgent needs the main thread.',
    },
    {
      term: 'Urgent update',
      definition:
        'An update tied to direct interaction, such as typing or clicking, that React renders and commits first.',
    },
    {
      term: 'Deferred value',
      definition:
        'A copy of a value from `useDeferredValue` that keeps its old value during an urgent render and updates in a later, interruptible render.',
    },
    {
      term: 'isPending',
      definition:
        'The flag from `useTransition` that is true while a transition is still rendering.',
    },
    {
      term: 'Activity',
      definition:
        'A component whose `mode` is `visible` or `hidden`. Hidden children keep their state and DOM, lose their effects, and render at low priority.',
    },
  ],
};
