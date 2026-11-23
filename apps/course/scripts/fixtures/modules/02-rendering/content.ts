import type { ModuleContent } from '../../../../src/content/types';

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
    'Explain the trigger, render and commit steps',
    'Predict which components render again after a state change',
  ],
  sections: [
    {
      heading: 'Trigger, render, commit',
      paragraphs: [
        'A **render** is React calling your component function. The **commit** applies the result to the DOM.',
        'Setting state schedules a render. Props changing is not itself a trigger.',
      ],
    },
    {
      heading: 'Identity',
      paragraphs: ['Keys tell React which item is which. State belongs to a position in the tree.'],
    },
  ],
  labs: [
    {
      id: 'render-tree',
      title: 'Who re-renders?',
      tryThis: ['Change App state and watch the flashes', 'Wrap Sidebar in `memo` and repeat'],
      whatHappened: 'Everything under the changed component ran again, except the memoised one.',
    },
    {
      id: 'key-chaos',
      title: 'Key chaos',
      tryThis: ['Type in the first row, then insert at the top'],
      whatHappened: 'Index keys attach state to a position, not to the item.',
    },
  ],
  pitfalls: [
    {
      title: 'Index keys on a list that reorders',
      symptom: 'Typed text lands in the wrong row',
      cause: 'The key is the array index, so state follows the position',
      fix: 'Use a stable id as the key',
      bad: '<Row key={index} />',
      good: '<Row key={item.id} />',
    },
    {
      title: 'Copying props into state',
      symptom: 'The UI shows stale data after the parent updates',
      cause: 'State was initialised once from a prop',
      fix: 'Derive the value while rendering',
    },
    {
      title: 'Memo without measuring',
      symptom: 'More code and no visible speed-up',
      cause: 'The skipped render was already cheap',
      fix: 'Profile first, then memoise the expensive part',
    },
  ],
  meeting: {
    say: [
      'A re-render is React calling the function again, not the DOM being rebuilt.',
      'A parent rendering re-renders its children by default.',
    ],
    ask: ['Did we measure before adding `memo`?', 'Could this state live lower in the tree?'],
    redFlags: [
      '`useEffect` used to copy one piece of state into another',
      'Array index keys on a list that reorders',
    ],
    tradeoff: 'Memoisation trades memory and complexity for skipped work.',
  },
  selfCheck: [
    {
      question: 'Why did the child render when its props did not change?',
      answer: 'Its parent rendered.',
    },
    { question: 'What happens when you set state to the same value?', answer: 'React bails out.' },
    { question: 'What does changing a key do?', answer: 'It resets the subtree state.' },
  ],
  links: [
    { label: 'Render and Commit', url: 'https://react.dev/learn/render-and-commit' },
    {
      label: 'Preserving and Resetting State',
      url: 'https://react.dev/learn/preserving-and-resetting-state',
    },
    { label: 'Rendering Lists', url: 'https://react.dev/learn/rendering-lists' },
  ],
  glossary: [
    { term: 'Render', definition: 'Calling a component function to get its output.' },
    { term: 'Commit', definition: 'Applying the computed changes to the DOM.' },
    { term: 'key', definition: 'The identity React uses to match list items between renders.' },
  ],
};
