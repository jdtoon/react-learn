import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '05-component-design',
  number: 5,
  title: 'Component design & composition',
  track: 'architecture',
  oneIdea:
    'Compose with children and small parts instead of configuring one component with dozens of props.',
  minutes: 12,
  phase: 3,
  outcomes: [
    'Replace a prop-heavy component with a composable API and explain the trade in review',
    'Decide whether a component should be controlled, uncontrolled or both, and who owns the value',
    'Spot `cloneElement` injection and boolean layout flags as design smells',
  ],
  sections: [
    {
      heading: 'Composition over configuration',
      paragraphs: [
        'A component with a prop for every variation grows a branch for every requirement, and its props type becomes the real API. Composition inverts this: the component owns structure and behaviour, and the caller supplies the content. `children` is the simplest slot, and props that take elements, such as `header` or `footer`, cover a few more. Reach for composition when boolean flags change layout, or when props exist only to pass something through to a child.',
      ],
    },
    {
      heading: 'Compound and headless',
      paragraphs: [
        'Compound components share implicit state through context. `Tabs`, `Tabs.List`, `Tabs.Tab` and `Tabs.Panel` cooperate while the caller controls markup and order. Headless components and hooks go further: they own state, keyboard handling and ARIA, and no styling. A custom hook is the reuse unit for logic, a component the reuse unit for structure. Avoid `cloneElement` and `Children.map` to inject props, because a wrapper component in between breaks them.',
      ],
    },
    {
      heading: 'Controlled or uncontrolled',
      paragraphs: [
        'An uncontrolled component keeps its own state and takes a `defaultValue`. A controlled one is given its value and reports changes through `onChange`. Good libraries support both with one hook: use the prop when it is defined, otherwise internal state. Controlled gives the parent authority to read, set and veto. Pick one mode per instance for its whole life, because switching mid-life discards state and React warns.',
      ],
    },
    {
      heading: 'Types that keep the API honest',
      paragraphs: [
        'Make invalid combinations unrepresentable with discriminated unions, such as `{ kind: "link"; href: string } | { kind: "button"; onClick: () => void }`. Generic components keep item types flowing through a `Select` or a `Table`. Prefer a small closed set of variants over free-form style props. In React 19, `ref` is an ordinary prop, so there is no `forwardRef` wrapper to write.',
      ],
    },
  ],
  labs: [
    {
      id: 'prop-explosion',
      title: 'Prop explosion or parts?',
      tryThis: [
        'In **Configured**, tick the requirements from the top. Watch the props meter and the branch count climb while the call site grows',
        'Switch to **Composed** with the same boxes ticked. The card looks identical and the `Card` API does not change',
        'Tick **Put the badge over the image** in each mode and compare the call site: a new prop and branch, or one line moved',
      ],
      whatHappened:
        'Both cards render the same pixels. In the configured version every requirement becomes a prop and a branch inside the component, so the component must know every layout in advance and its props type becomes the real API. In the composed version the card owns structure and spacing, and the caller decides which parts exist and where they go. A new layout costs the caller a line and costs the component nothing. The price is more JSX at the call site.',
    },
    {
      id: 'state-ownership',
      title: 'Who owns the state?',
      tryThis: [
        'Stay on **Uncontrolled**. Type a note in Profile, tick **Profile has unsaved changes** and click Billing. The tab moves and the parent only hears afterwards',
        'Press **Jump to Billing**, then return to Profile. The note is gone, because remounting was the only way to set an uncontrolled tab',
        'Switch to **Controlled** and repeat. While the box is ticked the parent refuses both moves. Untick it and the jump keeps your note',
      ],
      whatHappened:
        'Both modes run the same `useControllableState` hook: a defined `value` wins, otherwise internal state does. Uncontrolled, the component owns the tab. The parent is told after the change through `onValueChange`, cannot refuse it, and can only reposition the tabs by remounting with a new `defaultValue`, which discards internal state. Controlled, the parent owns the tab: it can read it, set it, and veto a change by not updating it. Moving a live instance between modes is a bug, so the lab remounts when you switch.',
    },
  ],
  pitfalls: [
    {
      title: 'Boolean props that change layout',
      symptom:
        'A button takes `isPrimary`, `isLarge`, `isOutline` and `isLoading`, and nobody knows what happens when all four are set',
      cause:
        'Each flag multiplies the states the component must handle, and invalid combinations still type-check',
      fix: 'Use one closed `variant` union for the visual choice and compose the rest, such as a spinner passed as `children`',
      bad: '<Button isPrimary isOutline isLarge isLoading />',
      good: '<Button variant="outline" size="lg">\n  <Spinner />\n  Saving\n</Button>',
    },
    {
      title: 'Injecting props with cloneElement or Children.map',
      symptom:
        'A tab list works until someone wraps a tab in their own component, and then it silently stops being selected',
      cause:
        'The parent edits only its direct child elements, so a wrapper receives the injected prop and does not forward it',
      fix: 'Share state through context so a part works at any depth',
      bad: 'Children.map(children, (child) =>\n  cloneElement(child, { active: child.props.value === value }),\n)',
      good: 'function Tab({ value, children }) {\n  const { current, select } = useTabs();\n  return (\n    <button aria-selected={current === value} onClick={() => select(value)}>\n      {children}\n    </button>\n  );\n}',
    },
    {
      title: 'Switching between controlled and uncontrolled',
      symptom:
        'A field loses what the user typed, and the console warns about changing an input from uncontrolled to controlled',
      cause:
        'The value prop was `undefined` on one render and defined on the next, so ownership of the state moved mid-life',
      fix: 'Initialise with a defined value, or remount the component with a `key` when the mode must change',
      bad: 'const [name, setName] = useState();\n<input value={name} onChange={(e) => setName(e.target.value)} />',
      good: 'const [name, setName] = useState("");\n<input value={name} onChange={(e) => setName(e.target.value)} />',
    },
    {
      title: 'Render-prop sprawl',
      symptom:
        'A table takes `renderHeader`, `renderRow`, `renderEmpty`, `renderFooter` and `renderLoading`, and every caller passes all five',
      cause:
        'The component still owns the structure and asks the caller to fill every hole, which is configuration written as functions',
      fix: 'Expose parts or a headless hook and let the caller assemble the structure',
    },
  ],
  meeting: {
    say: [
      'If layout flags keep arriving on one component, give callers the parts instead of another prop.',
      'Compound components share state through context so callers control markup and order. Headless components own behaviour and accessibility but no styling.',
      'Controlled means the parent owns the value. Uncontrolled means the component does. Support both with one hook, and never flip an instance between them.',
      'Discriminated unions make invalid prop combinations fail to compile.',
    ],
    ask: [
      'How many props change the layout of this component, and which exist for only one caller?',
      'Is this controlled or uncontrolled, and can the parent veto a change?',
      'Could a custom hook own this logic so we stop copying the same effects between components?',
      'What happens when a caller wraps one of these parts in their own component?',
    ],
    redFlags: [
      'Boolean props that toggle layout, such as `isCompact`, `withFooter` or `noPadding`',
      '`cloneElement` or `Children.map` used to inject props into children',
      'A component that accepts `value` and `defaultValue` but ignores one of them',
      'A growing family of `renderX` props on a single component',
      'A reusable component whose props type is a long list of optional fields',
    ],
    tradeoff:
      'Composition keeps components small and gives callers control, but callers must assemble the parts correctly and the common case takes more JSX than one configured prop would.',
  },
  selfCheck: [
    {
      question:
        'A `Card` has `title`, `image`, `badge`, `badgePosition`, `footer`, `footerAlign` and `compact` props, and each sprint adds another. What is the structural problem and the usual remedy?',
      answer:
        'Every requirement adds a prop and a branch inside the component, so the props type becomes the real API and the component must anticipate every layout. Give it parts instead, such as `Card.Media`, `Card.Title` and `Card.Actions`, so callers compose the layout and the card stays small.',
    },
    {
      question:
        'A `Tabs` component accepts `value` and `defaultValue`. A parent passes `value={undefined}` on the first render and a string later. What goes wrong?',
      answer:
        'The instance starts uncontrolled with its own state and then becomes controlled, so the internal state is abandoned and built-in inputs warn. Choose one mode for the life of the instance, or remount with a `key` when the mode has to change.',
    },
    {
      question:
        'Why does `Children.map(children, (child) => cloneElement(child, { active }))` break when a caller wraps a tab in their own `MyTab` component?',
      answer:
        'It injects props into the direct child element only. `MyTab` receives `active` and must forward it, which nobody remembers to do. A compound component shares state through context, so a part works at any depth.',
    },
  ],
  links: [
    {
      label: 'Passing props, including JSX as children',
      url: 'https://react.dev/learn/passing-props-to-a-component',
    },
    {
      label: 'Sharing state between components (controlled and uncontrolled)',
      url: 'https://react.dev/learn/sharing-state-between-components',
    },
    {
      label: 'Reusing logic with custom hooks',
      url: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
    },
    {
      label: 'cloneElement and its alternatives',
      url: 'https://react.dev/reference/react/cloneElement',
    },
    {
      label: 'TypeScript: discriminated unions',
      url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions',
    },
  ],
  glossary: [
    {
      term: 'Composition',
      definition:
        'Building a component from smaller parts the caller assembles, instead of switching its behaviour with props.',
    },
    {
      term: 'Compound component',
      definition:
        'A set of components, such as Tabs and Tab, that share implicit state through context while the caller controls the markup.',
    },
    {
      term: 'Headless component',
      definition:
        'A component or hook that owns behaviour, state and accessibility but ships no styling, so the caller supplies the look.',
    },
    {
      term: 'Controlled component',
      definition:
        'A component whose value comes from a prop and whose changes are reported through a callback, so the parent owns the state.',
    },
    {
      term: 'Uncontrolled component',
      definition:
        'A component that keeps its own state, accepts only an initial `defaultValue`, and is repositioned from outside only by remounting.',
    },
    {
      term: 'Discriminated union',
      definition:
        'A TypeScript union whose members share a literal field, such as `kind`, so checking that field narrows the other props.',
    },
  ],
};
