> Generated from the app's content. Edit the `content.ts` file of each module in `apps/course/src/modules/`.

# Glossary

Every key term in one line, in A to Z order, with the module that teaches it.

Jump to: [A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [H](#h) · [I](#i) · [J](#j) · [K](#k) · [L](#l) · [M](#m) · [O](#o) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [X](#x) · [Y](#y)

## A

- **Accessibility tree**: The browser's parallel version of the DOM that exposes each node's role, name and state to assistive technology. See [16. Accessibility](modules/16-accessibility.md).
- **Accessible name**: The text a screen reader announces for a control, taken from a label, `aria-labelledby`, `aria-label`, its content or, as a last resort, a placeholder or title. See [16. Accessibility](modules/16-accessibility.md).
- **Action**: An async function React runs inside a transition, usually passed to `<form action>`. React tracks its pending state and resets uncontrolled fields when it finishes. See [08. Forms & Actions](modules/08-forms-and-actions.md).
- **Activity**: A component whose `mode` is `visible` or `hidden`. Hidden children keep their state and DOM, lose their effects, and render at low priority. See [13. Concurrent React](modules/13-concurrent-react.md).
- **ARIA**: Attributes that add roles, names and states to the accessibility tree. They change what is announced and give no behaviour or focus. See [16. Accessibility](modules/16-accessibility.md).

## B

- **Bail-out**: React skipping work for a component and its children because nothing they depend on changed: identical state by Object.is, shallowly equal props under memo, or an element React already has. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Batching**: React grouping all state updates from one event or task into a single render. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **BFF**: Backend for frontend: a small server that holds the real tokens, sets a session cookie for the browser and proxies calls to the APIs. See [19. Frontend security](modules/19-frontend-security.md).
- **Blast radius**: How many components render when a given piece of state changes. Context widens it, selectors narrow it. See [06. State management at scale](modules/06-state-management.md).
- **Bundler**: A tool that follows the import graph, transforms the code and emits optimised static files. Vite 8 uses Rolldown for this. See [20. Build, ship & observe](modules/20-build-ship-observe.md).

## C

- **Canary release**: Serving a new version to a small, stable share of visitors first, and widening it only while the error rate stays inside budget. See [24. MFEs in production](modules/24-mfe-in-production.md).
- **Cascade layer**: A named group of rules declared with `@layer`, whose order decides which wins before specificity is compared. Unlayered styles beat layered ones. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Chunk**: A JavaScript file the bundler emits. Splitting at dynamic `import()` calls produces extra chunks that the browser requests only when the code runs. See [09. Routing & code splitting](modules/09-routing-and-splitting.md).
- **Cleanup function**: The function an effect returns. React runs it before the next setup with changed dependencies, and on unmount. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **Client boundary**: The point where a `use client` file begins. That file and everything it imports ship to the browser and hydrate. See [10. Rendering strategies](modules/10-rendering-strategies.md).
- **CLS**: Cumulative Layout Shift: the sum of layout shift scores, each impact fraction times distance fraction, over the worst burst of shifts. Good is 0.1 or less, poor is over 0.25. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).
- **CLS**: Cumulative Layout Shift, the Core Web Vital that scores how much visible content moves unexpectedly while the page loads. See [17. Motion & perceived performance](modules/17-motion-and-perceived-performance.md).
- **Commit**: Applying only the differences from a render to the DOM, then running layout effects. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Component**: A function that takes props and returns elements. React calls it to render. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Component token**: A token scoped to one component, such as a button background. It usually points at a semantic token and lets one component deviate without touching the rest. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Composition**: Building a component from smaller parts the caller assembles, instead of switching its behaviour with props. See [05. Component design & composition](modules/05-component-design.md).
- **Composition point**: The moment the parts of a page are joined: build time, on the server, at the edge or in the browser. Later joins give more independent deploys and more runtime cost. See [22. Composition patterns](modules/22-mfe-composition.md).
- **Compositor**: The part of the browser that assembles painted layers into the final frame, often on a separate thread, which lets `transform` and `opacity` animate while JavaScript is busy. See [11. The browser's frame budget](modules/11-frame-budget.md).
- **Compound component**: A set of components, such as Tabs and Tab, that share implicit state through context while the caller controls the markup. See [05. Component design & composition](modules/05-component-design.md).
- **Container query**: A CSS rule that applies when the nearest container ancestor reaches a size, instead of when the viewport does. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Contract test**: A test that checks a consumer and a provider agree on a request and response shape without running both together. See [18. Testing strategy](modules/18-testing-strategy.md).
- **Controlled component**: A component whose value comes from a prop and whose changes are reported through a callback, so the parent owns the state. See [05. Component design & composition](modules/05-component-design.md).
- **Controlled input**: An input whose value lives in React state and is set on every render, so each keystroke renders the form. See [08. Forms & Actions](modules/08-forms-and-actions.md).
- **Conway's law**: The observation that a system tends to copy the communication structure of the organisation that builds it. The inverse manoeuvre shapes the teams to get the architecture you want. See [21. Why & when](modules/21-mfe-why-and-when.md).
- **Critical rendering path**: The sequence from request to first paint: HTML, then the CSS and blocking scripts it references, then layout and paint. Anything that blocks it delays LCP. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).
- **CSP**: Content Security Policy: a response header that tells the browser which sources of script, images and connections to allow, limiting what injected code can do. See [19. Frontend security](modules/19-frontend-security.md).
- **CSRF**: Cross-site request forgery: another site makes the browser send an authenticated request. `SameSite` cookies and anti-forgery tokens defend against it. See [19. Frontend security](modules/19-frontend-security.md).
- **Custom element**: A browser-native component registered with a tag name. Shadow DOM is the optional part that isolates its styles and markup. See [22. Composition patterns](modules/22-mfe-composition.md).

## D

- **Declarative UI**: Describing what the screen should look like for the current state and letting the framework work out the changes, instead of writing the DOM steps. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Deferred value**: A copy of a value from `useDeferredValue` that keeps its old value during an urgent render and updates in a later, interruptible render. See [13. Concurrent React](modules/13-concurrent-react.md).
- **Dependency array**: The list of reactive values an effect reads. When any changes by `Object.is`, the effect re-synchronises. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **Derived state**: A value you can calculate from props or other state. Compute it while rendering instead of storing it. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **Design token**: A named design decision, such as a colour, a space or a radius, stored once and read by code and design tools. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Discriminated union**: A TypeScript union whose members share a literal field, such as `kind`, so checking that field narrows the other props. See [05. Component design & composition](modules/05-component-design.md).
- **Distributed monolith**: Separately deployed parts that must still change and release together, so the system pays the cost of distribution without gaining independence. See [21. Why & when](modules/21-mfe-why-and-when.md).

## E

- **Easing**: The acceleration curve of an animation. Ease out starts fast and settles, which suits things entering, and ease in suits things leaving. See [17. Motion & perceived performance](modules/17-motion-and-perceived-performance.md).
- **Effect**: Code that runs after a commit to synchronise a component with a system outside React. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **Effect Event**: A function made with `useEffectEvent` that always sees the latest props and state and is not a dependency. Call it only from inside effects. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **Element**: A plain object, `{ type, props, key }`, that describes one piece of UI. It is returned by a component and recreated on every render. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Entry chunk**: The code every visitor downloads first: the framework runtime, the router, the layout and anything imported statically. See [09. Routing & code splitting](modules/09-routing-and-splitting.md).
- **Error boundary**: A component that catches errors thrown while rendering its subtree and shows a fallback instead of unmounting the app. See [07. Data fetching, Suspense & errors](modules/07-data-fetching.md).
- **Event bus**: A channel where remotes publish typed events and subscribe to them without knowing each other. Here it is built on `window` custom events. See [23. Sharing & communication](modules/23-mfe-sharing-and-communication.md).

## F

- **Fallback slot**: The placeholder a host renders in a slot when its remote fails or times out, sized like the real content. See [24. MFEs in production](modules/24-mfe-in-production.md).
- **Feature flag**: A runtime switch that turns a feature on for some users, so a release can be gradual and reversible. See [20. Build, ship & observe](modules/20-build-ship-observe.md).
- **Field data (RUM)**: Measurements from real users on real devices, such as the Chrome UX Report or your own real-user monitoring. Lab data comes from a controlled, repeatable run such as Lighthouse. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).
- **Flaky test**: A test that passes and fails on the same code, usually because of timing, shared state or uncontrolled data. See [18. Testing strategy](modules/18-testing-strategy.md).
- **Focus management**: Deciding where keyboard focus goes when the interface changes, such as a route change, an opened dialog or a deleted item. See [16. Accessibility](modules/16-accessibility.md).
- **Focus trap**: Keeping Tab and Shift+Tab inside an open modal until it closes. Native `<dialog>` with `showModal()` provides it. See [16. Accessibility](modules/16-accessibility.md).
- **Frame budget**: The time available to produce one frame: 16.7 ms at 60 Hz and 8.3 ms at 120 Hz, shared between your code and the browser. See [11. The browser's frame budget](modules/11-frame-budget.md).
- **Frozen lockfile**: Installing with the exact versions in the lockfile and failing if it is out of date, so CI builds what was reviewed. See [20. Build, ship & observe](modules/20-build-ship-observe.md).

## H

- **Headless component**: A component or hook that owns behaviour, state and accessibility but ships no styling, so the caller supplies the look. See [05. Component design & composition](modules/05-component-design.md).
- **Headless component**: A component that supplies behaviour, state and accessibility without any styling, so the design system provides the look. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Horizontal split**: A division by technical layer, such as UI, API and data. Most features cross every layer, so most features cross every team. See [21. Why & when](modules/21-mfe-why-and-when.md).
- **Host and remote**: The host is the page or shell that loads parts at runtime. A remote is a separately built and deployed part that the host loads and mounts. See [22. Composition patterns](modules/22-mfe-composition.md).
- **Hydration**: React attaching event handlers and state to HTML that the server already produced, by running the same components in the browser. The page is inert until it finishes. See [10. Rendering strategies](modules/10-rendering-strategies.md).
- **Hydration mismatch**: A difference between the HTML the server sent and what the first client render produces, usually caused by time, randomness or browser-only values read during render. See [10. Rendering strategies](modules/10-rendering-strategies.md).

## I

- **Idempotent**: An operation that has the same effect whether it runs once or several times. It makes a double submit or a retry safe. See [08. Forms & Actions](modules/08-forms-and-actions.md).
- **Immutability**: Never changing a value in place. To update state you create a copy so React can see the new reference. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **Implementation detail**: Something users cannot observe, such as a class name, a state variable or the markup structure. Tests that depend on it break on refactors. See [18. Testing strategy](modules/18-testing-strategy.md).
- **Import map**: A JSON block in the page that tells the browser which URL each bare module name resolves to. Native Federation and single-spa setups use it to share code. See [22. Composition patterns](modules/22-mfe-composition.md).
- **Independent deployability**: A team can build, test and release its part of the product without coordinating a release with other teams. It is the benefit micro frontends exist to buy. See [21. Why & when](modules/21-mfe-why-and-when.md).
- **INP**: Interaction to Next Paint: the latency from an input to the next frame, taken close to the worst across the visit. Good is 200 ms or less, poor is over 500 ms. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).
- **Instance**: What React keeps for a mounted component between renders: its state and its position in the tree. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Integration test**: A test that renders several real components together, often with a router and store, and fakes only the network. See [18. Testing strategy](modules/18-testing-strategy.md).
- **Island**: An interactive component hydrated on its own in an otherwise static page, so the rest of the page ships no JavaScript. See [10. Rendering strategies](modules/10-rendering-strategies.md).
- **isPending**: The flag from `useTransition` that is true while a transition is still rendering. See [13. Concurrent React](modules/13-concurrent-react.md).
- **ISR**: Incremental static regeneration. Static pages are rebuilt in the background on a schedule or on demand, so content refreshes without a full deploy. See [10. Rendering strategies](modules/10-rendering-strategies.md).

