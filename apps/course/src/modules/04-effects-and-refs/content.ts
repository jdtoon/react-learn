import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '04-effects-and-refs',
  number: 4,
  title: 'Effects, refs & synchronisation',
  track: 'foundations',
  oneIdea:
    'Effects are for syncing with systems outside React, not for reacting to your own state.',
  minutes: 12,
  phase: 2,
  outcomes: [
    'Say which outside system an effect synchronises with, and when it starts and stops',
    'Replace an effect that derives state or handles an event with render logic or a handler',
    'Write or review a fetch effect so a late response cannot overwrite the current one',
  ],
  sections: [
    {
      heading: 'Effects synchronise with the outside',
      paragraphs: [
        'An effect connects a component to something React does not control: a socket, a subscription, a timer, a non-React widget, the network. It runs after the commit. Each effect describes one process: how to start synchronising and how to stop.',
      ],
    },
    {
      heading: 'The lifecycle belongs to the effect',
      paragraphs: [
        'Think start and stop, not mount and update. The dependency array lists every reactive value the effect reads. When one changes, React runs the cleanup from the previous run with the old values, then setup with the new ones. An empty array means "synchronise once", not "silence the linter".',
        'In development, StrictMode runs setup, cleanup, setup on mount to prove the cleanup works. That is a test of your code, not a bug.',
      ],
    },
    {
      heading: 'You might not need one',
      paragraphs: [
        'Do not use an effect to derive state from props or state, to answer a user event, or to reset state when a prop changes. Render logic, event handlers and `key` cover those, and each extra effect adds a render and a frame of stale UI.',
        'For fetching, ignore stale responses or cancel them in cleanup, or use a data library or `use()` with Suspense. `useEffectEvent` lets an effect read the latest props or state without making them dependencies, for example when logging.',
      ],
    },
    {
      heading: 'Refs and layout effects',
      paragraphs: [
        'A ref is a box that React keeps across renders and that does not trigger a render when you change it. Use it for DOM nodes, timer ids and other values the screen does not draw. In React 19 `ref` is an ordinary prop on function components, and a ref callback may return a cleanup function.',
        '`useLayoutEffect` runs before the browser paints. Use it to measure the DOM and adjust before the user sees a frame, and remember that it blocks painting.',
      ],
    },
  ],
  labs: [
    {
      id: 'effect-lanes',
      title: 'Effect lanes',
      tryThis: [
        'Press **travel**. Read the new step: the cleanup for `general` runs first, then the setup for `travel`',
        'Type in the message draft. The render count climbs and the log stays still, because no dependency changed',
        'Tick **Depend on an object created during render** and type again. Every keystroke runs a cleanup and a setup',
        'Untick it, tick **Forget the cleanup function** and switch rooms. Open connections keep rising',
      ],
      whatHappened:
        'Each run of the effect is one synchronisation. When a dependency changes, React renders first, then runs the cleanup that belongs to the previous values and only then the setup for the new ones. An object created during render is a new value every time, so it re-synchronises on every render. Without a cleanup, old connections stay open. StrictMode shows that at once by running setup, cleanup, setup on mount.',
    },
    {
      id: 'fetch-race',
      title: 'Fetch race',
      tryThis: [
        'With **No cleanup**, press **Run the race**. Grace answers first, Ada answers last and the panel ends on Ada',
        'Switch to **Ignore flag** and run it again. Ada still arrives last, and her response is dropped',
        "Switch to **AbortController** and run it again. Ada's request is cancelled as soon as Grace is selected",
      ],
      whatHappened:
        'Responses arrive in any order, and without cleanup the last to arrive wins rather than the last requested. Cleanup runs as soon as the dependency changes, so it can mark the old response stale or cancel the request. Cancelling also frees the connection. Both fixes keep the panel in step with the selection.',
    },
  ],
  pitfalls: [
    {
      title: 'Fetching without cleanup',
      symptom:
        'Results belong to an older query or user, and the bug appears only on slow networks',
      cause:
        'Responses return in any order and each one sets state. The last to arrive wins, not the last requested',
      fix: 'Cancel the request in cleanup, or ignore its response. A data library or Suspense with `use()` handles this for you',
      bad: 'useEffect(() => {\n  fetchResults(query).then(setResults);\n}, [query]);',
      good: 'useEffect(() => {\n  let ignore = false;\n  fetchResults(query).then((data) => {\n    if (!ignore) setResults(data);\n  });\n  return () => {\n    ignore = true;\n  };\n}, [query]);',
    },
    {
      title: 'An effect that only derives state',
      symptom: 'An extra render on every change and one frame of stale output',
      cause:
        'The effect runs after the commit, so the screen paints with the old value first, then renders again with the copy',
      fix: 'Calculate the value while rendering. If a prop change should reset state, give the component a `key`',
      bad: 'const [fullName, setFullName] = useState("");\nuseEffect(() => {\n  setFullName(first + " " + last);\n}, [first, last]);',
      good: 'const fullName = first + " " + last;',
    },
    {
      title: 'Silencing the dependency lint',
      symptom: 'An effect keeps using an old prop or state value, or an empty array hides a bug',
      cause:
        'The effect reads a reactive value that is missing from the array, so it closes over a stale snapshot',
      fix: 'List the value. If that re-runs the effect too often, move the function inside it, or read the latest value with `useEffectEvent`',
      bad: 'useEffect(() => {\n  const id = setInterval(() => log(roomId), 1000);\n  return () => clearInterval(id);\n}, []);',
      good: 'const onTick = useEffectEvent(() => log(roomId));\n\nuseEffect(() => {\n  const id = setInterval(onTick, 1000);\n  return () => clearInterval(id);\n}, []);',
    },
    {
      title: 'Setup without cleanup',
      symptom:
        'Handlers fire twice, memory grows, or StrictMode in development shows doubled behaviour',
      cause:
        'Each run adds a listener, subscription or timer and nothing removes it, so they pile up',
      fix: 'Return a function that undoes exactly what setup did',
      bad: 'useEffect(() => {\n  window.addEventListener("resize", onResize);\n}, []);',
      good: 'useEffect(() => {\n  window.addEventListener("resize", onResize);\n  return () => window.removeEventListener("resize", onResize);\n}, []);',
    },
    {
      title: 'Reading a ref during render',
      symptom: 'The screen lags one update behind, or the value is null on first render',
      cause:
        'Changing `ref.current` does not schedule a render, and React sets DOM refs only at commit. Render cannot rely on either',
      fix: 'Read refs in event handlers and effects. If the screen must show the value, keep it in state',
      bad: 'function Box() {\n  const ref = useRef(null);\n  const width = ref.current.offsetWidth;\n  return <div ref={ref}>{width}</div>;\n}',
      good: 'function Box() {\n  const ref = useRef(null);\n  const [width, setWidth] = useState(0);\n  useLayoutEffect(() => {\n    setWidth(ref.current.offsetWidth);\n  }, []);\n  return <div ref={ref}>{width}</div>;\n}',
    },
  ],
  meeting: {
    say: [
      'An effect is for synchronising with something outside React, such as a socket, a timer or a browser API. If it only moves data between our own state, it should not be an effect.',
      'Each effect describes one synchronisation: how to start and how to stop. React re-runs it when its dependencies change, so cleanup is part of the contract.',
      'StrictMode runs setup and cleanup once more in development to check that stopping works. That is a test, not a bug.',
      'For fetching, we cancel or ignore stale responses, or use a data library. A bare fetch in an effect gives us races and no cache.',
    ],
    ask: [
      'What outside system does this effect synchronise with, and how does it stop?',
      'Could this be calculated during render, handled in the event that caused it, or reset with a key?',
      'Why is each dependency there, and what happens when a late response arrives after the user has moved on?',
    ],
    redFlags: [
      'An effect whose body is just `setX(f(y))`',
      'A fetch in an effect with no cleanup, `AbortController` or ignore flag',
      'A disable directive on the `exhaustive-deps` lint rule',
      'Effects chained together, each setting the state the next one watches',
      '`ref.current` read or written during render',
    ],
    tradeoff:
      'Effects reach the outside world, so each one is code React cannot reason about and that must clean up after itself; moving logic into render, events and keys keeps it visible, at the cost of deciding where each rule belongs.',
  },
  selfCheck: [
    {
      question:
        'In development an effect that opens a connection logs "connect, disconnect, connect" on mount. Is that a bug, and what does it tell you?',
      answer:
        'No. StrictMode runs setup, cleanup and setup again once to check that the effect can stop and restart cleanly. If it misbehaves, the cleanup is missing or incomplete. Production runs it once.',
    },
    {
      question:
        'A user clicks "Add to cart" and you need to post to the server. Effect or event handler, and why?',
      answer:
        'Event handler. The cause is a specific user action, not the fact that the component rendered. An effect would also run for any re-render that changes its dependencies, and twice on mount in StrictMode. Effects fit synchronising with what is on screen, such as a connection for the current room.',
    },
    {
      question:
        'A search box fetches inside an effect with `[query]` as the dependency, and results sometimes belong to an older query. Why, and what are two fixes?',
      answer:
        'Responses arrive in any order and the last to arrive wins, not the last requested. Cancel the previous request in cleanup with `AbortController`, or set an ignore flag so its response is dropped. A data library or `use()` with Suspense also handles it.',
    },
  ],
  links: [
    {
      label: 'Synchronizing with effects',
      url: 'https://react.dev/learn/synchronizing-with-effects',
    },
    {
      label: 'You might not need an effect',
      url: 'https://react.dev/learn/you-might-not-need-an-effect',
    },
    {
      label: 'Lifecycle of reactive effects',
      url: 'https://react.dev/learn/lifecycle-of-reactive-effects',
    },
    {
      label: 'Separating events from effects',
      url: 'https://react.dev/learn/separating-events-from-effects',
    },
    {
      label: 'Referencing values with refs',
      url: 'https://react.dev/learn/referencing-values-with-refs',
    },
  ],
  glossary: [
    {
      term: 'Effect',
      definition:
        'Code that runs after a commit to synchronise a component with a system outside React.',
    },
    {
      term: 'Cleanup function',
      definition:
        'The function an effect returns. React runs it before the next setup with changed dependencies, and on unmount.',
    },
    {
      term: 'Dependency array',
      definition:
        'The list of reactive values an effect reads. When any changes by `Object.is`, the effect re-synchronises.',
    },
    {
      term: 'Reactive value',
      definition:
        'A prop, state or anything calculated from them during render. Values that can change between renders.',
    },
    {
      term: 'Effect Event',
      definition:
        'A function made with `useEffectEvent` that always sees the latest props and state and is not a dependency. Call it only from inside effects.',
    },
    {
      term: 'Ref',
      definition:
        'A mutable box that React keeps across renders. Changing it does not cause a render.',
    },
    {
      term: 'useLayoutEffect',
      definition:
        'An effect that runs after the DOM updates but before the browser paints, used for measuring and adjusting layout.',
    },
    {
      term: 'Race condition',
      definition:
        'A bug where the result depends on which of several asynchronous operations finishes last, such as a late response overwriting a newer one.',
    },
  ],
};
