import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '16-accessibility',
  number: 16,
  title: 'Accessibility',
  track: 'craft',
  oneIdea:
    'Semantic HTML gets you most of the way. Focus management is where React apps usually fail.',
  minutes: 12,
  phase: 4,
  outcomes: [
    'Explain how markup becomes the accessibility tree, and why a native element beats a `div` with ARIA',
    'Give a custom control a name, a role and a keyboard path, and know when a live region is needed',
    'Say what a React app must do with focus on route changes, dialogs and removed elements',
  ],
  sections: [
    {
      heading: 'Semantics first',
      paragraphs: [
        'The browser builds an accessibility tree from the DOM. Each node carries a **role**, an **accessible name** and **state**, and assistive technology and keyboard behaviour work from that tree. A native `<button>` arrives with a role, a name from its content, a place in the tab order and Enter and Space handling. A `div` with `onClick` has none of that. The first rule of ARIA is to use a native element when one exists, because ARIA changes what is announced and never how an element behaves. Adding `role="button"` to a `div` still leaves you to write `tabIndex`, key handlers and focus styles.',
      ],
    },
    {
      heading: 'Names, errors and announcements',
      paragraphs: [
        'Every control needs a name: a visible `<label>`, `aria-labelledby` or, for icon-only controls, `aria-label`. A placeholder is not a label. Link hints and errors to their field with `useId` and `aria-describedby`, and mark bad input with `aria-invalid`. Updates that appear while focus stays put, such as a saved toast or a result count, need a live region (`role="status"`) that is already in the DOM before its text changes. Text needs 4.5:1 contrast, large text and UI components 3:1, and animation should honour `prefers-reduced-motion`.',
      ],
    },
    {
      heading: 'Focus is where React apps fail',
      paragraphs: [
        'A client-side route change swaps content without a page load, so focus stays on the old link and a screen reader hears nothing. Move focus to the new heading or main region and update the document title. A modal dialog must take focus, trap it, close on Escape and hand focus back to its trigger. Native `<dialog>` with `showModal()` and libraries such as Radix do this for you. When the focused element unmounts, such as a deleted row, focus falls to the page body, so send it somewhere deliberate. Never remove the focus outline without replacing it.',
      ],
    },
    {
      heading: 'Testing',
      paragraphs: [
        'Automated checks such as axe and `eslint-plugin-jsx-a11y` find only part of the problems. Query by role and name in component tests, so a missing label fails the test. Then tab through every flow and listen to it with a screen reader.',
      ],
    },
  ],
  labs: [
    {
      id: 'a11y-xray',
      title: 'Accessibility X-ray',
      tryThis: [
        'Switch **X-ray** on. Each element gets its tab order number, its role and its accessible name. A red chip means no name at all, and an amber chip means mouse only or a fragile name',
        'Click the **X-ray** button and press **Tab**. The chip of the focused element lights up. In **As written**, **Maybe later** is number 1, because a positive `tabindex` is visited before every other stop on the page',
        'Switch to **Fixed**. Every control gets a stop in page order, the icon button gains a name, and the landmarks and heading appear in the tree',
        'In **As written**, compare the tree list with the page. The logo and the Subscribe control look like controls but never appear as one',
      ],
      whatHappened:
        'Assistive technology and the keyboard see the accessibility tree and the tab order, and neither is the pixels. A clickable `div` has no role and no tab stop, so it vanishes from both. An icon-only button has a role and a stop but no name, so a screen reader says only "button". A placeholder works as a name of last resort and vanishes when you type. A positive `tabindex` reorders the whole page. Native elements and a label for every control fix each of these without ARIA.',
    },
    {
      id: 'div-soup-vs-semantic',
      title: 'Div soup against semantic HTML',
      tryThis: [
        'Tick **Keyboard only**, which switches the mouse off over the form, then press **Tab** into **Div soup** and try to subscribe. You can reach the email field and nothing else',
        'Switch to **Semantic** and finish with the keyboard: type an email, Tab to the box, press Space, Tab to Subscribe, press Enter',
        'Notice the confirmation. In Semantic it sits in a live region, so a screen reader announces it. In Div soup nothing is announced',
        'Untick **Keyboard only** and use the mouse on Div soup. It works, which is why this kind of failure ships',
      ],
      whatHappened:
        'Both forms look the same and respond to a mouse. A `div` with `onClick` is not focusable, so Tab skips it, and it has no role, so a screen reader cannot tell it is a control. The semantic form gets focus order, Space on the checkbox, Enter to submit, a name for each field and a live status from native elements and one `role="status"`. The mouse hid the difference. The keyboard exposes it.',
    },
  ],
  pitfalls: [
    {
      title: 'A clickable `div` standing in for a button',
      symptom: 'Keyboard and screen reader users cannot find or operate the control, though it works with a mouse',
      cause:
        'A `div` has no role, no tab stop and no key handling, so the click handler is reachable only by pointer',
      fix: 'Use a `<button type="button">` or an `<a href>`. Style it as you like and keep its semantics',
      bad: '<div className="btn" onClick={save}>\n  Save\n</div>',
      good: '<button type="button" className="btn" onClick={save}>\n  Save\n</button>',
    },
    {
      title: 'Icon-only button with no name',
      symptom: 'A screen reader announces just "button", and voice control users cannot say what to press',
      cause: 'The button has no text content and the icon contributes no name',
      fix: 'Give it an `aria-label`, or visually hidden text, and hide the decorative icon',
      bad: '<button onClick={close}>\n  <CloseIcon />\n</button>',
      good: '<button onClick={close} aria-label="Close">\n  <CloseIcon aria-hidden="true" />\n</button>',
    },
    {
      title: 'Route change that leaves focus behind',
      symptom: 'After following a link, focus stays in the old navigation and a screen reader announces nothing',
      cause:
        'A client-side route change replaces content without a page load, so the browser never resets focus or announces a new page',
      fix: 'On navigation, focus the new page heading, which needs `tabIndex={-1}`, and update the document title',
      good: 'const headingRef = useRef<HTMLHeadingElement>(null);\nconst { pathname } = useLocation();\n\nuseEffect(() => {\n  headingRef.current?.focus();\n}, [pathname]);\n\nreturn <h1 ref={headingRef} tabIndex={-1}>Orders</h1>;',
    },
    {
      title: 'Placeholder as the label',
      symptom: 'The field has no visible label once the user types, and some assistive technology announces nothing useful',
      cause:
        'A placeholder is a hint, not a label. It vanishes on input, often has weak contrast and is only a fallback for the name',
      fix: 'Render a real `<label>` linked with `htmlFor` and `useId`. Hide it visually only if the design demands it',
      bad: '<input type="email" placeholder="Email" />',
      good: 'const id = useId();\n\n<label htmlFor={id}>Email</label>\n<input id={id} type="email" />',
    },
  ],
  meeting: {
    say: [
      'Semantics first. Native elements give us role, name, state and keyboard behaviour for free, so we reach for ARIA only when nothing native fits.',
      'Every control needs an accessible name and a keyboard path. Those two checks catch most of what goes wrong.',
      'In a React app the risk is focus. Route changes, dialogs and removed elements all need deliberate focus handling.',
      'Automated tests find only part of it, so we also tab through each flow and listen with a screen reader before release.',
    ],
    ask: [
      'Can every interactive element be reached and used with the keyboard alone, and is the focus always visible?',
      'Where does focus go after a route change, when a dialog opens and closes, and when a list item is deleted?',
      'Which design-system components own accessibility behaviour, and have they been tested with a screen reader?',
      'Which WCAG level are we committed to, and which legal requirements apply, such as the European Accessibility Act?',
    ],
    redFlags: [
      '`div` or `span` with `onClick` instead of a button or link',
      'Icon-only buttons with no accessible name',
      '`outline: none` with no replacement focus style',
      'ARIA roles on elements that already have the semantics, or `tabIndex` above 0',
      'Hand-built modals with no focus trap, Escape handling or focus return',
    ],
    tradeoff:
      'Building on native elements and testing with a keyboard costs a little care in each component, and it avoids costly retrofits, legal exposure and users who cannot finish the task.',
  },
  selfCheck: [
    {
      question:
        'A teammate adds `role="button"` and `onClick` to a `div`. What is still missing compared with a `<button>`?',
      answer:
        'Focusability and keyboard activation. The role only changes what is announced, so the element still needs `tabIndex={0}`, Enter and Space handlers and a focus style. Using `<button>` gives all of it.',
    },
    {
      question:
        'After a client-side route change, a screen reader user hears nothing and keyboard focus is still on the old link. What do you do?',
      answer:
        'Move focus to the new page, normally its main heading with `tabIndex={-1}` or the main region, and update the document title. A client-side route change has no page load, so the browser does none of this for you.',
    },
    {
      question: 'A search input has only `placeholder="Search"`. Is it accessible, and what is the fix?',
      answer:
        'Not reliably. The placeholder disappears as you type, often has weak contrast and serves only as a fallback name. Add a real `<label>` linked with `htmlFor` and `useId`, or an `aria-label` if the design hides the text.',
    },
  ],
  links: [
    { label: 'WCAG 2.2 quick reference', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
    { label: 'ARIA Authoring Practices Guide', url: 'https://www.w3.org/WAI/ARIA/apg/' },
    { label: 'Learn Accessibility', url: 'https://web.dev/learn/accessibility' },
    {
      label: 'MDN: ARIA',
      url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA',
    },
    {
      label: 'MDN: the dialog element',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog',
    },
  ],
  glossary: [
    {
      term: 'Accessibility tree',
      definition:
        'The browser\'s parallel version of the DOM that exposes each node\'s role, name and state to assistive technology.',
    },
    {
      term: 'Accessible name',
      definition:
        'The text a screen reader announces for a control, taken from a label, `aria-labelledby`, `aria-label`, its content or, as a last resort, a placeholder or title.',
    },
    {
      term: 'ARIA',
      definition:
        'Attributes that add roles, names and states to the accessibility tree. They change what is announced and give no behaviour or focus.',
    },
    {
      term: 'Live region',
      definition:
        'An element, such as `role="status"`, whose text changes are announced without moving focus. It must exist before the change.',
    },
    {
      term: 'Focus management',
      definition:
        'Deciding where keyboard focus goes when the interface changes, such as a route change, an opened dialog or a deleted item.',
    },
    {
      term: 'Focus trap',
      definition:
        'Keeping Tab and Shift+Tab inside an open modal until it closes. Native `<dialog>` with `showModal()` provides it.',
    },
    {
      term: 'Landmark',
      definition:
        'A region such as banner, navigation or main, created by `header`, `nav` and `main`, that lets screen reader users jump around the page.',
    },
  ],
};