## J

- **Jank**: Visible stutter or delayed response caused by frames arriving late. See [11. The browser's frame budget](modules/11-frame-budget.md).

## K

- **Key**: A stable identity for an element among its siblings, used to match it across renders and to reset state on purpose. See [02. Rendering & reconciliation](modules/02-rendering.md).

## L

- **Landmark**: A region such as banner, navigation or main, created by `header`, `nav` and `main`, that lets screen reader users jump around the page. See [16. Accessibility](modules/16-accessibility.md).
- **Layout thrashing**: Alternating style writes and geometry reads so the browser is forced to run layout repeatedly instead of once. See [11. The browser's frame budget](modules/11-frame-budget.md).
- **LCP**: Largest Contentful Paint: the time until the largest image or text block in the viewport is rendered. Good is 2.5 s or less, poor is over 4 s. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).
- **Lifting state up**: Moving state to the nearest common parent so two components can share it through props. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **Live region**: An element, such as `role="status"`, whose text changes are announced without moving focus. It must exist before the change. See [16. Accessibility](modules/16-accessibility.md).
- **Long task**: Any task that keeps the main thread busy for more than 50 ms, long enough to delay input and painting. See [11. The browser's frame budget](modules/11-frame-budget.md).
- **Long task**: Any task that holds the main thread for more than 50 ms. Input and painting wait behind it. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).

## M

- **Main thread**: The single thread where the browser runs your JavaScript, handles input, and performs style, layout and paint. See [11. The browser's frame budget](modules/11-frame-budget.md).
- **memo**: A wrapper that makes React skip a component render when every prop is `Object.is` equal to last time. See [12. Re-renders, memoisation & the Compiler](modules/12-memoization-and-compiler.md).
- **Memoisation (memo)**: Wrapping a component so React skips its render when every prop is shallowly equal to last time. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **mf-manifest.json**: A file a Module Federation 2.0 remote emits that lists its exposed modules, shared dependencies and asset paths, so a host can load and preload it. See [22. Composition patterns](modules/22-mfe-composition.md).
- **Mock Service Worker**: A library that intercepts requests at the network layer, so tests use the real client code against faked responses. See [18. Testing strategy](modules/18-testing-strategy.md).
- **Modular monolith**: One deployable application with enforced internal module boundaries, public APIs per module and clear ownership. It gives most of the structure of micro frontends without runtime integration. See [21. Why & when](modules/21-mfe-why-and-when.md).
- **modulepreload**: A link hint that fetches a JavaScript module and its static imports early, so they download in parallel instead of in sequence. See [09. Routing & code splitting](modules/09-routing-and-splitting.md).
- **Monorepo**: One repository holding several packages, such as an app and shared libraries, installed and built together. See [20. Build, ship & observe](modules/20-build-ship-observe.md).

## O

- **One-way data flow**: Data moves down the tree as props, and changes move up as calls to functions the owner passed down. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Optimistic update**: Showing the expected result before the server confirms it, then replacing it with the real result when the Action settles. See [08. Forms & Actions](modules/08-forms-and-actions.md).
- **Optimistic update**: Showing the expected result of an action before the server confirms it, and rolling back if the server refuses. See [17. Motion & perceived performance](modules/17-motion-and-perceived-performance.md).
- **Outlet**: The place in a parent route where the matched child route renders. The parent layout stays mounted while the outlet changes. See [09. Routing & code splitting](modules/09-routing-and-splitting.md).
- **Overscan**: A few extra rows rendered just outside the viewport in a windowed list so fast scrolling does not show gaps. See [12. Re-renders, memoisation & the Compiler](modules/12-memoization-and-compiler.md).

## P

- **Perceived performance**: How fast an interface feels to the user. It depends on feedback, continuity and layout stability as much as on raw load time. See [17. Motion & perceived performance](modules/17-motion-and-perceived-performance.md).
- **Platform team**: A team that provides the shell, design tokens, shared dependency policy, observability and tooling that let stream-aligned product teams ship without rebuilding them. See [21. Why & when](modules/21-mfe-why-and-when.md).
- **Platform team**: A small team that owns the shared shell, contracts, tokens and pipeline templates that feature teams build on. See [24. MFEs in production](modules/24-mfe-in-production.md).
- **Prefetch**: Downloading a resource before the user asks for it, at low priority, so a later navigation finds it ready. Intent signals such as hover or focus decide what to fetch. See [09. Routing & code splitting](modules/09-routing-and-splitting.md).
- **Primitive token**: A raw value with no meaning attached, such as a palette step or a spacing step. It sits at the bottom of the token layers. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Progressive enhancement**: A form that submits and works before JavaScript loads, then becomes richer once React has hydrated. It needs a Server Function as the action. See [08. Forms & Actions](modules/08-forms-and-actions.md).
- **Props**: Read-only inputs a parent passes to a child. Changing them is the parent job. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Pure render**: A render that only calculates its elements from props and state, so React can safely repeat or discard it. See [01. How React thinks](modules/01-how-react-thinks.md).

## Q

- **Query priority**: Testing Library's order for finding elements: role first, then label and text, with test ids as a last resort. See [18. Testing strategy](modules/18-testing-strategy.md).

## R

- **Race condition**: A bug where the result depends on which of several asynchronous operations finishes last, such as a late response overwriting a newer one. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **React Compiler**: A build-time tool that adds memoisation to components and hooks automatically, provided the code follows the Rules of React. See [12. Re-renders, memoisation & the Compiler](modules/12-memoization-and-compiler.md).
- **Reactive value**: A prop, state or anything calculated from them during render. Values that can change between renders. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **Reconciliation**: Comparing the new element tree with the previous one, by type and key, to decide what to keep, update or remount. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Ref**: A mutable box that React keeps across renders. Changing it does not cause a render. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **Referential equality**: Two values being the same object in memory, as `Object.is` checks. Two identical-looking objects created separately are not equal. See [12. Re-renders, memoisation & the Compiler](modules/12-memoization-and-compiler.md).
- **Release-age gate**: A package manager setting, such as pnpm's `minimumReleaseAge`, that refuses versions published less than a set time ago. See [19. Frontend security](modules/19-frontend-security.md).
- **Remote manifest**: A small JSON file the host reads at runtime that maps each slot to the versioned URL of the remote that serves it. See [24. MFEs in production](modules/24-mfe-in-production.md).
- **Render**: React calling your component functions to compute the next element tree. It must be pure and does not touch the DOM. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Render-as-you-fetch**: Starting requests before rendering, at the route or in a loader, then rendering with the promises already in flight. See [07. Data fetching, Suspense & errors](modules/07-data-fetching.md).
- **requiredVersion**: The semver range a remote accepts for a shared package, checked against the registered version at load time. See [23. Sharing & communication](modules/23-mfe-sharing-and-communication.md).
- **Rolldown**: A Rust bundler with a Rollup-compatible plugin API that Vite 8 uses for production builds. See [20. Build, ship & observe](modules/20-build-ship-observe.md).

## S

- **Sanitisation**: Rebuilding untrusted HTML from an allow-list of tags and attributes so it cannot carry script. Use a maintained library such as DOMPurify. See [19. Frontend security](modules/19-frontend-security.md).
- **Search params**: The key and value pairs after `?` in a URL. They hold view state, such as filters and sort, that people can share, bookmark and reload. See [09. Routing & code splitting](modules/09-routing-and-splitting.md).
- **Selective hydration**: Hydrating Suspense boundaries independently as their code arrives, giving priority to the one the user interacts with. See [10. Rendering strategies](modules/10-rendering-strategies.md).
- **Selector**: A function that picks a slice from a store. The component renders only when the picked value changes by `Object.is`. See [06. State management at scale](modules/06-state-management.md).
- **Semantic token**: A token named for its role, such as the action colour or the surface colour. It points at a primitive, and theming works by changing that pointer. See [15. Styling & design systems](modules/15-styling-and-design-systems.md).
- **Server Component**: A component that runs only on the server, can read data directly and never ships its code to the browser. See [10. Rendering strategies](modules/10-rendering-strategies.md).
- **Server state**: A cached copy of data owned by a server. Others can change it, so it needs refetching, deduplication and invalidation. See [06. State management at scale](modules/06-state-management.md).
- **Shadow DOM**: A browser feature that gives an element its own DOM and style scope, so outside selectors cannot reach in and inside styles cannot leak out. See [23. Sharing & communication](modules/23-mfe-sharing-and-communication.md).
- **Share scope**: The runtime registry where the host and remotes register shared packages, each with a version, so one copy can be chosen. See [23. Sharing & communication](modules/23-mfe-sharing-and-communication.md).
- **Shared client state**: State that exists only in the browser and is needed by distant components, such as a theme or a wizard. It is usually the smallest category. See [06. State management at scale](modules/06-state-management.md).
- **Shared singleton**: A dependency such as React that the host and every remote must use as one instance, negotiated at runtime against a version range. See [22. Composition patterns](modules/22-mfe-composition.md).
- **single-spa**: A framework-agnostic orchestrator that registers applications, mounts and unmounts them by route, and gives each a bootstrap, mount and unmount lifecycle. See [22. Composition patterns](modules/22-mfe-composition.md).
- **Singleton (shared module)**: A dependency the share scope loads once for the whole page, so the host and every remote use the same instance. See [23. Sharing & communication](modules/23-mfe-sharing-and-communication.md).
- **Skeleton screen**: A grey placeholder with the same layout as the content that is loading, so nothing moves when the real content arrives. See [17. Motion & perceived performance](modules/17-motion-and-perceived-performance.md).
- **Snapshot**: The fixed values of props and state that one render sees. Handlers and closures created in that render keep them. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **Source map**: A file that maps minified code back to the original source, so stack traces and debuggers show the code you wrote. See [20. Build, ship & observe](modules/20-build-ship-observe.md).
- **Stale closure**: A function that keeps using the state or props of the render that created it after newer renders have happened. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **Stale-while-revalidate**: Showing cached data immediately while refetching in the background, then swapping in the fresh result. See [07. Data fetching, Suspense & errors](modules/07-data-fetching.md).
- **staleTime**: How long cached data counts as fresh. Within that window a query returns the cache without refetching. See [07. Data fetching, Suspense & errors](modules/07-data-fetching.md).
- **State**: Memory owned by one component and kept by React between renders. Setting it schedules a new render. See [01. How React thinks](modules/01-how-react-thinks.md).
- **Strangler fig**: A migration that puts a shell in front of a legacy app and moves one area at a time behind it until the old code can be retired. See [24. MFEs in production](modules/24-mfe-in-production.md).
- **Streaming SSR**: Sending server-rendered HTML in pieces. The shell goes first and each Suspense boundary is filled when its data is ready. See [10. Rendering strategies](modules/10-rendering-strategies.md).
- **StrictMode**: A development-only wrapper that renders twice and re-runs effect setup and cleanup to expose impure code. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Suspense boundary**: A `<Suspense>` element that shows its fallback until every component beneath it that suspended has resolved. See [07. Data fetching, Suspense & errors](modules/07-data-fetching.md).

## T

- **Testing trophy**: A model that puts most test effort into integration tests, with static checks as the base and a few unit and end-to-end tests around them. See [18. Testing strategy](modules/18-testing-strategy.md).
- **Time slicing**: Rendering in short slices, checking between components whether something more urgent needs the main thread. See [13. Concurrent React](modules/13-concurrent-react.md).
- **Transition**: A state update marked as non-urgent with `startTransition`. React renders it in an interruptible way and lets urgent updates go first. See [13. Concurrent React](modules/13-concurrent-react.md).
- **Transpile versus type check**: Transpiling rewrites TypeScript into JavaScript by removing types. Type checking verifies them. Bundlers do the first and never the second. See [20. Build, ship & observe](modules/20-build-ship-observe.md).
- **Tree-shaking**: Dropping exports that nothing imports during the build, which shrinks the bundle. It relies on static ES module imports and side-effect-free code. See [14. Core Web Vitals & loading](modules/14-web-vitals.md).
- **Trigger**: The event that schedules a render: a first mount, a state update, or a change in an external store. A component then renders because it mounted, owns the changed state, subscribes to the changed store, has a parent that rendered, or reads a context that changed. See [02. Rendering & reconciliation](modules/02-rendering.md).
- **Trusted Types**: A browser feature that makes dangerous DOM sinks such as `innerHTML` accept only values produced by a policy you define. See [19. Frontend security](modules/19-frontend-security.md).

## U

- **Uncontrolled component**: A component that keeps its own state, accepts only an initial `defaultValue`, and is repositioned from outside only by remounting. See [05. Component design & composition](modules/05-component-design.md).
- **Uncontrolled input**: An input whose value lives in the DOM. You read it with `FormData` when the form is submitted. See [08. Forms & Actions](modules/08-forms-and-actions.md).
- **Updater function**: A function passed to a state setter, such as `c => c + 1`, that React applies to the latest queued value. It must be pure. See [03. State & the snapshot model](modules/03-state-snapshots.md).
- **Urgent update**: An update tied to direct interaction, such as typing or clicking, that React renders and commits first. See [13. Concurrent React](modules/13-concurrent-react.md).
- **URL state**: State kept in the path or search params, such as filters or the open tab, so it survives reloads and can be shared as a link. See [06. State management at scale](modules/06-state-management.md).
- **useLayoutEffect**: An effect that runs after the DOM updates but before the browser paints, used for measuring and adjusting layout. See [04. Effects, refs & synchronisation](modules/04-effects-and-refs.md).
- **useMemo and useCallback**: Hooks that cache a computed value or a function between renders, so their identity only changes when their dependencies do. See [12. Re-renders, memoisation & the Compiler](modules/12-memoization-and-compiler.md).
- **useSyncExternalStore**: The React hook that subscribes a component to a store outside React and keeps every read consistent within a render. See [06. State management at scale](modules/06-state-management.md).

## V

- **Vertical slice**: A part of the product cut by business capability, such as catalogue or checkout, and owned end to end by one team across UI, API and data. See [21. Why & when](modules/21-mfe-why-and-when.md).
- **View Transition**: A browser feature that snapshots the old and new states of the page and animates between them. React 19.3 exposes it as `<ViewTransition>`. See [17. Motion & perceived performance](modules/17-motion-and-perceived-performance.md).

## W

- **Waterfall**: Requests that run one after another because each starts only after the previous one finished, so latencies add up. See [07. Data fetching, Suspense & errors](modules/07-data-fetching.md).
- **Windowing**: Also called virtualisation: rendering only the rows of a long list that are in or near the viewport. See [12. Re-renders, memoisation & the Compiler](modules/12-memoization-and-compiler.md).

## X

- **XSS**: Cross-site scripting: an attacker gets their script to run in your page, where it has your page's access to cookies, storage and the DOM. See [19. Frontend security](modules/19-frontend-security.md).

## Y

- **Yielding**: Handing control back to the event loop in the middle of a long job so the browser can paint and handle input before the job resumes. See [11. The browser's frame budget](modules/11-frame-budget.md).
