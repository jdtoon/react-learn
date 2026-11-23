import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '23-mfe-sharing-and-communication',
  number: 23,
  title: 'Sharing & communication',
  track: 'micro-frontends',
  oneIdea: 'Share as little as possible: one React, a typed event contract and design tokens.',
  minutes: 12,
  phase: 1,
  outcomes: [
    'Decide what a host shares (React, tokens, an event contract) and what every remote owns',
    'Explain singletons and `requiredVersion`, and why a second React crashes a federated remote that uses hooks',
    'Pick props, URL, events or a store for each remote-to-remote conversation, and veto a shared global store',
  ],
  sections: [
    {
      heading: 'One React, by agreement',
      paragraphs: [
        "A federated remote's components render inside the host's React tree, so they must use the host's React. The host registers `react` and `react-dom` in a share scope. The remote lists them as `shared` with `singleton: true` and a `requiredVersion` such as `^19.0.0`, and the runtime hands it the host's copy.",
        'Without that, the remote bundles its own React. Hooks then run against a renderer that never set up the host\'s dispatcher, and the first `useState` throws "Cannot read properties of null". In this course\'s build, such a remote loaded fine and crashed on first render. A singleton outside its range still shares and logs a warning, and `strictVersion` makes it an error. A non-singleton falls back to a second copy.',
      ],
    },
    {
      heading: 'Sharing is for correctness, not bytes',
      paragraphs: [
        'A remote that only exposes components bundles no renderer, because React 19 keeps it in `react-dom/client`. In the spike, sharing changed the fetched bytes by a few KB, and the federation runtime (about 65 KB) is paid either way. The saving appears when a remote would otherwise bundle a renderer: a minimal `react` plus `react-dom/client` bundle is 219 KB (68 KB gzipped). Share the framework, the tokens and the contract. Do not share business libraries to save bytes.',
      ],
    },
    {
      heading: 'Talking across remotes',
      paragraphs: [
        'Use the narrowest channel that works. A parent passes props or attributes down. A remote announces that something happened with a custom event, and a typed bus (`emit` and `on`) is that with a contract on top. The URL holds shared navigation state and survives a reload. Events are past-tense facts such as `cart:updated`, so the sender never knows who listens, and a missing listener is silent. Avoid a shared global store: it couples every remote to one schema and one release, which is the monolith you left.',
      ],
    },
    {
      heading: 'Who owns routing, identity and look',
      paragraphs: [
        'The host owns the URL and the shell. It maps top-level routes to remotes, and each remote owns the paths below its prefix. Two routers fighting over history is a classic failure. The host or an identity service owns the session, ideally an HTTP-only cookie, and remotes read identity or listen for `account:changed`. They never mint tokens.',
        'Design tokens are the shared look: CSS custom properties that every framework can read. CSS inside React remotes is global, so a loose selector restyles the host. Shadow DOM, prefixed class names or an iframe contain it, at different costs.',
      ],
    },
  ],
  labs: [
    {
      id: 'event-bus',
      title: 'Watch the event bus',
      tryThis: [
        'Press **Add** on a product in the Catalogue. The packet goes from the Catalogue to the bus and on to the Cart, and the Cart then announces `cart:updated` to Recommendations',
        'Press **Emit locator:store-selected**. Nothing listens for it, so the packet stops at the bus and the log row says dropped',
        'Press **Apply code** in the Promotion slot. A Svelte component talks to a React cart through the same contract',
        'Turn on reduced motion in your system settings and send another event. The packets stop moving, the route stays highlighted, and the log keeps every row',
      ],
      whatHappened:
        'Every remote bundles its own copy of the bus package, yet one log and one subscriber list exist because the state lives on `globalThis` under a shared symbol, and delivery uses `window` custom events. The sender only names an event type and a payload, so adding a listener such as Recommendations needed no change to the Cart. The cost is that delivery is best effort: a dropped event is not an error, so the log has to show it.',
    },
    {
      id: 'shared-deps',
      title: 'One React or two',
      tryThis: [
        'In the negotiation panel, keep `^19.0.0` and singleton on. The remote gets the host copy, one React in total',
        'Change the range to `^18.0.0`. A singleton still shares and warns. Turn on **strictVersion** and the remote refuses to load',
        'Switch singleton off with `^18.0.0`. The runtime falls back to a second copy, and the verdict turns to a hooks crash',
        'In the Storefront, choose **Own React** under Recommendations isolation and compare the React copies and the transferred bytes with **Shared React**',
      ],
      whatHappened:
        'The panel applies the rules in the federation runtime. It resolves the highest registered version, and a singleton uses it even when it misses the range, with a warning or an error under `strictVersion`. A non-singleton that misses the range loads its own copy. The Storefront shows the real effect. The isolated Recommendations build mounts a separate React root, which works because it never renders inside the host tree, but it ships a renderer, so it carries far more bytes than the shared build. A remote that renders in the host tree and brings its own React crashes instead.',
    },
    {
      id: 'css-isolation',
      title: 'Who takes the leak',
      tryThis: [
        'Press **CSS leak** with Shadow DOM selected. The React slots take the serif crimson style, and the scoreboard shows which slots were restyled',
        'Switch Reviews and Promotion to **Light DOM**. They join the restyled slots, because their markup now lives in the page',
        'Switch back to Shadow DOM and note the Account (Angular) and Store locator (iframe) rows. They were never reachable',
      ],
      whatHappened:
        'A rule in the host document matches elements in the light DOM, which is where React remotes render, so they cannot opt out. A shadow root is a style boundary: selectors do not cross it in either direction, but inherited properties and custom properties still do, which is why tokens work through it. An iframe is a separate document with its own styles, so only tokens passed in on purpose reach it. The scoreboard reads the computed style of a real element in each slot.',
    },
  ],
  pitfalls: [
    {
      title: 'A remote that does not share React',
      symptom:
        'The remote loads without error, then the page goes blank with "Cannot read properties of null (reading useState)"',
      cause:
        'The remote bundled its own React, so its hooks run on a renderer that is not rendering this tree',
      fix: 'Declare `react` and `react-dom` as singleton shared dependencies in every remote, with a loose major range, and register the same names in the host',
      bad: 'shared: {}',
      good: "shared: {\n  react: { singleton: true, requiredVersion: '^19.0.0' },\n  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },\n}",
    },
    {
      title: 'A hidden second React in development',
      symptom:
        'Everything works, yet the network panel shows the remote fetching an extra React chunk from its own origin',
      cause:
        'The dev build also asks for `react/jsx-dev-runtime` and `react/compiler-runtime`. A host that registers only `react` and `react-dom` lets the runtime fall back to the remote copy for those',
      fix: 'Register every React subpath the remotes request in the host, and check the React copy count in a test',
    },
    {
      title: 'A shared global store',
      symptom:
        'One team renames a field and three remotes break in the same release, or a store upgrade needs every team to deploy together',
      cause:
        'Every remote imports one state object, so the schema and the library version have become a hidden shared dependency',
      fix: 'Keep state inside each remote and publish facts as events in a typed contract. Put only navigation state in the URL',
    },
    {
      title: 'Commands, not facts',
      symptom:
        'Clicking Add does nothing and no error appears, or a rename silently stops a listener firing',
      cause:
        'The sender emitted an untyped command and assumed a listener exists. Delivery to nobody is not an error',
      fix: 'Name events as past-tense facts in one shared type map, log dropped events, and test the contract',
      bad: "window.dispatchEvent(new CustomEvent('addToCart', { detail: sku }))",
      good: "emit('cart:add', { sku, name, price }, 'react-catalog')",
    },
    {
      title: 'Global CSS that reaches across teams',
      symptom: 'A button in the host changes colour after a remote deploys',
      cause:
        'A remote ships an unscoped selector such as `button`, and React remotes share the host document',
      fix: 'Scope with prefixes or CSS Modules, use Shadow DOM where the framework allows it, and share only tokens',
    },
  ],
  meeting: {
    say: [
      "React is a singleton in the share scope with a major-version range, so every remote renders with the host's copy.",
      'Remotes publish past-tense events in a typed contract. Nobody calls another remote.',
      'Design tokens are the shared look. We share the contract and the tokens, not component code.',
      'The host owns routing and the session. Remotes read identity and never mint it.',
    ],
    ask: [
      'Who upgrades React, and how do we learn which remotes break before the host moves?',
      'What happens to an event when its listener is not loaded, and do we log it?',
      "How do we stop a remote's CSS reaching the host, and the host's reaching remotes?",
    ],
    redFlags: [
      'A Redux or Zustand store that every remote imports',
      "A remote with its own React copy mounted into the host's tree",
      'Auth tokens in localStorage read by several remotes',
      'Commands such as `doAddToCart` with no schema and no logging of drops',
    ],
    tradeoff:
      'Sharing more saves bytes and keeps the look consistent but ties release schedules together. Sharing less keeps teams independent and costs duplicated code.',
  },
  selfCheck: [
    {
      question:
        'Why does a federated remote that bundles its own React crash when the host renders it?',
      answer:
        "Hooks read the dispatcher of the React that is rendering the tree. The remote's own copy never set one up, so its first hook reads null. A singleton share gives the remote the host's copy.",
    },
    {
      question: 'Sharing React barely changed the bytes in the lab. Why share it?',
      answer:
        'For correctness. A components-only remote bundles no renderer, so the saving is a few KB and the runtime cost is paid either way. The byte saving only appears when a remote would bundle `react-dom/client`, about 219 KB.',
    },
    {
      question: 'Two remotes must react to a purchase. Props, URL, event or shared store?',
      answer:
        'A typed event such as `cart:updated`. It is a fact, so the sender needs no knowledge of listeners. The URL is for state that must survive a reload or a shared link, and a shared store couples releases.',
    },
  ],
  links: [
    { label: 'Module Federation: shared', url: 'https://module-federation.io/configure/shared' },
    {
      label: 'React: Invalid hook call warning',
      url: 'https://react.dev/warnings/invalid-hook-call-warning',
    },
    {
      label: 'MDN: CustomEvent',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent',
    },
    {
      label: 'MDN: Using shadow DOM',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM',
    },
    {
      label: 'MDN: Using CSS custom properties',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties',
    },
  ],
  glossary: [
    {
      term: 'Singleton (shared module)',
      definition:
        'A dependency the share scope loads once for the whole page, so the host and every remote use the same instance.',
    },
    {
      term: 'Share scope',
      definition:
        'The runtime registry where the host and remotes register shared packages, each with a version, so one copy can be chosen.',
    },
    {
      term: 'requiredVersion',
      definition:
        'The semver range a remote accepts for a shared package, checked against the registered version at load time.',
    },
    {
      term: 'Event bus',
      definition:
        'A channel where remotes publish typed events and subscribe to them without knowing each other. Here it is built on `window` custom events.',
    },
    {
      term: 'Shadow DOM',
      definition:
        'A browser feature that gives an element its own DOM and style scope, so outside selectors cannot reach in and inside styles cannot leak out.',
    },
  ],
};
