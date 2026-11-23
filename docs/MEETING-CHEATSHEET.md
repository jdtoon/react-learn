> Generated from the app's content. Edit the `content.ts` file of each module in `apps/course/src/modules/`.

# Meeting cheatsheet

What to say, what to ask and what to watch for, one card per module. The live version is at https://jdtoon.github.io/react-learn/meeting.

## Foundations

### 01. How React thinks

*You describe what the UI should look like for a given state. React works out the DOM changes.*

**Say**

- We describe the UI for a given state and React works out the DOM changes. We do not write the steps between screens.
- Props come down from the parent and are read-only. State has one owner. When a child needs to change something, the owner passes it a function.
- An element is a plain object describing what to render. Creating them is cheap. The cost sits in what React does with them afterwards.

**Ask**

- Which component owns this state, and does anything above it also need it?
- Is this value state, or can we calculate it from the props and state we already have?
- Does this render do anything other than calculate JSX?

**Red flags**

- Direct DOM writes such as `document.querySelector` or `innerHTML` inside a component React also renders
- A component that mutates its props or a module-level variable while rendering
- A value in state that two handlers must both remember to update
- A component called as a plain function instead of rendered as an element

**Trade-off:** Describing the UI as a function of state removes a whole class of out-of-sync bugs and costs a render model you have to keep pure, plus the work of finding the right owner for each piece of state.

[Full module guide](modules/01-how-react-thinks.md)

### 02. Rendering & reconciliation

*A re-render is React calling your function again. The DOM only changes where the output differs.*

**Say**

- A render is React calling the function again. A commit is the DOM change. Most renders commit little or nothing, so a render count alone says little about cost.
- Re-renders come from state, a parent rendering or context. A changed prop is a symptom of the parent rendering. Everything underneath runs again unless it is memoised or is `children` passed through.
- A key is identity. Index keys are fine on a list that never changes. Where items insert, reorder or delete, they attach state to the wrong item.
- To reset a component, change its key. That beats an effect that copies props into state.

**Ask**

- Where does this state live, and could it move lower so fewer components render when it changes?
- Did we profile before adding `memo`, and what did the numbers show before and after?
- What is the key on this list, and can items be inserted, reordered or removed?
- Is it slow because it renders too often, or because a single render is expensive?

**Red flags**

- `useEffect` that copies a prop or one piece of state into another
- `memo` around components whose props include inline objects or callbacks
- Array index or `Math.random()` as the key on a list that changes
- A component defined inside another component body
- Treating a re-render as a DOM update, and contorting code to avoid renders that cost nothing

**Trade-off:** Skipping renders with `memo` or by moving state down buys less work per update and costs extra code and comparisons, so it pays only where renders are frequent and expensive.

[Full module guide](modules/02-rendering.md)

### 03. State & the snapshot model

*State is a snapshot per render. Setting it schedules a new render; it does not change a variable.*

**Say**

- State is a snapshot. Setting it schedules a render with a new value and does not change the variable in the function that is running.
- Updates in one event are batched into one render. When the next value depends on the previous one, we pass an updater.
- We never mutate state. We copy it, because React compares references and a mutated object looks unchanged.
- If a value can be calculated from props or state, it should not be state.

**Ask**

- Is this value stored in state, or could we derive it while rendering?
- What does this timer or async callback close over, and is that still the snapshot we want?
- Who owns this state, and do two components really need to share it?

**Red flags**

- `push`, `splice`, `sort` or direct assignment on an array or object that lives in state
- Two pieces of state that must always change together, or an effect that copies one into the other
- `setInterval` or `setTimeout` reading a state variable instead of using an updater
- Flags such as `isLoading` and `isError` that can both be true

**Trade-off:** Copying state on every update keeps changes visible to React and makes undo and memoisation straightforward, at the cost of some allocation and awkward code for deeply nested data. Flatten the shape or use Immer where it hurts.

[Full module guide](modules/03-state-snapshots.md)

### 04. Effects, refs & synchronisation

*Effects are for syncing with systems outside React, not for reacting to your own state.*

**Say**

