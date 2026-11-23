> Generated from the app's content. Edit `apps/course/src/modules/16-accessibility/content.ts`.

# 16. Accessibility

**Craft** · Module 16 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/16-accessibility)

**The one idea:** Semantic HTML gets you most of the way. Focus management is where React apps usually fail.

## After this you can

- Explain how markup becomes the accessibility tree, and why a native element beats a `div` with ARIA
- Give a custom control a name, a role and a keyboard path, and know when a live region is needed
- Say what a React app must do with focus on route changes, dialogs and removed elements

## The model

### Semantics first

The browser builds an accessibility tree from the DOM. Each node carries a **role**, an **accessible name** and **state**, and assistive technology and keyboard behaviour work from that tree. A native `<button>` arrives with a role, a name from its content, a place in the tab order and Enter and Space handling. A `div` with `onClick` has none of that. The first rule of ARIA is to use a native element when one exists, because ARIA changes what is announced and never how an element behaves. Adding `role="button"` to a `div` still leaves you to write `tabIndex`, key handlers and focus styles.

### Names, errors and announcements

Every control needs a name: a visible `<label>`, `aria-labelledby` or, for icon-only controls, `aria-label`. A placeholder is not a label. Link hints and errors to their field with `useId` and `aria-describedby`, and mark bad input with `aria-invalid`. Updates that appear while focus stays put, such as a saved toast or a result count, need a live region (`role="status"`) that is already in the DOM before its text changes. Text needs 4.5:1 contrast, large text and UI components 3:1, and animation should honour `prefers-reduced-motion`.

### Focus is where React apps fail

A client-side route change swaps content without a page load, so focus stays on the old link and a screen reader hears nothing. Move focus to the new heading or main region and update the document title. A modal dialog must take focus, trap it, close on Escape and hand focus back to its trigger. Native `<dialog>` with `showModal()` and libraries such as Radix do this for you. When the focused element unmounts, such as a deleted row, focus falls to the page body, so send it somewhere deliberate. Never remove the focus outline without replacing it.

### Testing

Automated checks such as axe and `eslint-plugin-jsx-a11y` find only part of the problems. Query by role and name in component tests, so a missing label fails the test. Then tab through every flow and listen to it with a screen reader.

## Labs

The labs run in the app. Each one below links to the live version.

### Accessibility X-ray

Try this:

- Switch **X-ray** on. Each element gets its tab order number, its role and its accessible name. A red chip means no name at all, and an amber chip means mouse only or a fragile name
- Click the **X-ray** button and press **Tab**. The chip of the focused element lights up. In **As written**, **Maybe later** is number 1, because a positive `tabindex` is visited before every other stop on the page
- Switch to **Fixed**. Every control gets a stop in page order, the icon button gains a name, and the landmarks and heading appear in the tree
- In **As written**, compare the tree list with the page. The logo and the Subscribe control look like controls but never appear as one

