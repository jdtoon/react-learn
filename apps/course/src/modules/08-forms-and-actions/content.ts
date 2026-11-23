import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '08-forms-and-actions',
  number: 8,
  title: 'Forms & Actions',
  track: 'architecture',
  oneIdea: 'React 19 Actions make async submits, pending states and optimistic updates built-in.',
  minutes: 12,
  phase: 3,
  outcomes: [
    'Wire a form to an Action with `useActionState`, `useFormStatus` and `useOptimistic`, and say what each one owns',
    'Explain why an optimistic update rolls back on failure without any rollback code',
    'Choose between a native form with Actions and a form library from the form size and its rules',
  ],
  sections: [
    {
      heading: 'Controlled or uncontrolled',
      paragraphs: [
        'A controlled input keeps its value in state, so the form renders on every keystroke. An uncontrolled input keeps its value in the DOM, and you read it with `FormData` on submit. Controlled fits UI that reacts as the user types, such as live validation or a dependent field. For a plain submit, uncontrolled is less code and renders nothing while typing.',
      ],
    },
    {
      heading: 'Actions',
      paragraphs: [
        'An async function passed to `<form action>` is an **Action**. React runs it in a transition, so the page stays responsive, tracks the pending state and resets uncontrolled fields when it finishes. `useActionState(action, initial)` returns `[state, formAction, isPending]`. The action receives the previous state and the `FormData` and returns the next state, which is where validation errors and the saved record go. Overlapping submits queue in order.',
        '`useFormStatus()` from `react-dom` reads the pending state of the parent `<form>` from any child, so a shared submit button needs no props. It must be called in a child, never in the component that renders the form.',
      ],
    },
    {
      heading: 'Optimistic updates',
      paragraphs: [
        '`useOptimistic(value, reducer)` returns a copy of `value` that you change at once while an Action runs. When the Action settles, React drops the copy and renders the real `value`. On success that is the saved data. On failure it is the old data, so the rollback is automatic. Call the setter inside the Action, before the first `await`, and still tell the user it failed.',
      ],
    },
    {
      heading: 'Validation and form libraries',
      paragraphs: [
        'Client checks are for speed, never for safety. The server validates every submit, and a schema (Zod or Valibot) lets both sides share the rules. Return expected errors as state instead of throwing, which would reach an error boundary. A library such as React Hook Form or TanStack Form earns its place with large forms, field arrays, cross-field rules and per-field subscriptions. A few fields need only native validation and an Action. In a framework, a Server Function as the action lets the form submit before JavaScript loads (progressive enhancement).',
      ],
    },
  ],
  labs: [
    {
      id: 'optimistic-actions',
      title: 'Optimistic like and comment',
      tryThis: [
        'With the server **Healthy**, press **Like** and post a comment. Both appear at once, the comment marked as sending, then settle when the server answers',
        'Switch to **Down** and press **Like**. The count moves, then snaps back and an error explains. The event log shows the order',
        'Still on **Down**, post a comment. The row disappears and your text returns to the field',
        'Untick **Optimistic updates** and repeat. Nothing moves until the server answers, but `isPending` is true the whole time',
      ],
      whatHappened:
        'The submit runs as an Action inside a transition. `useActionState` flips `isPending` and `useFormStatus` flips `pending` in the child, at the same moment. `useOptimistic` shows a temporary copy of the confirmed state while the Action is in flight. When the Action settles, React discards the copy. On success the new confirmed state includes the change, and on failure the Action returned the old state, so the change vanishes with no rollback code. The text returns to the field because the Action puts it in state and the field reads it as `defaultValue`, which is where React restores a reset form to.',
    },
    {
      id: 'keystroke-renders',
      title: 'Keystrokes and renders',
      tryThis: [
        'Type a few characters into each form. The controlled form and its preview render on every keystroke. The uncontrolled form stays at its count',
        'Submit both. The uncontrolled form renders once, when the Action sets the saved values',
      ],
      whatHappened:
        'A controlled field stores each keystroke in state, so React renders the form and every child it creates, whether or not they changed. An uncontrolled field leaves the value in the DOM, and React is told nothing until the submit. The Action then reads `FormData` once. The trade is control: live validation or a mirrored preview needs the value on every keystroke, and only then is a controlled input worth the renders.',
    },
  ],
  pitfalls: [
    {
      title: 'Optimistic update outside an Action',
      symptom:
        'React warns that an optimistic update happened outside an Action or transition, and the optimistic value never shows or never reverts',
      cause:
        'The setter ran after an `await` in a plain event handler, so it is not inside a transition that React can settle',
      fix: 'Use the form `action`, or wrap the work in `startTransition`, and call the setter before the first `await`',
      bad: 'async function onClick() {\n  await save(item);\n  addOptimistic(item);\n}',
      good: 'function action(formData) {\n  addOptimistic(formData.get("title"));\n  return save(formData);\n}\n\n<form action={action}>',
    },
    {
      title: 'The form empties after a failed submit',
      symptom:
        'The server rejects the input, the error shows, and every field the user typed is blank again',
      cause:
        'React resets uncontrolled fields when the Action finishes, including when it returns an error',
      fix: 'Return the submitted values in the Action state and render them back as `defaultValue`',
      bad: 'return { error: "Title is too short" };\n\n<input name="title" />',
      good: 'return { error: "Title is too short", title };\n\n<input name="title" defaultValue={state.title} />',
    },
    {
      title: 'useFormStatus in the component that renders the form',
      symptom: '`pending` is always false, so the button never shows a busy state',
      cause:
        '`useFormStatus` reads the status of a parent `<form>`. The component that renders the form has no parent form above it',
      fix: 'Move the button into its own component, rendered inside the form',
      bad: 'function Form() {\n  const { pending } = useFormStatus();\n  return (\n    <form action={save}>\n      <button disabled={pending}>Save</button>\n    </form>\n  );\n}',
      good: 'function SaveButton() {\n  const { pending } = useFormStatus();\n  return <button disabled={pending}>Save</button>;\n}\n\n<form action={save}>\n  <SaveButton />\n</form>',
    },
    {
      title: 'Hand-written loading flags and thrown validation errors',
      symptom:
        'A stuck spinner after an error, or a full error screen because a field was too short',
      cause:
        'The flag is set in a `try` block and not cleared in every path. Throwing for an expected failure sends it to the nearest error boundary',
      fix: 'Let `isPending` and `useFormStatus` own pending state, and return validation errors as state',
      bad: 'setLoading(true);\nconst res = await save(values);\nif (!res.ok) throw new Error("Invalid");\nsetLoading(false);',
      good: 'const [state, action, isPending] = useActionState(save, { error: null });',
    },
  ],
  meeting: {
    say: [
      'An Action is an async function that React runs in a transition. It gives us pending state, ordered submits and error handling without hand-written loading flags.',
      'Optimistic UI is a temporary copy of state. React discards it when the Action ends, so a failure rolls back with no extra code. We still owe the user a message.',
      'The server validates whatever the client validates. Client checks are for speed.',
      'A form library earns its place with many fields, field arrays or cross-field rules. For a few fields, a native form with an Action is enough.',
    ],
    ask: [
      'What does the user see when this request fails? Is the rollback visible, and can they retry?',
      'Where is the validation schema, and does the server use the same one?',
      'Does a double click submit twice, and is the server operation safe to repeat?',
      'Does this form need to work before JavaScript loads?',
    ],
    redFlags: [
      '`isLoading` or `isSubmitting` booleans set by hand around a `try` and `finally`',
      'An optimistic update with no failure message or retry',
      'Validation that exists only in the browser',
      'A controlled input and `useState` for every field in a form that only submits',
      'A submit button that stays enabled while the request is in flight',
    ],
    tradeoff:
      'Optimistic updates make the interface feel instant and cost a visible rollback path, so use them for low-risk actions that usually succeed.',
  },
  selfCheck: [
    {
      question:
        'You call `useFormStatus()` in the component that renders the `<form>` and `pending` never becomes true. Why?',
      answer:
        'It reads the status of the form above the calling component, and the component that renders the form has none above it. Move the button into a child component rendered inside the form.',
    },
    {
      question:
        'An optimistic comment appears, the request fails and the comment disappears. What code removed it?',
      answer:
        'None. The optimistic value exists only while the Action is in flight. When the Action settles, React renders the real state, which never contained the comment. You still need to show an error.',
    },
    {
      question:
        'After a failed submit the form is empty again. Why does that happen, and what is the fix?',
      answer:
        'React resets uncontrolled fields when the Action finishes, even if it returned an error. Return the submitted values in the Action state and render them as `defaultValue`.',
    },
  ],
  links: [
    { label: 'useActionState', url: 'https://react.dev/reference/react/useActionState' },
    {
      label: 'useFormStatus',
      url: 'https://react.dev/reference/react-dom/hooks/useFormStatus',
    },
    { label: 'useOptimistic', url: 'https://react.dev/reference/react/useOptimistic' },
    { label: '<form>', url: 'https://react.dev/reference/react-dom/components/form' },
    { label: 'React 19 release notes', url: 'https://react.dev/blog/2024/12/05/react-19' },
  ],
  glossary: [
    {
      term: 'Action',
      definition:
        'An async function React runs inside a transition, usually passed to `<form action>`. React tracks its pending state and resets uncontrolled fields when it finishes.',
    },
    {
      term: 'Optimistic update',
      definition:
        'Showing the expected result before the server confirms it, then replacing it with the real result when the Action settles.',
    },
    {
      term: 'Controlled input',
      definition:
        'An input whose value lives in React state and is set on every render, so each keystroke renders the form.',
    },
    {
      term: 'Uncontrolled input',
      definition:
        'An input whose value lives in the DOM. You read it with `FormData` when the form is submitted.',
    },
    {
      term: 'Progressive enhancement',
      definition:
        'A form that submits and works before JavaScript loads, then becomes richer once React has hydrated. It needs a Server Function as the action.',
    },
    {
      term: 'Idempotent',
      definition:
        'An operation that has the same effect whether it runs once or several times. It makes a double submit or a retry safe.',
    },
  ],
};