- An effect is for synchronising with something outside React, such as a socket, a timer or a browser API. If it only moves data between our own state, it should not be an effect.
- Each effect describes one synchronisation: how to start and how to stop. React re-runs it when its dependencies change, so cleanup is part of the contract.
- StrictMode runs setup and cleanup once more in development to check that stopping works. That is a test, not a bug.
- For fetching, we cancel or ignore stale responses, or use a data library. A bare fetch in an effect gives us races and no cache.

**Ask**

- What outside system does this effect synchronise with, and how does it stop?
- Could this be calculated during render, handled in the event that caused it, or reset with a key?
- Why is each dependency there, and what happens when a late response arrives after the user has moved on?

**Red flags**

- An effect whose body is just `setX(f(y))`
- A fetch in an effect with no cleanup, `AbortController` or ignore flag
- A disable directive on the `exhaustive-deps` lint rule
- Effects chained together, each setting the state the next one watches
- `ref.current` read or written during render

**Trade-off:** Effects reach the outside world, so each one is code React cannot reason about and that must clean up after itself; moving logic into render, events and keys keeps it visible, at the cost of deciding where each rule belongs.

[Full module guide](modules/04-effects-and-refs.md)

## Architecture

### 05. Component design & composition

*Compose with children and small parts instead of configuring one component with dozens of props.*

**Say**

- If layout flags keep arriving on one component, give callers the parts instead of another prop.
- Compound components share state through context so callers control markup and order. Headless components own behaviour and accessibility but no styling.
- Controlled means the parent owns the value. Uncontrolled means the component does. Support both with one hook, and never flip an instance between them.
- Discriminated unions make invalid prop combinations fail to compile.

**Ask**

- How many props change the layout of this component, and which exist for only one caller?
- Is this controlled or uncontrolled, and can the parent veto a change?
- Could a custom hook own this logic so we stop copying the same effects between components?
- What happens when a caller wraps one of these parts in their own component?

**Red flags**

- Boolean props that toggle layout, such as `isCompact`, `withFooter` or `noPadding`
- `cloneElement` or `Children.map` used to inject props into children
- A component that accepts `value` and `defaultValue` but ignores one of them
- A growing family of `renderX` props on a single component
- A reusable component whose props type is a long list of optional fields

**Trade-off:** Composition keeps components small and gives callers control, but callers must assemble the parts correctly and the common case takes more JSX than one configured prop would.

[Full module guide](modules/05-component-design.md)

### 06. State management at scale

*Classify state first: UI, server, URL, form. Most "global state" is really a server cache.*

**Say**

- Before we pick a library, what kind of state is this: UI, form, URL, server or shared client?
- Context injects stable values. It has no selectors, so a changing value renders every consumer.
- Most of our global state is a server cache. A cache with invalidation replaces the store and its loading flags.
- A selector store renders only components whose slice changed, at the cost of another dependency and mental model.

**Ask**

- Which parts of this store come from the server, and who else can change them?
- How often does this context value change, and how many components read it?
- Should this filter live in the URL so people can share and reload it?
- What do we lose if this state resets on navigation?

**Red flags**

- One `AppContext` holding user, theme, cart and notifications
- A global store whose actions are `setProducts`, `setLoading` and `setError`
- Selectors that return new objects or arrays
- State copied from props or the server into a store and synchronised by hand
- Choosing a state library before naming the kind of state it will hold

**Trade-off:** Selector stores and server caches cut re-renders and boilerplate, but each adds a dependency, a mental model and another place state can live.

[Full module guide](modules/06-state-management.md)

### 07. Data fetching, Suspense & errors

*Where you start a fetch decides your waterfalls. Suspense and error boundaries decide what users see meanwhile.*

**Say**

- Where does this fetch start? If it starts in a component that renders only after its parent has data, we have a waterfall.
- Start requests at the route or in a loader and render with what is in flight. Suspense decides what users see meanwhile.
- Server state belongs in a cache: shared in-flight requests, stale-while-revalidate and invalidation. `staleTime` is a per-query product decision.
- Boundaries are UX. Suspense places loading states, error boundaries contain failure, and both sit near the thing that can fail.

