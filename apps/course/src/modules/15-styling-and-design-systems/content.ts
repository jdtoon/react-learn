import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '15-styling-and-design-systems',
  number: 15,
  title: 'Styling & design systems',
  track: 'craft',
  oneIdea: 'Tokens are the contract between design and code. The styling tool is a detail.',
  minutes: 12,
  phase: 4,
  outcomes: [
    'Describe the three token layers and say which one theming changes',
    'Compare global CSS, CSS Modules, utility-first, runtime CSS-in-JS and zero-runtime options by cost and fit',
    'Choose between container and media queries, and between headless primitives and a full kit',
  ],
  sections: [
    {
      heading: 'Tokens are the contract',
      paragraphs: [
        'A design token is a named design decision. Three layers keep them honest. **Primitive** tokens are raw values: `--brand-600`, `--space-4`. **Semantic** tokens say what a value is for: `--color-action`, `--color-surface`. **Component** tokens belong to one part: `--button-bg`. Components read semantic or component tokens and never primitives. Theming then swaps the semantic layer, so dark mode points `--color-surface` at a different primitive and no component changes. CSS custom properties make this native: they cascade, inherit and update live, with no rebuild and no JavaScript.',
      ],
    },
    {
      heading: 'The styling tool is a detail',
      paragraphs: [
        'Global CSS is simple and collides at scale. CSS Modules scope class names at build time. Utility-first CSS such as Tailwind keeps styles beside the markup and limits values to a scale. Runtime CSS-in-JS, such as styled-components and Emotion, builds and injects styles while rendering. That costs CPU on every update, complicates streaming and concurrent rendering, and needs client code in server components, so teams moved to build-time options: the three above, or zero-runtime tools such as vanilla-extract, Panda and StyleX. All of them can read the same tokens, so choose by team habit and build cost.',
      ],
    },
    {
      heading: 'Build or buy components',
      paragraphs: [
        'Headless primitives (Radix, React Aria, Base UI) supply behaviour and accessibility without styles, so your tokens decide the look. A full kit such as MUI ships faster and bends your design towards its own. Copy-in collections such as shadcn/ui put the source in your repo, so you own it and its upgrades. Storybook documents each state, and visual regression tests catch drift.',
      ],
    },
    {
      heading: 'Modern CSS removes workarounds',
      paragraphs: [
        '**Container queries** let a component respond to the space it is given, not the viewport, which is what reusable components need. `:has()` selects a parent by its children. **Cascade layers** make the order of styles explicit, so third-party CSS never wins by accident. Anchor positioning places popovers relative to their trigger without JavaScript measuring.',
      ],
    },
  ],
  labs: [
    {
      id: 'token-playground',
      title: 'Token playground',
      tryThis: [
        'Drag **Brand hue**. Every primitive recomputes, the semantic tokens follow, and the sample UI recolours without any component changing',
        'Switch to **Dark**. Only the semantic layer changes: the same component tokens now resolve to different primitives',
        'Tick **Button reads a primitive directly** and switch theme. The button ignores the remap and stops matching the link beside it',
        'Change **Corner radius** and note which components share the one primitive',
      ],
      whatHappened:
        'Each layer holds a reference to the one below. A component token points at a semantic token, which points at a primitive, which holds the value. Editing a primitive changes every semantic token that points at it. Switching theme edits the semantic layer only, so components follow without a code change. A component that reads a primitive directly skips the semantic layer, so it keeps its light-mode value and drifts away from everything that follows the contract.',
    },
    {
      id: 'container-query-card',
      title: 'Container-query card',
      tryThis: [
        'Drag **Container width** from wide to narrow. The container-query card adds a detail row above 512 px, puts the image beside the text above 384 px, and stacks below that',
        'Watch the media-query card in the same slot. It keeps one layout, because it only knows the viewport',
        'Pick **Sidebar** and then **Main column**. The same component adapts to where it is placed',
      ],
      whatHappened:
        'A container query measures the nearest ancestor that declares a container, so the card responds to the space it was given. A media query measures the viewport, which does not change when the slot does. The same card dropped into a sidebar, a dialog or a grid needs the first behaviour, and a media query cannot give it.',
    },
  ],
  pitfalls: [
    {
      title: 'Components that read primitives or literals',
      symptom: 'Dark mode or a rebrand misses a few components, and they look out of place',
      cause:
        'A component reads a palette value or a hex code, so the theme layer never reaches it and nothing says what the colour is for',
      fix: 'Name tokens by role and have components read only semantic or component tokens. A lint rule against colour literals in component styles enforces it',
      bad: '.button {\n  background: var(--blue-600);\n  color: #fff;\n}',
      good: '.button {\n  background: var(--color-action);\n  color: var(--color-on-action);\n}',
    },
    {
      title: 'Runtime CSS-in-JS on a hot path',
      symptom: 'Interactions slow down as the page grows, or styles flash on first paint',
      cause:
        'Styles are serialised and injected during render, with a new class for each prop combination, so every update pays for it and server output needs extra collection',
      fix: 'Move static styling to build time and pass dynamic values as custom properties',
      bad: 'const Bar = styled.div`\n  width: ${(props) => props.width}px;\n  color: ${(props) => props.theme.text};\n`;',
      good: '<div\n  className={styles.bar}\n  style={{ "--bar-width": `${width}px` }}\n/>',
    },
    {
      title: 'Media queries inside reusable components',
      symptom: 'A card looks right on the page and broken in a sidebar or a dialog',
      cause:
        'The breakpoint tests the viewport, so a wide screen applies the wide layout to a narrow slot',
      fix: 'Declare a container on the wrapper and query it, so the component responds to the width it receives',
      bad: '@media (min-width: 40rem) {\n  .card {\n    grid-template-columns: 8rem 1fr;\n  }\n}',
      good: '.card-slot {\n  container-type: inline-size;\n}\n\n@container (min-width: 24rem) {\n  .card {\n    grid-template-columns: 8rem 1fr;\n  }\n}',
    },
    {
      title: 'Specificity wars with `!important`',
      symptom: 'Overrides need `!important`, and a vendor stylesheet still wins in some places',
      cause:
        'Selectors compete on specificity and source order. Styles outside any layer beat styles inside layers, so ordering is accidental',
      fix: 'Declare the layer order once and place vendor CSS, components and utilities in their own layers',
      bad: '.card .title {\n  color: red !important;\n}',
      good: '@layer reset, vendor, components, utilities;\n\n@layer components {\n  .title {\n    color: var(--color-text);\n  }\n}',
    },
  ],
  meeting: {
    say: [
      'Tokens are the contract. Primitives hold raw values, semantic tokens say what they are for, and components read only semantic or component tokens. Theming swaps the middle layer.',
      'The styling tool matters less than the tokens. Whatever we pick should resolve to the same custom properties and avoid injecting styles at runtime.',
      'Shared components should use container queries, so they adapt to the space they are placed in, not to the screen.',
      'Headless primitives give us behaviour and accessibility and leave the look to our tokens. A full kit trades control for speed.',
    ],
    ask: [
      'Do components reference tokens by role or by raw value, and what breaks if we rebrand or add a dark theme?',
      'Who owns the token set, and how do design and code stay in sync?',
      'What does this library cost at runtime, and does it work with streaming and server components?',
      'How do we catch visual regressions across components and themes?',
    ],
    redFlags: [
      'Hex values or raw palette variables inside component styles',
      'A runtime CSS-in-JS library on a performance-sensitive or server-rendered app',
      '`!important` used to win specificity fights',
      'Breakpoints in a reusable component that test the viewport',
      'A design system with no owner and no visual regression checks',
    ],
    tradeoff:
      'A strict token layer and headless primitives cost design work up front and add indirection, and they buy consistent theming, simple rebrands and components that survive new contexts.',
  },
  selfCheck: [
    {
      question:
        'You add a dark theme. Which token layer changes, and what must be true of the components for that to be enough?',
      answer:
        'The semantic layer: dark mode points tokens such as `--color-surface` and `--color-text` at different primitives. Components must read semantic or component tokens and never primitives or colour literals, otherwise they keep their light values.',
    },
    {
      question:
        'A card switches to two columns above a 640 px viewport. On a wide desktop it looks broken in a 300 px sidebar. What is wrong, and what is the fix?',
      answer:
        'The media query tests the viewport, which is wide, so the two-column layout lands in a narrow slot. Set `container-type: inline-size` on the wrapper and switch to an `@container` query so the card responds to the space it gets.',
    },
    {
      question: 'Why did many teams move away from runtime CSS-in-JS, and what do they use instead?',
      answer:
        'It builds and injects styles during render, which costs CPU on updates, complicates streaming and concurrent rendering, and needs client code in server components. Build-time options keep the authoring model without the runtime: CSS Modules, utility-first CSS, or zero-runtime libraries, with custom properties for dynamic values.',
    },
  ],
  links: [
    {
      label: 'MDN: Container queries',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries',
    },
    {
      label: 'MDN: Using CSS custom properties',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties',
    },
    { label: 'MDN: @layer', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@layer' },
    { label: 'Design Tokens Community Group', url: 'https://www.designtokens.org/' },
  ],
  glossary: [
    {
      term: 'Design token',
      definition:
        'A named design decision, such as a colour, a space or a radius, stored once and read by code and design tools.',
    },
    {
      term: 'Primitive token',
      definition:
        'A raw value with no meaning attached, such as a palette step or a spacing step. It sits at the bottom of the token layers.',
    },
    {
      term: 'Semantic token',
      definition:
        'A token named for its role, such as the action colour or the surface colour. It points at a primitive, and theming works by changing that pointer.',
    },
    {
      term: 'Component token',
      definition:
        'A token scoped to one component, such as a button background. It usually points at a semantic token and lets one component deviate without touching the rest.',
    },
    {
      term: 'Container query',
      definition:
        'A CSS rule that applies when the nearest container ancestor reaches a size, instead of when the viewport does.',
    },
    {
      term: 'Cascade layer',
      definition:
        'A named group of rules declared with `@layer`, whose order decides which wins before specificity is compared. Unlayered styles beat layered ones.',
    },
    {
      term: 'Headless component',
      definition:
        'A component that supplies behaviour, state and accessibility without any styling, so the design system provides the look.',
    },
  ],
};
