import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '01-how-react-thinks',
  number: 1,
  title: 'How React thinks',
  track: 'foundations',
  oneIdea:
    'You describe what the UI should look like for a given state. React works out the DOM changes.',
  minutes: 12,
  phase: 2,
  outcomes: [
    'Describe a screen as a function of props and state, and say what React does with the description',
    'Tell an element, a component and an instance apart, and say which one is a plain object',
    'Decide where data lives: props flow down and are read-only, and state has one owner',
  ],
  sections: [
    {
      heading: 'UI is a function of state',
      paragraphs: [
        'React asks you to describe the screen for one moment: given these props and this state, here is the UI. You do not write the steps from the previous screen to the next. When state changes, React calls your component again, compares the new description with the last and changes only the DOM that differs.',
        'The imperative alternative keeps the DOM as the source of truth and mutates it from every event handler. Each handler must know every part of the screen it affects, so the cases to get right grow with handlers times affected parts.',
      ],
    },
    {
      heading: 'Elements, components, instances',
      paragraphs: [
        'A component is a function. Calling it returns **elements**: plain objects such as `{ type, props, key }` that describe what you want. An element is not a DOM node and is cheap to create. React keeps an **instance** for each mounted component, holding its state and its place in the tree, and creates DOM nodes for the host elements.',
        'You write components and return elements. React owns instances and nodes. Every render produces a new tree of elements, while instances and nodes persist.',
      ],
    },
    {
      heading: 'One-way data flow',
      paragraphs: [
        'Data moves down the tree. A parent passes **props** to its children and a child may not change them. **State** is memory that one component owns, kept by React between renders.',
        'A child that needs to change the parent data calls a function the parent passed down, and the parent sets its own state. Props and state are the only inputs to a render. Anything you can calculate from them is not another piece of state.',
      ],
    },
    {
      heading: 'What the model costs',
      paragraphs: [
        'Describing the result makes the UI predictable and testable from inputs alone. Concurrent rendering, server rendering and the React Compiler all depend on render being a pure calculation that React can repeat or discard.',
        'The price is discipline. Render must not mutate its inputs, touch the DOM or start timers. Side effects belong in event handlers and effects.',
      ],
    },
  ],
  labs: [
    {
      id: 'describe-or-command',
      title: 'Describe or command?',
      tryThis: [
        'Press **Add tea**, then **Add coffee**. Watch the hand-written operations pile up while the described side makes one call per press',
        'Add tea and coffee a few times, then press **Clear cart** once. Compare how many operations each side needed for that one event',
        'Tick **Forget one branch**, add an item, then press **Clear cart**. The hand-written checkout stays enabled on an empty cart, and the described screen cannot drift',
      ],
      whatHappened:
        'Both sides respond to the same events. By hand, each event has to touch every part of the screen it affects: rows, count, empty message and checkout button, with different branches depending on what was there before. Skipping one branch leaves the screen out of step with the data. In the described version every event sets state and one function turns state into the whole screen, so there is no branch to forget.',
    },
    {
      id: 'element-xray',
      title: 'Element X-ray',
      tryThis: [
        'Press **Grace**. Only the lines that mention the name differ from the previous description',
        'Press **All the way down**, then toggle **Online**. Function components expand until only host elements and text remain',
        'Press **Render again, same props**. The render count climbs, the page and the description stay the same, and the two elements are different objects',
      ],
      whatHappened:
        'A component call returns elements, which are plain objects describing the tree you want. React creates a fresh set on every render and compares it with the previous set, so identical descriptions cost nothing to apply. The render count counts the function being called again, not the DOM being touched.',
    },
  ],
  pitfalls: [
    {
      title: 'Reaching into the DOM to change what React renders',
      symptom: 'The screen and the data disagree until something else forces a re-render',
      cause:
        'React compares each new description with the previous one, not with the live DOM. A node edited by hand is not repaired, so state and page drift apart',
      fix: 'Put the value in state and render it. Use a ref only for things React does not draw, such as focus or scroll position',
      bad: 'function Counter() {\n  const [count, setCount] = useState(0);\n  function onClick() {\n    setCount(count + 1);\n    document.getElementById("badge").textContent = String(count + 1);\n  }\n  return <button onClick={onClick}>Add</button>;\n}',
      good: 'function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <>\n      <button onClick={() => setCount(count + 1)}>Add</button>\n      <span id="badge">{count}</span>\n    </>\n  );\n}',
    },
    {
      title: 'Side effects during render',
      symptom:
        'Analytics events fire twice, a title flickers, or a counter outside React drifts in development',
      cause:
        'React may render a component more than once, or discard a render, so anything the function does besides returning elements can repeat or never be undone. StrictMode shows this on purpose',
      fix: 'Keep render a calculation. Do the work in the event handler that caused it, or in an effect when it must follow the screen',
      bad: 'function Page({ title }) {\n  document.title = title;\n  analytics.track("page_view");\n  return <h1>{title}</h1>;\n}',
      good: 'function Page({ title }) {\n  useEffect(() => {\n    document.title = title;\n  }, [title]);\n  return <h1>{title}</h1>;\n}',
    },
    {
      title: 'Mutating props',
      symptom:
        'A list changes order in a component that never owned it, or memoised siblings go stale',
      cause:
        'Props are the parent data, passed by reference. `sort`, `push` or an assignment changes the parent array in the middle of a render',
      fix: 'Copy before you change. `toSorted` and spread return a new array and leave the original alone',
      bad: 'function Leaderboard({ scores }) {\n  scores.sort((a, b) => b - a);\n  return <List items={scores} />;\n}',
      good: 'function Leaderboard({ scores }) {\n  const ranked = scores.toSorted((a, b) => b - a);\n  return <List items={ranked} />;\n}',
    },
    {
      title: 'Calling a component as a function',
      symptom:
        'A hook rule error, state that belongs to the wrong component, or a subtree that resets unexpectedly',
      cause:
        'A direct call runs the function inside the caller, so its hooks and state belong to the caller and React never sees a component at that position',
      fix: 'Render it as an element with JSX so React creates an instance of its own',
      bad: 'function Page() {\n  return <main>{Sidebar({ links })}</main>;\n}',
      good: 'function Page() {\n  return (\n    <main>\n      <Sidebar links={links} />\n    </main>\n  );\n}',
    },
  ],
  meeting: {
    say: [
      'We describe the UI for a given state and React works out the DOM changes. We do not write the steps between screens.',
      'Props come down from the parent and are read-only. State has one owner. When a child needs to change something, the owner passes it a function.',
      'An element is a plain object describing what to render. Creating them is cheap. The cost sits in what React does with them afterwards.',
    ],
    ask: [
      'Which component owns this state, and does anything above it also need it?',
      'Is this value state, or can we calculate it from the props and state we already have?',
      'Does this render do anything other than calculate JSX?',
    ],
    redFlags: [
      'Direct DOM writes such as `document.querySelector` or `innerHTML` inside a component React also renders',
      'A component that mutates its props or a module-level variable while rendering',
      'A value in state that two handlers must both remember to update',
      'A component called as a plain function instead of rendered as an element',
    ],
    tradeoff:
      'Describing the UI as a function of state removes a whole class of out-of-sync bugs and costs a render model you have to keep pure, plus the work of finding the right owner for each piece of state.',
  },
  selfCheck: [
    {
      question:
        'A teammate fixes a stale label by setting `textContent` on the node inside a click handler of a React component. What goes wrong?',
      answer:
        'React diffs against the previous elements, not the live DOM, so it will not repair the edit. The page and the state disagree until that text next changes. Put the value in state and render it, so the screen is always derived from state.',
    },
    {
      question:
        'A child component needs to change a value owned by its grandparent. How should the data flow, and why not let the child edit it?',
      answer:
        'The owner passes a function down as a prop, through the parent. The child calls it and the owner sets its own state, which renders down again with new props. Props are read-only so the owner stays the one place the value changes.',
    },
    {
      question:
        'In `return <Badge online />`, what is `<Badge online />`, and what does React keep for a mounted Badge between renders?',
      answer:
        'It is an element: a plain object with a type, props and key, created again on every render. Between renders React keeps an instance, which holds the state and the place in the tree, and the DOM nodes it produced.',
    },
  ],
  links: [
    { label: 'Thinking in React', url: 'https://react.dev/learn/thinking-in-react' },
    { label: 'Keeping components pure', url: 'https://react.dev/learn/keeping-components-pure' },
    {
      label: 'Sharing state between components',
      url: 'https://react.dev/learn/sharing-state-between-components',
    },
    { label: 'Describing the UI', url: 'https://react.dev/learn/describing-the-ui' },
    { label: 'createElement', url: 'https://react.dev/reference/react/createElement' },
  ],
  glossary: [
    {
      term: 'Declarative UI',
      definition:
        'Describing what the screen should look like for the current state and letting the framework work out the changes, instead of writing the DOM steps.',
    },
    {
      term: 'Element',
      definition:
        'A plain object, `{ type, props, key }`, that describes one piece of UI. It is returned by a component and recreated on every render.',
    },
    {
      term: 'Component',
      definition: 'A function that takes props and returns elements. React calls it to render.',
    },
    {
      term: 'Instance',
      definition:
        'What React keeps for a mounted component between renders: its state and its position in the tree.',
    },
    {
      term: 'Props',
      definition: 'Read-only inputs a parent passes to a child. Changing them is the parent job.',
    },
    {
      term: 'State',
      definition:
        'Memory owned by one component and kept by React between renders. Setting it schedules a new render.',
    },
    {
      term: 'One-way data flow',
      definition:
        'Data moves down the tree as props, and changes move up as calls to functions the owner passed down.',
    },
    {
      term: 'Pure render',
      definition:
        'A render that only calculates its elements from props and state, so React can safely repeat or discard it.',
    },
  ],
};
