import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '03-state-snapshots',
  number: 3,
  title: 'State & the snapshot model',
  track: 'foundations',
  oneIdea:
    'State is a snapshot per render. Setting it schedules a new render; it does not change a variable.',
  minutes: 12,
  phase: 2,
  outcomes: [
    'Predict which value a handler, timer or closure sees from the render that created it',
    'Choose between a plain value and an updater function, and explain batching',
    'Review state for mutation, derived values and duplicated data',
  ],
  sections: [
    {
      heading: 'State is a snapshot',
      paragraphs: [
        'Each render sees a fixed value of state, like a photograph. `setCount(count + 1)` does not change the `count` in the function that is running. It asks React to render again with a new value. Every handler and closure made in that render keeps the old snapshot, including a timeout that fires later.',
      ],
    },
    {
      heading: 'Batching and updaters',
      paragraphs: [
        'React batches every update from one event into a single render. Three calls of `setCount(count + 1)` all read the same snapshot, so they add 1 once. An updater, `setCount(c => c + 1)`, is queued and applied to the latest value, so three calls add 3.',
        'Use an updater whenever the next value depends on the previous one. Since React 18, batching also covers timeouts, promises and native handlers. Updater functions must be pure, because React may call them twice in development.',
      ],
    },
    {
      heading: 'Immutability',
      paragraphs: [
        'React compares state with `Object.is`. Mutate an array or object in place and the reference is unchanged, so React sees nothing to do and anything memoised on it goes stale. Copy instead: `{ ...user, name }`, `[...items, item]`, `items.toSorted()`.',
        'Treat state as read-only. Deeply nested data is awkward to copy, so flatten it or use Immer.',
      ],
    },
    {
      heading: 'The shape of state',
      paragraphs: [
        'Keep the minimum. A value you can calculate from props or state is derived: compute it while rendering instead of storing and syncing it. Avoid duplicated state, contradictory flags such as `isLoading` with `isError`, and props mirrored into state.',
        'Keep state in the component that uses it. Lift it to the nearest common parent only when two siblings need the same value.',
      ],
    },
  ],
  labs: [
    {
      id: 'batching',
      title: 'Three calls, one render',
      tryThis: [
        'Press **Add 3 with count + 1** on the left and **Add 3 with an updater** on the right',
        'Press each button again. The left counter climbs by 1 each time, the right one by 3',
        'Compare the render counts. Each press adds one render to both counters, however many calls the handler makes',
      ],
      whatHappened:
        'The handler runs against one snapshot. On the left every call reads the same `count` and queues the same "set to" value, and React keeps the last one. On the right each call queues an instruction, and React applies the queue to the latest value in order. Batching means the three calls produce one render either way.',
    },
    {
      id: 'stale-timer',
      title: 'What the timer remembers',
      tryThis: [
        'Press **Add 1, report in 2 s** once and wait. The screen shows 1, but the timer reports 0, the count from the render in which you clicked',
        'Press it three times within two seconds. The timer reports 0, 1 and 2 while the screen reads 3',
        'Read the lanes top to bottom. Each click reads its own snapshot, the screen moves on, and the timer reports the old value two seconds later',
      ],
      whatHappened:
        'The timeout closes over the `count` of the render in which the click happened. Later renders create new snapshots, but that closure never sees them. A report that lags the screen is a stale closure. Pass what the timer needs as an argument when it is scheduled, set state with an updater, or read the latest value from a ref (module 04).',
    },
  ],
  pitfalls: [
    {
      title: 'Reading state straight after setting it',
      symptom:
        'A log line right after the setter shows the old value, or calling the setter three times adds only 1',
      cause:
        'The variable is the snapshot of the render that is running. Setting state queues the next snapshot and never rewrites this one',
      fix: 'Use the value you computed, not the variable. When the next value depends on the previous one, pass an updater',
      bad: 'function onClick() {\n  setCount(count + 1);\n  console.log(count);\n}',
      good: 'function onClick() {\n  const next = count + 1;\n  setCount(next);\n  console.log(next);\n}',
    },
    {
      title: 'Mutating state in place',
      symptom:
        'The list does not update until something else renders, or a memoised child shows stale data',
      cause:
        '`push` changes the existing array, so `Object.is` sees the same reference and React bails out. The change also leaks into earlier snapshots',
      fix: 'Create a new array or object and set that',
      bad: 'function add(item) {\n  items.push(item);\n  setItems(items);\n}',
      good: 'function add(item) {\n  setItems([...items, item]);\n}',
    },
    {
      title: 'Storing derived data in state',
      symptom: 'Two values disagree after an update, or a duplicate effect keeps them in step',
      cause:
        'The filtered list or full name was copied into state, so every change must be remembered in two places and sooner or later one is missed',
      fix: 'Store the source and calculate the rest while rendering. Reach for `useMemo` only after measuring a slow calculation',
      bad: 'const [filtered, setFiltered] = useState(items);\nuseEffect(() => {\n  setFiltered(items.filter((item) => item.name.includes(query)));\n}, [items, query]);',
      good: 'const filtered = items.filter((item) => item.name.includes(query));',
    },
    {
      title: 'A stale closure in a timer',
      symptom:
        'A counter driven by `setInterval` stops at 1, or a delayed callback reports an old value',
      cause:
        'The callback closes over the count of the render that created it and keeps using that snapshot on every tick',
      fix: 'Use an updater so the new value comes from the latest state, not from the closure',
      bad: 'useEffect(() => {\n  const id = setInterval(() => setCount(count + 1), 1000);\n  return () => clearInterval(id);\n}, []);',
      good: 'useEffect(() => {\n  const id = setInterval(() => setCount((c) => c + 1), 1000);\n  return () => clearInterval(id);\n}, []);',
    },
  ],
  meeting: {
    say: [
      'State is a snapshot. Setting it schedules a render with a new value and does not change the variable in the function that is running.',
      'Updates in one event are batched into one render. When the next value depends on the previous one, we pass an updater.',
      'We never mutate state. We copy it, because React compares references and a mutated object looks unchanged.',
      'If a value can be calculated from props or state, it should not be state.',
    ],
    ask: [
      'Is this value stored in state, or could we derive it while rendering?',
      'What does this timer or async callback close over, and is that still the snapshot we want?',
      'Who owns this state, and do two components really need to share it?',
    ],
    redFlags: [
      '`push`, `splice`, `sort` or direct assignment on an array or object that lives in state',
      'Two pieces of state that must always change together, or an effect that copies one into the other',
      '`setInterval` or `setTimeout` reading a state variable instead of using an updater',
      'Flags such as `isLoading` and `isError` that can both be true',
    ],
    tradeoff:
      'Copying state on every update keeps changes visible to React and makes undo and memoisation straightforward, at the cost of some allocation and awkward code for deeply nested data. Flatten the shape or use Immer where it hurts.',
  },
  selfCheck: [
    {
      question:
        'A handler calls `setCount(count + 1)` three times with `count` at 0, then logs `count`. What is logged, and what does the next render show?',
      answer:
        'It logs 0, and the next render shows 1. Every call read the same snapshot and queued "set to 1". With `setCount(c => c + 1)` three times, React applies the queue in order and the next render shows 3.',
    },
    {
      question:
        'A `setTimeout` created in a click handler fires after the user has clicked four more times. Which count does it see, and why?',
      answer:
        'The count from the render in which the handler ran. The closure captured that snapshot and never sees later ones. Pass the value in when scheduling, use an updater if it sets state, or read the latest value from a ref.',
    },
    {
      question:
        '`items.push(newItem); setItems(items);` does not update the screen. Why, and what is the smallest fix?',
      answer:
        'The array is the same reference, so `Object.is` reports no change and React bails out. The mutation also corrupts earlier snapshots. Use `setItems([...items, newItem])`.',
    },
  ],
  links: [
    { label: 'State as a snapshot', url: 'https://react.dev/learn/state-as-a-snapshot' },
    {
      label: 'Queueing a series of state updates',
      url: 'https://react.dev/learn/queueing-a-series-of-state-updates',
    },
    {
      label: 'Updating objects in state',
      url: 'https://react.dev/learn/updating-objects-in-state',
    },
    {
      label: 'Choosing the state structure',
      url: 'https://react.dev/learn/choosing-the-state-structure',
    },
    { label: 'useState', url: 'https://react.dev/reference/react/useState' },
  ],
  glossary: [
    {
      term: 'Snapshot',
      definition:
        'The fixed values of props and state that one render sees. Handlers and closures created in that render keep them.',
    },
    {
      term: 'Batching',
      definition: 'React grouping all state updates from one event or task into a single render.',
    },
    {
      term: 'Updater function',
      definition:
        'A function passed to a state setter, such as `c => c + 1`, that React applies to the latest queued value. It must be pure.',
    },
    {
      term: 'Immutability',
      definition:
        'Never changing a value in place. To update state you create a copy so React can see the new reference.',
    },
    {
      term: 'Derived state',
      definition:
        'A value you can calculate from props or other state. Compute it while rendering instead of storing it.',
    },
    {
      term: 'Lifting state up',
      definition:
        'Moving state to the nearest common parent so two components can share it through props.',
    },
    {
      term: 'Stale closure',
      definition:
        'A function that keeps using the state or props of the render that created it after newer renders have happened.',
    },
  ],
};