**Ask**

- Which of these requests truly depend on each other, and which are serial only because of the component structure?
- How stale can this data be before users notice, and what invalidates it?
- What does the user see if this widget fails, and can they retry without reloading the page?
- Is this promise created during render, or somewhere stable?

**Red flags**

- `useEffect` plus `useState` for `data`, `loading` and `error` in every component
- A child that fetches only after its parent has data it does not use
- A single Suspense boundary or error boundary at the root of the app
- `use(fetch(...))` called inside the component that renders
- An error fallback with no retry

**Trade-off:** Fetching early and in parallel cuts time to content but moves data requirements up the tree and couples routes to data, and a cache adds staleness you must choose per query.

[Full module guide](modules/07-data-fetching.md)

### 08. Forms & Actions

*React 19 Actions make async submits, pending states and optimistic updates built-in.*

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

[Full module guide](modules/08-forms-and-actions.md)

### 09. Routing & code splitting

*Routes are natural split points. Ship only the code for the screen the user is on.*

**Say**

- We split at the routes first. Each screen then costs its own bytes, and the entry chunk holds only the shell.
- Splitting moves cost from first load to navigation, so we pair it with prefetch on hover or visibility to hide the wait.
- Filters, sort and page live in the URL, so links, reloads and the Back button work without extra code.
- The route loader starts the data in parallel with the code chunk, not after it.

**Ask**

- What is in the entry chunk, what is the biggest thing in it, and does CI show a bundle report?
- What does the user see while a route chunk loads: a skeleton inside the layout, or a blank page?
- Can I paste this URL to a colleague and see the same view?
- Do we fetch data after the chunk loads, or alongside it?

**Red flags**

- `lazy()` called inside a component body
- One `Suspense` at the app root that blanks the whole page
- Filter or sort state in `useState` on a list that people share or revisit
- Every route imported statically in the router file
- Prefetching every chunk at start-up, which cancels the saving

**Trade-off:** Splitting shrinks the first load and adds a request at navigation, which you pay for with prefetching, more chunks to reason about and a fallback state to design.

[Full module guide](modules/09-routing-and-splitting.md)

### 10. Rendering strategies

*Where and when HTML is produced (client, server, build time, streamed) trades speed, cost and JavaScript shipped.*

**Say**

- SSR and SSG improve first paint, not interactivity. The page is visible but inert until hydration finishes.
- We choose per route: static where content is shared, server-rendered where it is personal or live, client-only behind a login.
- Server Components decide what code ships. Their libraries and data access stay on the server. SSR is a separate choice about where the first HTML is made.
- `use client` is a boundary, not a label on one component. Everything it imports goes to the browser.

**Ask**

- Who needs this page indexed, and how fast must content appear? That decides between CSR, SSR and SSG.
- How much JavaScript does this route ship, and how much of it hydrates content that never changes?
- Where are the `use client` boundaries, and can they move down to the leaves?
- What does per-request rendering cost us compared with serving static files?

**Red flags**

- SSR adopted for performance with no measurement of time to first byte or hydration time
- `use client` at the top of every file, or on a layout
- A hydration warning in the console that nobody owns
- `window` or `Date.now()` read during render in an app that renders on the server
- A large CSR bundle behind a public marketing page

**Trade-off:** Rendering earlier on the server improves first paint and indexing and costs server time, hosting complexity and a hydration step, while static files are cheapest but fit only content that is the same for everyone.

[Full module guide](modules/10-rendering-strategies.md)

## Performance

### 11. The browser's frame budget

*You get about 16 ms per frame on one main thread. Anything longer is felt as jank.*

**Say**

- Everything shares one main thread: our JavaScript, input handling, React rendering, layout and paint. At 60 Hz we have about 16 ms per frame, and a task over 50 ms is a long task users can feel.
- Animate `transform` and `opacity`, not `top`, `left` or `width`. The compositor can run those without the main thread.
- If one loop is the problem, slice it and yield. If it is heavy computation, move it to a worker.
- Layout thrashing is reads and writes interleaved. Batch the reads, then the writes.

