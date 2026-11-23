> Generated from the app's content. Edit `apps/course/src/modules/08-forms-and-actions/content.ts`.

# 08. Forms & Actions

**Architecture** · Module 08 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/08-forms-and-actions)

**The one idea:** React 19 Actions make async submits, pending states and optimistic updates built-in.

## After this you can

- Wire a form to an Action with `useActionState`, `useFormStatus` and `useOptimistic`, and say what each one owns
- Explain why an optimistic update rolls back on failure without any rollback code
- Choose between a native form with Actions and a form library from the form size and its rules

## The model

### Controlled or uncontrolled

A controlled input keeps its value in state, so the form renders on every keystroke. An uncontrolled input keeps its value in the DOM, and you read it with `FormData` on submit. Controlled fits UI that reacts as the user types, such as live validation or a dependent field. For a plain submit, uncontrolled is less code and renders nothing while typing.

### Actions

An async function passed to `<form action>` is an **Action**. React runs it in a transition, so the page stays responsive, tracks the pending state and resets uncontrolled fields when it finishes. `useActionState(action, initial)` returns `[state, formAction, isPending]`. The action receives the previous state and the `FormData` and returns the next state, which is where validation errors and the saved record go. Overlapping submits queue in order.

`useFormStatus()` from `react-dom` reads the pending state of the parent `<form>` from any child, so a shared submit button needs no props. It must be called in a child, never in the component that renders the form.

### Optimistic updates

`useOptimistic(value, reducer)` returns a copy of `value` that you change at once while an Action runs. When the Action settles, React drops the copy and renders the real `value`. On success that is the saved data. On failure it is the old data, so the rollback is automatic. Call the setter inside the Action, before the first `await`, and still tell the user it failed.

### Validation and form libraries

Client checks are for speed, never for safety. The server validates every submit, and a schema (Zod or Valibot) lets both sides share the rules. Return expected errors as state instead of throwing, which would reach an error boundary. A library such as React Hook Form or TanStack Form earns its place with large forms, field arrays, cross-field rules and per-field subscriptions. A few fields need only native validation and an Action. In a framework, a Server Function as the action lets the form submit before JavaScript loads (progressive enhancement).

## Labs

The labs run in the app. Each one below links to the live version.

### Optimistic like and comment

Try this:

- With the server **Healthy**, press **Like** and post a comment. Both appear at once, the comment marked as sending, then settle when the server answers
- Switch to **Down** and press **Like**. The count moves, then snaps back and an error explains. The event log shows the order
- Still on **Down**, post a comment. The row disappears and your text returns to the field
- Untick **Optimistic updates** and repeat. Nothing moves until the server answers, but `isPending` is true the whole time

[Open the live lab](https://jdtoon.github.io/react-learn/modules/08-forms-and-actions#lab-optimistic-actions)

### Keystrokes and renders

Try this:

- Type a few characters into each form. The controlled form and its preview render on every keystroke. The uncontrolled form stays at its count
- Submit both. The uncontrolled form renders once, when the Action sets the saved values

[Open the live lab](https://jdtoon.github.io/react-learn/modules/08-forms-and-actions#lab-keystroke-renders)

## Pitfalls

### Optimistic update outside an Action

- **Symptom:** React warns that an optimistic update happened outside an Action or transition, and the optimistic value never shows or never reverts
- **Cause:** The setter ran after an `await` in a plain event handler, so it is not inside a transition that React can settle
- **Fix:** Use the form `action`, or wrap the work in `startTransition`, and call the setter before the first `await`

Bad:

```tsx
async function onClick() {
  await save(item);
  addOptimistic(item);
}
```

Good:

```tsx
function action(formData) {
  addOptimistic(formData.get("title"));
  return save(formData);
}

<form action={action}>
```

### The form empties after a failed submit

- **Symptom:** The server rejects the input, the error shows, and every field the user typed is blank again
- **Cause:** React resets uncontrolled fields when the Action finishes, including when it returns an error
- **Fix:** Return the submitted values in the Action state and render them back as `defaultValue`

Bad:

```tsx
return { error: "Title is too short" };

<input name="title" />
```

Good:

```tsx
return { error: "Title is too short", title };

<input name="title" defaultValue={state.title} />
```

### useFormStatus in the component that renders the form

- **Symptom:** `pending` is always false, so the button never shows a busy state
- **Cause:** `useFormStatus` reads the status of a parent `<form>`. The component that renders the form has no parent form above it
- **Fix:** Move the button into its own component, rendered inside the form

Bad:

```tsx
function Form() {
  const { pending } = useFormStatus();
  return (
    <form action={save}>
      <button disabled={pending}>Save</button>
    </form>
  );
}
```

Good:

```tsx
function SaveButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}

<form action={save}>
  <SaveButton />
</form>
```

### Hand-written loading flags and thrown validation errors

- **Symptom:** A stuck spinner after an error, or a full error screen because a field was too short
- **Cause:** The flag is set in a `try` block and not cleared in every path. Throwing for an expected failure sends it to the nearest error boundary
- **Fix:** Let `isPending` and `useFormStatus` own pending state, and return validation errors as state

Bad:

```tsx
setLoading(true);
const res = await save(values);
if (!res.ok) throw new Error("Invalid");
setLoading(false);
```

Good:

```tsx
const [state, action, isPending] = useActionState(save, { error: null });
```

## In the meeting

**Say**

- An Action is an async function that React runs in a transition. It gives us pending state, ordered submits and error handling without hand-written loading flags.
- Optimistic UI is a temporary copy of state. React discards it when the Action ends, so a failure rolls back with no extra code. We still owe the user a message.
- The server validates whatever the client validates. Client checks are for speed.
- A form library earns its place with many fields, field arrays or cross-field rules. For a few fields, a native form with an Action is enough.

**Ask**

- What does the user see when this request fails? Is the rollback visible, and can they retry?
- Where is the validation schema, and does the server use the same one?
- Does a double click submit twice, and is the server operation safe to repeat?
- Does this form need to work before JavaScript loads?

**Red flags**

- `isLoading` or `isSubmitting` booleans set by hand around a `try` and `finally`
- An optimistic update with no failure message or retry
- Validation that exists only in the browser
- A controlled input and `useState` for every field in a form that only submits
- A submit button that stays enabled while the request is in flight

**Trade-off:** Optimistic updates make the interface feel instant and cost a visible rollback path, so use them for low-risk actions that usually succeed.

## Self-check

1. You call `useFormStatus()` in the component that renders the `<form>` and `pending` never becomes true. Why?

   <details>
   <summary>Answer</summary>

   It reads the status of the form above the calling component, and the component that renders the form has none above it. Move the button into a child component rendered inside the form.

   </details>

2. An optimistic comment appears, the request fails and the comment disappears. What code removed it?

   <details>
   <summary>Answer</summary>

   None. The optimistic value exists only while the Action is in flight. When the Action settles, React renders the real state, which never contained the comment. You still need to show an error.

   </details>

3. After a failed submit the form is empty again. Why does that happen, and what is the fix?

   <details>
   <summary>Answer</summary>

   React resets uncontrolled fields when the Action finishes, even if it returned an error. Return the submitted values in the Action state and render them as `defaultValue`.

   </details>

## Go deeper

- [useActionState](https://react.dev/reference/react/useActionState)
- [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [useOptimistic](https://react.dev/reference/react/useOptimistic)
- [<form>](https://react.dev/reference/react-dom/components/form)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
