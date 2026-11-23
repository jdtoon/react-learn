import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '22-mfe-composition',
  number: 22,
  title: 'Composition patterns',
  track: 'micro-frontends',
  oneIdea:
    'Build-time, server-side, iframe, web component or Module Federation. Each draws the team boundary differently.',
  minutes: 12,
  phase: 1,
  outcomes: [
    'Place each integration style at its composition point and say what it buys and costs',
    'Describe what happens at load time in Module Federation 2.0, including the manifest and the shared singleton',
    'Choose an integration style for a slot from independence, isolation, SEO and failure blast radius',
  ],
  sections: [
    {
      heading: 'Where the parts are joined',
      paragraphs: [
        'Every approach answers one question: at what moment are the parts joined? At **build time**, teams publish packages and one pipeline builds the host. On the **server or edge**, a composer stitches HTML fragments per request. In the **client**, the browser loads each part at runtime, through an iframe, a web component, Module Federation or an import map. The later the join, the more independently teams deploy, and the more runtime cost, failure surface and version negotiation you carry. Most real platforms pick the join point per slot, not once for the whole product.',
      ],
    },
    {
      heading: 'Server, edge and iframes',
      paragraphs: [
        '**Server or edge composition** assembles the page before it reaches the browser, with server includes, edge workers or streamed HTML. First paint and SEO are strong and teams deploy fragments alone. Interactive fragments still hydrate on their own scripts, and the composer needs timeouts and fallbacks. An **iframe** is the opposite: a separate document with its own origin, globals, styles and crash domain. That suits third-party or legacy content. It costs a document and a framework copy per frame, `postMessage` plumbing, sizing and focus glue, and weak SEO and deep linking.',
      ],
    },
    {
      heading: 'Web components, import maps, single-spa',
      paragraphs: [
        'A **web component** is the framework-neutral contract: a custom element with attributes and properties in and DOM events out. Shadow DOM isolates CSS only if the element opts in, and the tag name is a global, so collisions are possible. **Import maps** let the browser resolve bare names such as `react` or `@shop/recs` to URLs. **Native Federation** builds on native ES modules and import maps, adding shared-dependency metadata. **single-spa** is an orchestrator that mounts and unmounts whole applications by route through `bootstrap`, `mount` and `unmount` lifecycles, and often pairs with import maps.',
      ],
    },
    {
      heading: 'Module Federation 2.0',
      paragraphs: [
        'A remote builds with `exposes` and `shared` and emits a `remoteEntry.js` and an `mf-manifest.json`. The host registers the remote by URL and loads it at runtime: manifest, then entry, then the exposed chunks, which is a waterfall unless you preload. Version 2.0 made the runtime, `@module-federation/runtime`, bundler-agnostic, so webpack, Rspack and Vite builds can interoperate, and added runtime plugins and preloading. The critical setting is `shared`: React must be a **singleton** with a version range, because two copies break hooks and context. Mount each remote behind `lazy`, `Suspense` and an error boundary, so a failed fetch becomes a local fallback.',
      ],
    },
  ],
  labs: [
    {
      id: 'live-storefront',
      title: 'The live storefront',
      tryThis: [
        'Leave **X-ray** off and use the page: add a product from the catalogue and watch the cart. It looks like one app, yet the boxes are separate builds from separate teams',
        'Turn **X-ray** on and read each tag: team, framework, how it was loaded, version, size and load time. React boxes load through Module Federation and show **same React**, the Vue, Svelte and Angular boxes are web components, and the store locator is an iframe',
        'Press **Kill Recommendations**. Only that box swaps to its fallback and the rest of the page keeps working. Press **Restore Recommendations** to bring it back',
        'Press **Kill Cart**, add a product from the catalogue, then press **Restore Cart**. The click worked but the cart is empty: the catalogue only announces the purchase, nothing was listening, and announcements are not replayed',
      ],
      whatHappened:
        'The page is a host that loads each slot at runtime from a manifest of separately built remotes. Killing a slot points it at a URL that throws. Each slot sits behind its own timeout and error boundary, so that becomes a local fallback and the blast radius is one box. Where a remote uses React, it takes the host copy through the shared singleton, which is the X-ray note of same React. A remote that is away also misses events sent in the meantime, so slices that talk through events need a way to resynchronise. The other styles show their price: web components bring their own framework runtime, and the iframe is a whole separate document.',
    },
    {
      id: 'integration-styles',
      title: 'Integration styles side by side',
      tryThis: [
        'Select **Isolation** and **Small blast radius** in the matrix. Iframes lead, and the build-time package is last because it shares everything',
        'Select **SEO and SSR** and **Independent deploy** together. Server or edge composition is the only style that is strong on both',
        'Choose **Module Federation** and step through the load. Count the requests before the remote appears, and note that React is not fetched again',
        'Step through **Iframe**, then **Build-time package**, and compare the request lists',
      ],
      whatHappened:
        'No style wins every column, because each one moves the join point and with it the cost. A build-time package is cheapest at runtime and gives nothing on independent deploys. Server composition keeps SEO but needs a composer. Iframes isolate completely and share nothing. Module Federation and import maps share dependencies and deploy independently, and they pay with a runtime waterfall and a single shared realm. The step-through shows why: each extra hop before the slice appears is something to preload, cache or render on the server. The ratings are rules of thumb for a typical setup, not benchmarks.',
    },
  ],
  pitfalls: [
    {
      title: 'Two copies of React',
      symptom:
        'Invalid hook call, or a context provider in the host is invisible inside a remote, but only when the remote is federated',
      cause:
        'The remote bundled its own React because `shared` is missing or is not a singleton, so its hooks and contexts belong to a different React instance from the host',
      fix: 'Share `react` and `react-dom` as singletons with a `requiredVersion` range, agree one major version across teams, and verify with a runtime check that both sides resolve one instance',
      bad: 'shared: {}',
      good: "shared: {\n  react: { singleton: true, requiredVersion: '^19.3.0' },\n  'react-dom': { singleton: true, requiredVersion: '^19.3.0' },\n}",
    },
    {
      title: 'A remote with no failure boundary',
      symptom:
        "One team's outage or a slow CDN blanks the whole page, or the page waits on a spinner for ever",
      cause:
        'The host awaits the remote with no timeout and no error boundary, so a rejected import travels up to the root',
      fix: 'Wrap every slot in `Suspense` and an error boundary, add a timeout, and give each slot a fallback that says what is unavailable. Treat a remote as a network call that can fail',
      bad: "const Recs = lazy(() => import('recs/Recs'));\n\n<Recs />",
      good: '<ErrorBoundary fallback={<SlotDown name="Recommendations" />}>\n  <Suspense fallback={<SlotSkeleton height={320} />}>\n    <Recs />\n  </Suspense>\n</ErrorBoundary>',
    },
    {
      title: 'Styles that leak across slices',
      symptom:
        'A heading or button in one slice changes colour or spacing after another team deploys',
      cause:
        'Client-side remotes share one document, so a global selector or reset in one remote applies to all of them. Only iframes and shadow roots stop it',
      fix: 'Scope CSS with modules, a team prefix or `@scope`, ban element selectors in remotes, and share design tokens as CSS custom properties. Use shadow DOM when a slice must be sealed',
      bad: 'h2 {\n  font-size: 2rem;\n}',
      good: '.recs-title {\n  font-size: var(--text-lg);\n}',
    },
    {
      title: 'The load waterfall nobody measured',
      symptom: 'Largest Contentful Paint slips and the layout jumps when a slice arrives late',
      cause:
        'The host loads the manifest, then the entry, then the chunks, one after another after its own JavaScript runs, and the slot has no reserved size',
      fix: 'Preload remote manifests, render above-the-fold slots on the server or edge, reserve each slot height, and enforce a size and load-time budget per slice in CI',
    },
    {
      title: 'Exposing internals as the contract',
      symptom: "A deploy by one team breaks another team's slice at runtime, with no failing build",
      cause:
        'Remotes expose internal modules, other remotes import them, and the contract changes with every refactor',
      fix: 'Expose a small public surface, version it like an API, keep events additive, and run contract tests against the versions that are live',
    },
  ],
  meeting: {
    say: [
      'Pick the join point per slot: build time when teams can share a release, server or edge when SEO and first paint matter, the client when teams must deploy alone.',
      'Module Federation 2.0 gives us a bundler-agnostic runtime and a manifest. The decisions that matter are the shared singletons, the version policy and what each slice exposes.',
      'Iframes buy isolation at the price of a document and a framework copy per frame. Web components buy a neutral contract, but only shadow DOM isolates styles.',
      'Every remote is a network call that can fail, so each slot needs a boundary, a timeout and a fallback.',
    ],
    ask: [
      'Which slots need SEO or fast first paint, and can they be composed on the server or edge?',
      'What is our shared dependency policy, and who bumps React for everyone?',
      'What exactly does each remote expose, and how do we version and test that contract?',
      'What does the page show when this remote is down or slow?',
      'What is the size and load-time budget per slice, and where is it enforced?',
    ],
    redFlags: [
      'A remote that bundles its own React on an all-React platform',
      "Remotes that import each other's internal modules instead of a published contract",
      'No error boundary, timeout or reserved height around a slot',
      'Global CSS in a remote',
      'A different integration style for every team with no platform guidance',
    ],
    tradeoff:
      'The later you join the parts, the more independently teams deploy, and the more runtime cost, failure surface and version coordination you carry.',
  },
  selfCheck: [
    {
      question:
        'A product page must rank in search and paint quickly, but three teams own parts of it and want to deploy alone. Which join point fits?',
      answer:
        'Server or edge composition. The composer fetches each team fragment and streams HTML before any JavaScript runs, so crawlers and first paint get content while the teams still deploy alone. Client-side loading can enhance the interactive pieces afterwards.',
    },
    {
      question:
        'A federated remote throws Invalid hook call only when it is mounted in the host. What is the likely cause and the first check?',
      answer:
        'Two copies of React: the remote bundled its own instead of using the host singleton. Check the `shared` config for `react` and `react-dom` on both sides, with `singleton` and a compatible version range, and confirm they resolve one instance.',
    },
    {
      question:
        'Module Federation 2.0 and Native Federation both load remotes at runtime. What is the main difference?',
      answer:
        'Module Federation 2.0 has a bundler-agnostic runtime that negotiates shared dependencies and loads through a manifest, and works with webpack, Rspack and Vite. Native Federation leans on native ES modules and import maps, so the browser does the resolving and the library only builds the map.',
    },
  ],
  links: [
    {
      label: 'Micro Frontends (Cam Jackson)',
      url: 'https://martinfowler.com/articles/micro-frontends.html',
    },
    {
      label: 'What is Module Federation',
      url: 'https://module-federation.io/guide/start/index.html',
    },
    {
      label: 'single-spa: micro frontend concepts',
      url: 'https://single-spa.js.org/docs/microfrontends-concept/',
    },
    {
      label: 'MDN: import maps',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap',
    },
    {
      label: 'MDN: Web components',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components',
    },
  ],
  glossary: [
    {
      term: 'Composition point',
      definition:
        'The moment the parts of a page are joined: build time, on the server, at the edge or in the browser. Later joins give more independent deploys and more runtime cost.',
    },
    {
      term: 'Host and remote',
      definition:
        'The host is the page or shell that loads parts at runtime. A remote is a separately built and deployed part that the host loads and mounts.',
    },
    {
      term: 'Shared singleton',
      definition:
        'A dependency such as React that the host and every remote must use as one instance, negotiated at runtime against a version range.',
    },
    {
      term: 'mf-manifest.json',
      definition:
        'A file a Module Federation 2.0 remote emits that lists its exposed modules, shared dependencies and asset paths, so a host can load and preload it.',
    },
    {
      term: 'Import map',
      definition:
        'A JSON block in the page that tells the browser which URL each bare module name resolves to. Native Federation and single-spa setups use it to share code.',
    },
    {
      term: 'Custom element',
      definition:
        'A browser-native component registered with a tag name. Shadow DOM is the optional part that isolates its styles and markup.',
    },
    {
      term: 'single-spa',
      definition:
        'A framework-agnostic orchestrator that registers applications, mounts and unmounts them by route, and gives each a bootstrap, mount and unmount lifecycle.',
    },
  ],
};