**Ask**

- Is this still smooth on a mid-range phone with 4x CPU throttling, not just on a development laptop?
- Which task is the long one in the performance trace, and what called it?
- Is this animation using compositor-only properties?
- Can this work be sliced, deferred or moved to a worker, and what does the user see while it runs?

**Red flags**

- Animating `top`, `left`, `width` or `height` on something that moves every frame
- A loop that reads `offsetHeight` or `getBoundingClientRect` and writes styles in the same iteration
- Synchronous work over 50 ms inside an input handler, such as parsing, sorting or building a large structure
- "It is fast on my machine" as the only evidence

**Trade-off:** Yielding keeps the page responsive but finishes the work later and adds code, and a worker removes main thread cost but adds the cost of copying data and messaging.

[Full module guide](modules/11-frame-budget.md)

### 12. Re-renders, memoisation & the Compiler

*Most re-renders are cheap. Measure first, then memoise, or let the Compiler do it.*

**Say**

- A re-render is a function call. It only matters if it is slow or happens very often, so let us profile before we change anything.
- First choice is structure: move state down, or pass the heavy part in as children. Memoisation comes second, and one unstable prop, a new object, array or function, cancels it.
- The React Compiler automates `memo`, `useMemo` and `useCallback` when code follows the Rules of React. It will not speed up one slow render or shrink a huge list.
- If it is thousands of rows, the answer is windowing, not memo.

**Ask**

- What does the profiler show: which component, how long per render, and how often?
- Could this state live lower, or could this subtree be passed in as children?
- Is the Compiler enabled here, and do any components bail out of it?
- How many DOM nodes does this list produce, and does it need windowing or pagination?

**Red flags**

- `memo` or `useCallback` added everywhere with no profiler evidence
- Inline objects, arrays or functions passed to a memoised child
- A context provider whose `value` is a new object on every render
- Mutating props or state, or reading `ref.current` during render, in a codebase that relies on the Compiler
- Thousands of DOM rows, with "memo will handle it" as the plan

**Trade-off:** Memoisation trades memory, comparison cost and harder code for fewer renders, so it pays only where renders are slow or frequent. The Compiler lowers the code cost but still needs components to be pure.

[Full module guide](modules/12-memoization-and-compiler.md)

### 13. Concurrent React

*Transitions let urgent updates (typing) interrupt expensive ones (filtering a huge list).*

**Say**

- Concurrent React is about priority, not threads. Rendering can pause and restart, so an urgent update like typing is not queued behind a slow one.
- Transition the update that causes the slow render, never the input itself. The input stays urgent.
- `useDeferredValue` is the same idea when we cannot wrap the setter. It only helps if the slow child is memoised.
- `<Activity>` hides a tab and keeps its state, but it cleans up that tab's effects while hidden.

**Ask**

- What exactly is slow: many components, or one component with an expensive render? A transition only helps with the first.
- Is the slow child memoised, or does it re-render on every keystroke anyway?
- What does the user see while the update is pending: the old content, a dimmed list, a skeleton?
- Do any effects in the hidden tab need to keep running?

**Red flags**

- `startTransition` wrapped around the state of a controlled input
- `useDeferredValue` feeding a slow child that is not memoised
- A transition used to hide an expensive render rather than measuring and reducing it
- A hidden tab expected to keep polling or holding a connection open

**Trade-off:** Transitions keep input responsive but the result arrives later, may be rendered more than once and shows stale UI meanwhile. Activity trades memory and background render work for instant tab switches that keep state.

[Full module guide](modules/13-concurrent-react.md)

### 14. Core Web Vitals & loading

*LCP, INP and CLS are how Google and your users measure loading, responsiveness and stability.*

**Say**

- We pass when the 75th percentile of real visits is good on LCP, INP and CLS. Lab scores help us debug, but field data decides.
- INP is main-thread time: input delay, processing and presentation. We fix it by doing less per interaction or yielding between pieces of work.
- LCP is usually a discovery and priority problem, not a bandwidth one. Find the LCP element and make sure it is in the first HTML and fetched early.
- CLS is space we did not reserve. Give media dimensions, give late content a slot, and animate with transform.

