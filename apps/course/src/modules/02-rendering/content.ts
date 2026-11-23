import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '02-rendering',
  number: 2,
  title: 'Rendering & reconciliation',
  track: 'foundations',
  oneIdea:
    'A re-render is React calling your function again. The DOM only changes where the output differs.',
  minutes: 12,
  phase: 0,
  outcomes: [
    'Trace a state change through trigger, render and commit, and predict which components run',
    'Explain how element type, tree position and `key` decide whether React keeps or resets state',
    'Challenge a `memo` wrapper or an index key in review with a specific reason',
  ],
  sections: [
    {
      heading: 'Trigger, render, commit',
      paragraphs: [
        'Every screen update has three steps. A **trigger** (the first mount, or a state update) schedules work. **Render** is React calling your components to compute the next element tree. It must be pure and touches no DOM. **Commit** applies the differences to the DOM, then runs layout effects.',
        'A render can call a hundred components and commit one text change. React compares the new tree with the previous one and writes only what differs.',
      ],
    },
    {
      heading: 'What starts a render',
      paragraphs: [
        'A component renders for five reasons: it mounts, it set its own state, an external store it subscribes to changed, its parent rendered, or a context value it reads changed. A changed prop is a symptom of the parent rendering.',
        'Rendering flows down. When a component renders, every child element it creates renders too, whether or not its props changed. Two things stop that. `memo` compares each prop with `Object.is` and skips the render when all are equal. An element React already holds, such as `children` passed through a provider, is reused as is. Inline objects, arrays and functions are never equal, so they defeat `memo`. Context changes bypass both.',
        'Setting state to a value `Object.is` considers identical bails out and the children are skipped. React may still call the component once before it settles.',
      ],
    },
    {
      heading: 'Identity: type, position and key',
      paragraphs: [
        'After a render, React reconciles the new tree against the old one position by position. The same element type keeps the instance and updates its props. A different type discards the subtree, state included, and mounts a new one. In lists, `key` is the identity that lets React match items across inserts and reorders. Without keys React matches siblings by position and warns in development.',
        'React holds state against a position in the tree, outside your function. The same component at the same position keeps its state when props change, even when they now describe someone else. Change its `key` and it becomes a new instance, which is the clean way to reset state.',
      ],
    },
    {
      heading: 'StrictMode and the Compiler',
      paragraphs: [
        'In development, `StrictMode` renders each component twice and runs one extra setup and cleanup cycle for every effect, to expose impure renders and missing cleanup. Production is unaffected. Run the course in development and the lab counters start at 2: they count a layout effect, and StrictMode runs it twice on mount.',
        'The React Compiler automates much of the memoisation above. Module 12 covers it.',
      ],
    },
  ],
  labs: [
    {
      id: 'render-tree',
      title: 'Who re-renders?',
      tryThis: [
        'Press **Change Feed state**. Feed, `<Post A>`, `<Post B>` and `<ThemeBadge>` render, and every other box keeps its count',
        'Press **Change App state**. Tick **Wrap Sidebar in memo** and press **Change App state** again: Sidebar holds its count. Now tick **Pass a fresh array to Sidebar each render** and press **Change App state** once more: Sidebar renders again',
        'Press **Change theme**. Only the provider and `<ThemeBadge>` render, although `<ThemeBadge>` sits deep in the tree',
        'Press **Set App state to same value** and watch the summary below the tree',
      ],
      whatHappened:
        'A state update renders the component that owns the state and, by default, every child element it creates. Ancestors and siblings are untouched. `memo` skips a child only when every prop is `Object.is` equal, so a fresh array each render defeats it. Ticking memo swaps the component type, which is why Sidebar remounts and its counter restarts. Context bypasses the tree: the provider receives the app as `children`, so those are elements React already holds and it skips them, and only the consumer is forced to render. Identical state bails out before any child runs. In every case the commit writes far less than the render touched, and often nothing.',
    },
    {
      id: 'key-chaos',
      title: 'Key chaos',
      tryThis: [
        'Type `alpha` into the first row, then press **Insert at top**. The text stays in the top row, which now belongs to a different person',
        'Switch to **Stable ids**, type `alpha` into the first row and insert again. The text moves down with Ada',
        'With either strategy, press **Shuffle** and then **Remove first**. Compare where the text ends up',
      ],
      whatHappened:
        'With index keys the key is the position. After an insert, the top row still has key 0, so React reuses that instance, with its state, for a different item and mounts a new instance at the end. With stable ids the key travels with the item, so React matches each instance to its own item, moves it, and mounts only the new row. The row with the lowest render count is the instance React just created.',
    },
    {
      id: 'reset-with-key',
      title: 'Reset with a key',
      tryThis: [
        'Type a message to Ada, pin the conversation, then switch to Grace. The draft and the pin carry over, and the render count keeps climbing',
        'Switch to **Key by user id** and repeat. Each user starts empty and the render count starts again',
      ],
      whatHappened:
        'The editor sits at the same position with the same type, so React keeps the instance and only updates its props. Its state, the draft and the pin, belongs to that position. Giving it `key={user.id}` makes a different user a different identity: React discards the old instance and mounts a new one, state included.',
    },
  ],
  pitfalls: [
    {
      title: 'Index keys on a list that changes',
      symptom:
        'Typed text, focus or an open row lands on the wrong item after an insert, sort or delete',
      cause:
        'The key is the array index, so each instance is bound to a **position**, not to an item. React reuses it for whatever item now sits there',
      fix: 'Use a stable id that comes with the data. Never generate keys while rendering: `Math.random()` remounts every row on every render',
      bad: 'items.map((item, index) => (\n  <Row key={index} item={item} />\n))',
      good: 'items.map((item) => (\n  <Row key={item.id} item={item} />\n))',
    },
    {
      title: 'Copying a prop into state and syncing it with an effect',
      symptom:
        'A form shows the previous record for one frame, or keeps stale edits after the record changes',
      cause:
        '`useState(prop)` reads the prop once, on mount. The effect that patches it up runs after the stale render has already been committed',
      fix: 'Key the component by the identity of the record so it remounts clean, or derive the value while rendering',
      bad: 'function Editor({ user }) {\n  const [bio, setBio] = useState(user.bio);\n  useEffect(() => setBio(user.bio), [user.id]);\n  return <input value={bio} onChange={(e) => setBio(e.target.value)} />;\n}',
      good: '<Editor key={user.id} user={user} />',
    },
    {
      title: 'Defining a component inside another component',
      symptom:
        'An input loses focus and its text on every keystroke, or a subtree remounts on every parent render',
      cause:
        'The inner function is a new type on every render, so React sees a different component at that position and discards the old instance',
      fix: 'Declare components at module scope and pass data in as props',
      bad: 'function Form() {\n  const [name, setName] = useState("");\n  function NameField() {\n    return <input value={name} onChange={(e) => setName(e.target.value)} />;\n  }\n  return <NameField />;\n}',
      good: 'function NameField({ name, onChange }) {\n  return <input value={name} onChange={(e) => onChange(e.target.value)} />;\n}',
    },
    {
      title: 'Memo that never skips',
      symptom:
        'A `memo` wrapper is in place and the profiler still shows the component rendering on every parent render',
      cause:
        'A prop is a new object, array or function each render, so the shallow comparison always fails',
      fix: 'Hoist constant values out of the component, wrap callbacks in `useCallback`, or restructure so the expensive part receives `children` or lives lower in the tree',
      bad: 'const Chart = memo(function Chart({ options, onSelect }) {\n  return <button onClick={onSelect}>{options.title}</button>;\n});\n\nfunction Panel() {\n  const [, setCount] = useState(0);\n  return <Chart options={{ title: "Sales" }} onSelect={() => setCount((c) => c + 1)} />;\n}',
      good: 'const Chart = memo(function Chart({ options, onSelect }) {\n  return <button onClick={onSelect}>{options.title}</button>;\n});\n\nconst options = { title: "Sales" };\n\nfunction Panel() {\n  const [, setCount] = useState(0);\n  const onSelect = useCallback(() => setCount((c) => c + 1), []);\n  return <Chart options={options} onSelect={onSelect} />;\n}',
    },
  ],
  meeting: {
    say: [
      'A render is React calling the function again. A commit is the DOM change. Most renders commit little or nothing, so a render count alone says little about cost.',
      'Re-renders come from state, a parent rendering or context. A changed prop is a symptom of the parent rendering. Everything underneath runs again unless it is memoised or is `children` passed through.',
      'A key is identity. Index keys are fine on a list that never changes. Where items insert, reorder or delete, they attach state to the wrong item.',
      'To reset a component, change its key. That beats an effect that copies props into state.',
    ],
    ask: [
      'Where does this state live, and could it move lower so fewer components render when it changes?',
      'Did we profile before adding `memo`, and what did the numbers show before and after?',
      'What is the key on this list, and can items be inserted, reordered or removed?',
      'Is it slow because it renders too often, or because a single render is expensive?',
    ],
    redFlags: [
      '`useEffect` that copies a prop or one piece of state into another',
      '`memo` around components whose props include inline objects or callbacks',
      'Array index or `Math.random()` as the key on a list that changes',
      'A component defined inside another component body',
      'Treating a re-render as a DOM update, and contorting code to avoid renders that cost nothing',
    ],
    tradeoff:
      'Skipping renders with `memo` or by moving state down buys less work per update and costs extra code and comparisons, so it pays only where renders are frequent and expensive.',
  },
  selfCheck: [
    {
      question:
        'A parent renders and creates a child element with exactly the props it had last time. The child is not wrapped in `memo`. Does the child function run?',
      answer:
        'Yes. The parent rendered, so it created a new element for the child, and React does not compare props without `memo`. The exception is an element React already holds, such as `children` passed through, which it skips. The DOM only changes if the child returns something different.',
    },
    {
      question:
        'A chat window keeps the half-typed message from the previous contact when you switch contacts. What is the smallest fix, and why does it work?',
      answer:
        'Add `key={contact.id}` to the chat component. Without a key it is the same type at the same position, so React keeps its state. With the key, a different contact is a different identity and mounts fresh.',
    },
    {
      question:
        'A list of rows with text inputs uses the array index as the key. A new item is inserted at the top. What does the user see?',
      answer:
        'Each typed value stays at its position, so it now sits beside a different item, and the last item gets a freshly mounted row. React reused instances by position instead of matching them to items.',
    },
  ],
  links: [
    { label: 'Render and commit', url: 'https://react.dev/learn/render-and-commit' },
    {
      label: 'Preserving and resetting state',
      url: 'https://react.dev/learn/preserving-and-resetting-state',
    },
    { label: 'Rendering lists and keys', url: 'https://react.dev/learn/rendering-lists' },
    { label: 'memo', url: 'https://react.dev/reference/react/memo' },
    {
      label: 'A (Mostly) Complete Guide to React Rendering Behavior',
      url: 'https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/',
    },
  ],
  glossary: [
    {
      term: 'Trigger',
      definition:
        'The event that schedules a render: a first mount, a state update, or a change in an external store. A component then renders because it mounted, owns the changed state, subscribes to the changed store, has a parent that rendered, or reads a context that changed.',
    },
    {
      term: 'Render',
      definition:
        'React calling your component functions to compute the next element tree. It must be pure and does not touch the DOM.',
    },
    {
      term: 'Commit',
      definition:
        'Applying only the differences from a render to the DOM, then running layout effects.',
    },
    {
      term: 'Reconciliation',
      definition:
        'Comparing the new element tree with the previous one, by type and key, to decide what to keep, update or remount.',
    },
    {
      term: 'Key',
      definition:
        'A stable identity for an element among its siblings, used to match it across renders and to reset state on purpose.',
    },
    {
      term: 'Bail-out',
      definition:
        'React skipping work for a component and its children because nothing they depend on changed: identical state by Object.is, shallowly equal props under memo, or an element React already has.',
    },
    {
      term: 'Memoisation (memo)',
      definition:
        'Wrapping a component so React skips its render when every prop is shallowly equal to last time.',
    },
    {
      term: 'StrictMode',
      definition:
        'A development-only wrapper that renders twice and re-runs effect setup and cleanup to expose impure code.',
    },
  ],
};
