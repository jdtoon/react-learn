> Generated from the app's content. Edit `apps/course/src/modules/23-mfe-sharing-and-communication/content.ts`.

# 23. Sharing & communication

**Micro frontends** · Module 23 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/23-mfe-sharing-and-communication)

**The one idea:** Share as little as possible: one React, a typed event contract and design tokens.

## After this you can

- Decide what a host shares (React, tokens, an event contract) and what every remote owns
- Explain singletons and `requiredVersion`, and why a second React crashes a federated remote that uses hooks
- Pick props, URL, events or a store for each remote-to-remote conversation, and veto a shared global store

## The model

### One React, by agreement

A federated remote's components render inside the host's React tree, so they must use the host's React. The host registers `react` and `react-dom` in a share scope. The remote lists them as `shared` with `singleton: true` and a `requiredVersion` such as `^19.0.0`, and the runtime hands it the host's copy.

Without that, the remote bundles its own React. Hooks then run against a renderer that never set up the host's dispatcher, and the first `useState` throws "Cannot read properties of null". In this course's build, such a remote loaded fine and crashed on first render. A singleton outside its range still shares and logs a warning, and `strictVersion` makes it an error. A non-singleton falls back to a second copy.

### Sharing is for correctness, not bytes

A remote that only exposes components bundles no renderer, because React 19 keeps it in `react-dom/client`. In the spike, sharing changed the fetched bytes by a few KB, and the federation runtime (about 65 KB) is paid either way. The saving appears when a remote would otherwise bundle a renderer: a minimal `react` plus `react-dom/client` bundle is 219 KB (68 KB gzipped). Share the framework, the tokens and the contract. Do not share business libraries to save bytes.

### Talking across remotes

Use the narrowest channel that works. A parent passes props or attributes down. A remote announces that something happened with a custom event, and a typed bus (`emit` and `on`) is that with a contract on top. The URL holds shared navigation state and survives a reload. Events are past-tense facts such as `cart:updated`, so the sender never knows who listens, and a missing listener is silent. Avoid a shared global store: it couples every remote to one schema and one release, which is the monolith you left.

### Who owns routing, identity and look

The host owns the URL and the shell. It maps top-level routes to remotes, and each remote owns the paths below its prefix. Two routers fighting over history is a classic failure. The host or an identity service owns the session, ideally an HTTP-only cookie, and remotes read identity or listen for `account:changed`. They never mint tokens.

Design tokens are the shared look: CSS custom properties that every framework can read. CSS inside React remotes is global, so a loose selector restyles the host. Shadow DOM, prefixed class names or an iframe contain it, at different costs.

## Labs

The labs run in the app. Each one below links to the live version.

### Watch the event bus

Try this:

- Press **Add** on a product in the Catalogue. The packet goes from the Catalogue to the bus and on to the Cart, and the Cart then announces `cart:updated` to Recommendations
- Press **Emit locator:store-selected**. Nothing listens for it, so the packet stops at the bus and the log row says dropped
- Press **Apply code** in the Promotion slot. A Svelte component talks to a React cart through the same contract
- Turn on reduced motion in your system settings and send another event. The packets stop moving, the route stays highlighted, and the log keeps every row

[Open the live lab](https://jdtoon.github.io/react-learn/modules/23-mfe-sharing-and-communication#lab-event-bus)

### One React or two

Try this:

- In the negotiation panel, keep `^19.0.0` and singleton on. The remote gets the host copy, one React in total
- Change the range to `^18.0.0`. A singleton still shares and warns. Turn on **strictVersion** and the remote refuses to load
- Switch singleton off with `^18.0.0`. The runtime falls back to a second copy, and the verdict turns to a hooks crash
- In the Storefront, choose **Own React** under Recommendations isolation and compare the React copies and the transferred bytes with **Shared React**

[Open the live lab](https://jdtoon.github.io/react-learn/modules/23-mfe-sharing-and-communication#lab-shared-deps)

### Who takes the leak

Try this:

- Press **CSS leak** with Shadow DOM selected. The React slots take the serif crimson style, and the scoreboard shows which slots were restyled
- Switch Reviews and Promotion to **Light DOM**. They join the restyled slots, because their markup now lives in the page
- Switch back to Shadow DOM and note the Account (Angular) and Store locator (iframe) rows. They were never reachable

[Open the live lab](https://jdtoon.github.io/react-learn/modules/23-mfe-sharing-and-communication#lab-css-isolation)

## Pitfalls

### A remote that does not share React

- **Symptom:** The remote loads without error, then the page goes blank with "Cannot read properties of null (reading useState)"
- **Cause:** The remote bundled its own React, so its hooks run on a renderer that is not rendering this tree
- **Fix:** Declare `react` and `react-dom` as singleton shared dependencies in every remote, with a loose major range, and register the same names in the host

Bad:

```tsx
shared: {}
```

Good:

```tsx
shared: {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
}
```

### A hidden second React in development

- **Symptom:** Everything works, yet the network panel shows the remote fetching an extra React chunk from its own origin
- **Cause:** The dev build also asks for `react/jsx-dev-runtime` and `react/compiler-runtime`. A host that registers only `react` and `react-dom` lets the runtime fall back to the remote copy for those
- **Fix:** Register every React subpath the remotes request in the host, and check the React copy count in a test

### A shared global store

- **Symptom:** One team renames a field and three remotes break in the same release, or a store upgrade needs every team to deploy together
- **Cause:** Every remote imports one state object, so the schema and the library version have become a hidden shared dependency
- **Fix:** Keep state inside each remote and publish facts as events in a typed contract. Put only navigation state in the URL

### Commands, not facts

- **Symptom:** Clicking Add does nothing and no error appears, or a rename silently stops a listener firing
- **Cause:** The sender emitted an untyped command and assumed a listener exists. Delivery to nobody is not an error
- **Fix:** Name events as past-tense facts in one shared type map, log dropped events, and test the contract

Bad:

```tsx
window.dispatchEvent(new CustomEvent('addToCart', { detail: sku }))
```

Good:

```tsx
emit('cart:add', { sku, name, price }, 'react-catalog')
```

### Global CSS that reaches across teams

- **Symptom:** A button in the host changes colour after a remote deploys
- **Cause:** A remote ships an unscoped selector such as `button`, and React remotes share the host document
- **Fix:** Scope with prefixes or CSS Modules, use Shadow DOM where the framework allows it, and share only tokens

## In the meeting

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

## Self-check

1. Why does a federated remote that bundles its own React crash when the host renders it?

   <details>
   <summary>Answer</summary>

   Hooks read the dispatcher of the React that is rendering the tree. The remote's own copy never set one up, so its first hook reads null. A singleton share gives the remote the host's copy.

   </details>

2. Sharing React barely changed the bytes in the lab. Why share it?

   <details>
   <summary>Answer</summary>

   For correctness. A components-only remote bundles no renderer, so the saving is a few KB and the runtime cost is paid either way. The byte saving only appears when a remote would bundle `react-dom/client`, about 219 KB.

   </details>

3. Two remotes must react to a purchase. Props, URL, event or shared store?

   <details>
   <summary>Answer</summary>

   A typed event such as `cart:updated`. It is a fact, so the sender needs no knowledge of listeners. The URL is for state that must survive a reload or a shared link, and a shared store couples releases.

   </details>

## Go deeper

- [Module Federation: shared](https://module-federation.io/configure/shared)
- [React: Invalid hook call warning](https://react.dev/warnings/invalid-hook-call-warning)
- [MDN: CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