**Ask**

- What is the field p75 for our key pages, split by device, and is that the number our target uses?
- Which element is the LCP here, and is it in the initial HTML rather than inserted by JavaScript?
- Which interactions have the worst INP, and how does that split into input delay, processing and presentation?
- What do third-party scripts cost in main-thread time, and who owns removing them?

**Red flags**

- Targets set from a Lighthouse score with no real-user data behind them
- `loading="lazy"` on the hero image, or a hero that only appears after JavaScript runs
- Images, embeds or ad slots with no reserved size
- Event handlers that sort or filter a large list in one synchronous pass
- A tag manager anyone can add scripts to without review

**Trade-off:** Meeting the thresholds means shipping less JavaScript and reserving space up front, which costs some design and feature freedom and buys pages that load and respond well for the slowest quarter of real users.

[Full module guide](modules/14-web-vitals.md)

## Craft

### 15. Styling & design systems

*Tokens are the contract between design and code. The styling tool is a detail.*

**Say**

- Tokens are the contract. Primitives hold raw values, semantic tokens say what they are for, and components read only semantic or component tokens. Theming swaps the middle layer.
- The styling tool matters less than the tokens. Whatever we pick should resolve to the same custom properties and avoid injecting styles at runtime.
- Shared components should use container queries, so they adapt to the space they are placed in, not to the screen.
- Headless primitives give us behaviour and accessibility and leave the look to our tokens. A full kit trades control for speed.

**Ask**

- Do components reference tokens by role or by raw value, and what breaks if we rebrand or add a dark theme?
- Who owns the token set, and how do design and code stay in sync?
- What does this library cost at runtime, and does it work with streaming and server components?
- How do we catch visual regressions across components and themes?

**Red flags**

- Hex values or raw palette variables inside component styles
- A runtime CSS-in-JS library on a performance-sensitive or server-rendered app
- `!important` used to win specificity fights
- Breakpoints in a reusable component that test the viewport
- A design system with no owner and no visual regression checks

**Trade-off:** A strict token layer and headless primitives cost design work up front and add indirection, and they buy consistent theming, simple rebrands and components that survive new contexts.

[Full module guide](modules/15-styling-and-design-systems.md)

### 16. Accessibility

*Semantic HTML gets you most of the way. Focus management is where React apps usually fail.*

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

[Full module guide](modules/16-accessibility.md)

### 17. Motion & perceived performance

*How fast it feels matters as much as how fast it is.*

**Say**

- The 100 ms budget is about feedback, not completion. Acknowledge the action at once, even if the result takes a second.
- A skeleton does not make the request faster. It prevents layout shift and makes the wait read as progress.
- Optimistic UI suits reversible actions that nearly always succeed, and it needs a rollback path the user can see.
- `<ViewTransition>` only animates updates that run inside a transition, an Action or a Suspense reveal.

**Ask**

- What does the user see in the first 100 ms after the click, and what do they see on failure?
- Does the placeholder match the final layout, and what does that do to CLS?
- Does this animation animate only `transform` and `opacity`, and does it respect `prefers-reduced-motion`?

**Red flags**

- A full-page spinner replacing content the user was already reading
- Optimistic updates on payments, deletes with no undo, or anything with side effects
- Animations longer than 400 ms that block interaction, or that play on every route change

**Trade-off:** Optimistic UI and rich motion buy a faster feel, and cost extra states to design, rollback code to test and more motion to keep accessible.

[Full module guide](modules/17-motion-and-perceived-performance.md)

## Production

### 18. Testing strategy

*Test what the user sees, so a refactor doesn't break tests that should still pass.*

**Say**

- Test behaviour the user can see. If a refactor keeps behaviour and a test fails, that test was checking the implementation.
- Most of our confidence should come from integration tests that render real components with the network faked, plus a few end-to-end tests for critical journeys.
- Types and lint are the cheapest tests we have. They run on every save.
- A flaky test is a defect. We fix it or quarantine it, and we do not retry until it goes green.

**Ask**