[Open the live lab](https://jdtoon.github.io/react-learn/modules/16-accessibility#lab-a11y-xray)

### Div soup against semantic HTML

Try this:

- Tick **Keyboard only**, which switches the mouse off over the form, then press **Tab** into **Div soup** and try to subscribe. You can reach the email field and nothing else
- Switch to **Semantic** and finish with the keyboard: type an email, Tab to the box, press Space, Tab to Subscribe, press Enter
- Notice the confirmation. In Semantic it sits in a live region, so a screen reader announces it. In Div soup nothing is announced
- Untick **Keyboard only** and use the mouse on Div soup. It works, which is why this kind of failure ships

[Open the live lab](https://jdtoon.github.io/react-learn/modules/16-accessibility#lab-div-soup-vs-semantic)

## Pitfalls

### A clickable `div` standing in for a button

- **Symptom:** Keyboard and screen reader users cannot find or operate the control, though it works with a mouse
- **Cause:** A `div` has no role, no tab stop and no key handling, so the click handler is reachable only by pointer
- **Fix:** Use a `<button type="button">` or an `<a href>`. Style it as you like and keep its semantics

Bad:

```tsx
<div className="btn" onClick={save}>
  Save
</div>
```

Good:

```tsx
<button type="button" className="btn" onClick={save}>
  Save
</button>
```

### Icon-only button with no name

- **Symptom:** A screen reader announces just "button", and voice control users cannot say what to press
- **Cause:** The button has no text content and the icon contributes no name
- **Fix:** Give it an `aria-label`, or visually hidden text, and hide the decorative icon

Bad:

```tsx
<button onClick={close}>
  <CloseIcon />
</button>
```

Good:

```tsx
<button onClick={close} aria-label="Close">
  <CloseIcon aria-hidden="true" />
</button>
```

### Route change that leaves focus behind

- **Symptom:** After following a link, focus stays in the old navigation and a screen reader announces nothing
- **Cause:** A client-side route change replaces content without a page load, so the browser never resets focus or announces a new page
- **Fix:** On navigation, focus the new page heading, which needs `tabIndex={-1}`, and update the document title

Good:

```tsx
const headingRef = useRef<HTMLHeadingElement>(null);
const { pathname } = useLocation();

useEffect(() => {
  headingRef.current?.focus();
}, [pathname]);

return <h1 ref={headingRef} tabIndex={-1}>Orders</h1>;
```

### Placeholder as the label

- **Symptom:** The field has no visible label once the user types, and some assistive technology announces nothing useful
- **Cause:** A placeholder is a hint, not a label. It vanishes on input, often has weak contrast and is only a fallback for the name
- **Fix:** Render a real `<label>` linked with `htmlFor` and `useId`. Hide it visually only if the design demands it

Bad:

```tsx
<input type="email" placeholder="Email" />
```

Good:

```tsx
const id = useId();

<label htmlFor={id}>Email</label>
<input id={id} type="email" />
```

## In the meeting

**Say**

- Semantics first. Native elements give us role, name, state and keyboard behaviour for free, so we reach for ARIA only when nothing native fits.
- Every control needs an accessible name and a keyboard path. Those two checks catch most of what goes wrong.
- In a React app the risk is focus. Route changes, dialogs and removed elements all need deliberate focus handling.
- Automated tests find only part of it, so we also tab through each flow and listen with a screen reader before release.

**Ask**

- Can every interactive element be reached and used with the keyboard alone, and is the focus always visible?
- Where does focus go after a route change, when a dialog opens and closes, and when a list item is deleted?
- Which design-system components own accessibility behaviour, and have they been tested with a screen reader?
- Which WCAG level are we committed to, and which legal requirements apply, such as the European Accessibility Act?

**Red flags**

- `div` or `span` with `onClick` instead of a button or link
- Icon-only buttons with no accessible name
- `outline: none` with no replacement focus style
- ARIA roles on elements that already have the semantics, or `tabIndex` above 0
- Hand-built modals with no focus trap, Escape handling or focus return

**Trade-off:** Building on native elements and testing with a keyboard costs a little care in each component, and it avoids costly retrofits, legal exposure and users who cannot finish the task.

## Self-check

1. A teammate adds `role="button"` and `onClick` to a `div`. What is still missing compared with a `<button>`?

   <details>
   <summary>Answer</summary>

   Focusability and keyboard activation. The role only changes what is announced, so the element still needs `tabIndex={0}`, Enter and Space handlers and a focus style. Using `<button>` gives all of it.

   </details>

2. After a client-side route change, a screen reader user hears nothing and keyboard focus is still on the old link. What do you do?

   <details>
   <summary>Answer</summary>

   Move focus to the new page, normally its main heading with `tabIndex={-1}` or the main region, and update the document title. A client-side route change has no page load, so the browser does none of this for you.

   </details>

3. A search input has only `placeholder="Search"`. Is it accessible, and what is the fix?

   <details>
   <summary>Answer</summary>

   Not reliably. The placeholder disappears as you type, often has weak contrast and serves only as a fallback name. Add a real `<label>` linked with `htmlFor` and `useId`, or an `aria-label` if the design hides the text.

   </details>

## Go deeper

- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Learn Accessibility](https://web.dev/learn/accessibility)
- [MDN: ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [MDN: the dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
