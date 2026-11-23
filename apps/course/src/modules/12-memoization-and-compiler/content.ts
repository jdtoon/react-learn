import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '12-memoization-and-compiler',
  number: 12,
  title: 'Re-renders, memoisation & the Compiler',
  track: 'performance',
  oneIdea: 'Most re-renders are cheap. Measure first, then memoise, or let the Compiler do it.',
  minutes: 12,
  phase: 2,
  outcomes: [
    'Tell a cheap re-render from a costly one, and reach for structure before `memo`',
    'Spot the referential-equality traps that silently defeat `memo`, `useMemo` and context',
    'State what the React Compiler automates, what it cannot fix, and when a list needs windowing',
  ],
  sections: [
    {
      heading: 'Measure before you memoise',
      paragraphs: [
        'A render is a function call, and a re-render that commits nothing is cheap. The cost is work per render times how often it runs. The React DevTools Profiler shows what rendered, why, and for how long. Act on renders that are slow or frequent.',
      ],
    },
    {
      heading: 'Structure first, then memoisation',
      paragraphs: [
        'Two structural fixes need no hooks. **Move state down** into the component that uses it, so fewer components render when it changes. **Lift content up** by passing an expensive subtree as `children`: the parent did not create it again, so React reuses it.',
        'Then memoisation. `memo` skips a component when every prop is `Object.is` equal. `useMemo` caches a value and `useCallback` caches a function, so their identity stays stable. The trap is **referential equality**: an inline object, array or function is new on every render, so one of them defeats `memo` and dependency arrays alike. So does a context provider whose `value` is a fresh object.',
      ],
    },
    {
      heading: 'The React Compiler',
      paragraphs: [
        'React Compiler 1.0 is a build-time plugin that memoises components and hooks automatically, at a finer grain than hand-written `memo`, even after an early return. It relies on the Rules of React: it skips what it cannot prove safe, and `eslint-plugin-react-hooks` points at those spots. Existing `useMemo` and `useCallback` can stay, and remain the way to control effect dependencies precisely. `"use no memo"` opts a component out.',
        'It removes needless re-renders. It does not make one slow render fast. This course does not build with it, so the lab memoises by hand.',
      ],
    },
    {
      heading: 'When the list is the problem',
      paragraphs: [
        'Rendering cost grows with DOM nodes, which memoisation cannot shrink. **Windowing** renders only the rows in view plus a little overscan, inside a spacer that keeps the scrollbar honest. It costs find-in-page, accessibility work and scroll restoration, so use it for genuinely long lists.',
      ],
    },
  ],
  labs: [
    {
      id: 'slow-tree',
      title: 'Slow tree',
      tryThis: [
        'With **No memoisation**, press **Type "quarterly revenue" for me**. `<Chart>` renders on every keystroke and the latency readout stays high',
        'Switch to **memo, inline props** and type again. The memo tag is on `<Chart>`, yet it still renders every time',
        'Try **memo, stable props**, then **Move state down**, then **Lift content up**. `<Chart>` keeps its count while the search box renders on each key',
        'In **memo, stable props**, press **Select a bar**. Dashboard renders and `<Chart>` does not, because its props are unchanged',
      ],
      whatHappened:
        '`<Chart>` burns 20 ms whenever it renders. In the first two strategies it renders on every keystroke: without `memo` a child always follows its parent, and with inline props `memo` sees a new object and a new function each time. Stable props let `memo` skip it. Moving state down and lifting content up skip it with no comparison at all, because React is never asked to render it. The keystroke latency falls by roughly one chart render.',
    },
    {
      id: 'windowed-list',
      title: 'Windowed list',
      tryThis: [
        'With windowing on and 10,000 rows, scroll the list. The node count stays at a few dozen while the row range moves',
        'Press **Windowing off** at 10,000 rows. The DOM grows to 30,000 nodes and the click-to-paint time jumps. Press **Jump to the middle** and scroll to feel the weight',
        'Switch back to **Windowing on** and choose 50,000 rows. The node count does not change',
      ],
      whatHappened:
        'Rendering cost scales with DOM nodes. `memo` cannot reduce that, because it only skips re-renders and the first mount still builds every row. Windowing works out from `scrollTop` which rows intersect the viewport, renders those plus a few extra, and places them inside a spacer as tall as the full list so the scrollbar behaves. Scrolling then swaps a handful of rows instead of laying out tens of thousands of nodes.',
    },
  ],
  pitfalls: [
    {
      title: 'A context value that is new on every render',
      symptom:
        'Every consumer re-renders whenever the provider does, even those that read a field that did not change',
      cause:
        'A fresh object as the provider `value` is never equal to the previous one, so context treats it as a change',
      fix: 'Memoise the value, or split state and actions into separate contexts so consumers subscribe to less',
      bad: 'function AuthProvider({ children }) {\n  const [user, setUser] = useState(null);\n  return <AuthContext value={{ user, setUser }}>{children}</AuthContext>;\n}',
      good: 'function AuthProvider({ children }) {\n  const [user, setUser] = useState(null);\n  const value = useMemo(() => ({ user, setUser }), [user]);\n  return <AuthContext value={value}>{children}</AuthContext>;\n}',
    },
    {
      title: 'Memo hooks that guard nothing',
      symptom:
        'Components are full of `useCallback` and `useMemo`, the code is harder to read, and the profiler shows no improvement',
      cause:
        'A stable function only helps when a memoised child or a dependency array receives it. Each hook still costs a comparison on every render',
      fix: 'Remove the hook unless the profiler shows a slow, frequent render that it fixes, or the Compiler is on and handles it',
      bad: 'const onOpen = useCallback(() => setOpen(true), []);\nreturn <button onClick={onOpen}>Open</button>;',
      good: 'return <button onClick={() => setOpen(true)}>Open</button>;',
    },
    {
      title: 'Code the Compiler has to skip',
      symptom:
        'A component gets no memoisation under the Compiler, or the hooks lint rules report it',
      cause:
        'Mutating props or state, or reading `ref.current` during render, breaks the Rules of React, so the Compiler cannot prove the output depends only on its inputs',
      fix: 'Make the render pure: copy before sorting, and read refs in handlers and effects. Use `"use no memo"` only as a stop-gap',
      bad: 'function Total({ items }) {\n  items.sort(byPrice);\n  return <p>{items[0].price}</p>;\n}',
      good: 'function Total({ items }) {\n  const sorted = [...items].sort(byPrice);\n  return <p>{sorted[0].price}</p>;\n}',
    },
    {
      title: 'Windowing without thinking about row size or access',
      symptom:
        'The scrollbar jumps, rows overlap, find-in-page misses off-screen text, or a screen reader announces the wrong list length',
      cause:
        'Fixed-height maths applied to variable content, and rows that are not in the DOM cannot be found or announced',
      fix: 'Measure rows or use a library that does, set `aria-setsize` and `aria-posinset`, offer search or filtering, and try `content-visibility: auto` first for moderate lists',
    },
  ],
  meeting: {
    say: [
      'A re-render is a function call. It only matters if it is slow or happens very often, so let us profile before we change anything.',
      'First choice is structure: move state down, or pass the heavy part in as children. Memoisation comes second, and one unstable prop, a new object, array or function, cancels it.',
      'The React Compiler automates `memo`, `useMemo` and `useCallback` when code follows the Rules of React. It will not speed up one slow render or shrink a huge list.',
      'If it is thousands of rows, the answer is windowing, not memo.',
    ],
    ask: [
      'What does the profiler show: which component, how long per render, and how often?',
      'Could this state live lower, or could this subtree be passed in as children?',
      'Is the Compiler enabled here, and do any components bail out of it?',
      'How many DOM nodes does this list produce, and does it need windowing or pagination?',
    ],
    redFlags: [
      '`memo` or `useCallback` added everywhere with no profiler evidence',
      'Inline objects, arrays or functions passed to a memoised child',
      'A context provider whose `value` is a new object on every render',
      'Mutating props or state, or reading `ref.current` during render, in a codebase that relies on the Compiler',
      'Thousands of DOM rows, with "memo will handle it" as the plan',
    ],
    tradeoff:
      'Memoisation trades memory, comparison cost and harder code for fewer renders, so it pays only where renders are slow or frequent. The Compiler lowers the code cost but still needs components to be pure.',
  },
  selfCheck: [
    {
      question:
        'A memoised `Chart` still renders on every keystroke in its parent, which passes `options={{ title }}`. Why, and what are two fixes?',
      answer:
        'The object is new on every render, so the shallow prop comparison fails. Hoist it or wrap it in `useMemo`, or move the typing state out of the parent so the parent does not render at all.',
    },
    {
      question: 'What can the React Compiler not do for you?',
      answer:
        'It cannot make one expensive render cheap, shrink a huge DOM, or optimise code that breaks the Rules of React, which it skips. It removes unnecessary re-renders and nothing more.',
    },
    {
      question:
        'A 50,000-row table is slow to mount and to scroll. Would wrapping each row in `memo` fix it?',
      answer:
        'No. `memo` only skips re-renders, and the first mount still creates every row and its DOM. Windowing renders just the rows in view.',
    },
  ],
  links: [
    {
      label: 'React Compiler introduction',
      url: 'https://react.dev/learn/react-compiler/introduction',
    },
    { label: 'React Compiler 1.0', url: 'https://react.dev/blog/2025/10/07/react-compiler-1' },
    { label: 'memo', url: 'https://react.dev/reference/react/memo' },
    { label: 'useMemo', url: 'https://react.dev/reference/react/useMemo' },
    {
      label: 'Virtualize large lists with react-window',
      url: 'https://web.dev/articles/virtualize-long-lists-react-window',
    },
  ],
  glossary: [
    {
      term: 'Referential equality',
      definition:
        'Two values being the same object in memory, as `Object.is` checks. Two identical-looking objects created separately are not equal.',
    },
    {
      term: 'memo',
      definition:
        'A wrapper that makes React skip a component render when every prop is `Object.is` equal to last time.',
    },
    {
      term: 'useMemo and useCallback',
      definition:
        'Hooks that cache a computed value or a function between renders, so their identity only changes when their dependencies do.',
    },
    {
      term: 'React Compiler',
      definition:
        'A build-time tool that adds memoisation to components and hooks automatically, provided the code follows the Rules of React.',
    },
    {
      term: 'Windowing',
      definition:
        'Also called virtualisation: rendering only the rows of a long list that are in or near the viewport.',
    },
    {
      term: 'Overscan',
      definition:
        'A few extra rows rendered just outside the viewport in a windowed list so fast scrolling does not show gaps.',
    },
  ],
};