- If we rewrite this component's internals and keep its behaviour, which tests fail?
- Where is the network faked: at `fetch`, in our own wrapper, or at the network layer?
- What is our flake rate, and who owns it?
- Which journeys would cost us money if they broke, and are they covered end to end?

**Red flags**

- Coverage percentage as the goal, with assertions that check little
- Snapshots updated with `-u` without reading the diff
- Tests that call internal functions, read component state or mock the module under test
- Retries or `sleep` calls added to make a test pass

**Trade-off:** Higher-level tests give more confidence per test and cost more to run, debug and keep stable, so most effort goes in the middle and a few tests go at the top.

[Full module guide](modules/18-testing-strategy.md)

### 19. Frontend security

*React escapes text by default. The risks live in the escape hatches, tokens and dependencies.*

**Say**

- React escapes text, so XSS needs an escape hatch: `dangerouslySetInnerHTML`, a user-controlled URL or a third-party script. Those are the places to review.
- We assume an injection will eventually happen, so tokens live in `HttpOnly` cookies behind a BFF and a CSP limits what injected code can do.
- Everything shipped to the browser is public. Secrets belong on the server.
- Our first defences against npm worms are the lockfile, frozen installs and a release-age gate.

**Ask**

- Where do we use `dangerouslySetInnerHTML`, and what sanitises that HTML?
- Where is the access token stored, and what can a script on the page read?
- Is our CSP enforcing, and does it use nonces instead of `unsafe-inline`?
- How soon can a newly published dependency version reach our build, and who may run install scripts?

**Red flags**

- Tokens or personal data in `localStorage`
- A hand-written HTML sanitiser, or a regex that strips `<script>`
- API keys in `VITE_` or `NEXT_PUBLIC_` variables
- CI that installs without a lockfile, or dependencies on `latest`

**Trade-off:** A strict CSP, a BFF and delayed dependency updates raise the cost of an attack and cost you flexibility: no inline scripts, more backend work and slower access to patches.

[Full module guide](modules/19-frontend-security.md)

### 20. Build, ship & observe

*The toolchain turns TS and JSX into fast static files. CI, source maps and monitoring keep it honest in production.*

**Say**

- Vite transpiles, it does not type-check. Type checking, linting and tests are separate CI steps, and each one has to block the deploy.
- We build once, upload the artefact and deploy that same artefact. The deploy job is the only one with write permissions.
- Source maps go to the error tracker, not the CDN, and every release is tagged with the commit SHA.
- Risky changes go behind a flag with a percentage rollout, so the rollback is a toggle.

**Ask**

- Which CI steps can fail the pipeline, and do type errors and failing tests block a deploy?
- How do we find out about a production exception, and how long does that take?
- Where do source maps go, and can we map a production stack trace to a commit?
- What does it cost us to switch bundlers, and have we measured our own build?

**Red flags**

- A pipeline that only runs the build
- Deploying from a developer machine, or rebuilding at deploy time
- Public source maps, or no source maps and unreadable stack traces
- Flags with no owner and no removal date

**Trade-off:** More pipeline stages and monitoring catch more problems before and after release, and cost build minutes, setup effort and a slower path to production.

[Full module guide](modules/20-build-ship-observe.md)

## Micro frontends

### 21. Why & when

*Micro frontends solve an organisation-scaling problem, not a technical one, and they cost real complexity.*

**Say**

- Micro frontends are an organisational scaling tool. They buy independent deployability for teams and charge for it in runtime complexity, consistency and performance.
- Before we split, what does a modular monolith with enforced boundaries not give us? That is the baseline to beat.
- We slice vertically by business capability, one team from UI to data, so most features ship without a cross-team release.
- Conway's law runs both ways: choose the architecture we want, then check the organisation can sustain it.

**Ask**

- Which teams are blocked on each other's releases today, and how often?
- Where are the domain boundaries, and have they held for the last year?
- Who owns the shell, the design tokens, the shared dependencies and the on-call for the integration?
- What is our performance budget, and what does each extra slice spend from it?
- If two slices always release together, are they one slice?

**Red flags**

- Chosen for the technology or the CV value, with no release pain behind it
- Seams drawn by technical layer: header, forms, data layer
- One team juggling several remotes, or one remote that needs three teams to change
- Several frameworks adopted for freedom with no platform team to fund the paved road
- No budget, owner or measurement for shared dependencies, tokens and observability

**Trade-off:** Micro frontends trade runtime complexity, consistency and some performance for independent team delivery, so they pay back only when the coordination cost between teams is larger than the platform cost.

[Full module guide](modules/21-mfe-why-and-when.md)

### 22. Composition patterns

*Build-time, server-side, iframe, web component or Module Federation. Each draws the team boundary differently.*

**Say**

- Pick the join point per slot: build time when teams can share a release, server or edge when SEO and first paint matter, the client when teams must deploy alone.
- Module Federation 2.0 gives us a bundler-agnostic runtime and a manifest. The decisions that matter are the shared singletons, the version policy and what each slice exposes.
- Iframes buy isolation at the price of a document and a framework copy per frame. Web components buy a neutral contract, but only shadow DOM isolates styles.
- Every remote is a network call that can fail, so each slot needs a boundary, a timeout and a fallback.

**Ask**

- Which slots need SEO or fast first paint, and can they be composed on the server or edge?
- What is our shared dependency policy, and who bumps React for everyone?
- What exactly does each remote expose, and how do we version and test that contract?
- What does the page show when this remote is down or slow?
- What is the size and load-time budget per slice, and where is it enforced?

**Red flags**

- A remote that bundles its own React on an all-React platform
- Remotes that import each other's internal modules instead of a published contract
- No error boundary, timeout or reserved height around a slot
- Global CSS in a remote
- A different integration style for every team with no platform guidance

**Trade-off:** The later you join the parts, the more independently teams deploy, and the more runtime cost, failure surface and version coordination you carry.

[Full module guide](modules/22-mfe-composition.md)

### 23. Sharing & communication

*Share as little as possible: one React, a typed event contract and design tokens.*

**Say**

- React is a singleton in the share scope with a major-version range, so every remote renders with the host's copy.
- Remotes publish past-tense events in a typed contract. Nobody calls another remote.
- Design tokens are the shared look. We share the contract and the tokens, not component code.
- The host owns routing and the session. Remotes read identity and never mint it.

**Ask**

- Who upgrades React, and how do we learn which remotes break before the host moves?
- What happens to an event when its listener is not loaded, and do we log it?
- How do we stop a remote's CSS reaching the host, and the host's reaching remotes?

**Red flags**

- A Redux or Zustand store that every remote imports
- A remote with its own React copy mounted into the host's tree
- Auth tokens in localStorage read by several remotes
- Commands such as `doAddToCart` with no schema and no logging of drops

**Trade-off:** Sharing more saves bytes and keeps the look consistent but ties release schedules together. Sharing less keeps teams independent and costs duplicated code.

[Full module guide](modules/23-mfe-sharing-and-communication.md)

### 24. MFEs in production

*Independent deploys need versioned remotes, fallbacks and contracts, or one team's bad deploy breaks the page.*

**Say**

- A deploy is a manifest change. The remote ships to its own versioned path and the host never rebuilds.
- We canary by stable user bucket and roll back by reverting one manifest line.
- Every slot has an error boundary, a timeout and a same-size fallback, so a failure costs one slot.
- Contracts, budgets and per-remote telemetry live in each team pipeline, set by a platform team.

**Ask**

- What is the rollback procedure, and how long until users really get the old version?
- Which slots may degrade gracefully, and which are important enough to block the page?
- Who owns each contract and budget, and what fails the build when one is broken?

**Red flags**

- The host build lists remote versions, so every release needs a host deploy
- A remote on the critical path with no timeout or fallback
- Errors and traces with no remote name or version
- A migration plan that switches everything over on one date

**Trade-off:** Independent deploys buy team speed and fast rollback, and cost a platform to maintain: manifests, contract tests, telemetry and fallbacks that a monolith gets for free.

[Full module guide](modules/24-mfe-in-production.md)
