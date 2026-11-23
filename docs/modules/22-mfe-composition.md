> Generated from the app's content. Edit `apps/course/src/modules/22-mfe-composition/content.ts`.

# 22. Composition patterns

**Micro frontends** · Module 22 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/22-mfe-composition)

**The one idea:** Build-time, server-side, iframe, web component or Module Federation. Each draws the team boundary differently.

## After this you can

- Place each integration style at its composition point and say what it buys and costs
- Describe what happens at load time in Module Federation 2.0, including the manifest and the shared singleton
- Choose an integration style for a slot from independence, isolation, SEO and failure blast radius

## The model

### Where the parts are joined

Every approach answers one question: at what moment are the parts joined? At **build time**, teams publish packages and one pipeline builds the host. On the **server or edge**, a composer stitches HTML fragments per request. In the **client**, the browser loads each part at runtime, through an iframe, a web component, Module Federation or an import map. The later the join, the more independently teams deploy, and the more runtime cost, failure surface and version negotiation you carry. Most real platforms pick the join point per slot, not once for the whole product.

### Server, edge and iframes

**Server or edge composition** assembles the page before it reaches the browser, with server includes, edge workers or streamed HTML. First paint and SEO are strong and teams deploy fragments alone. Interactive fragments still hydrate on their own scripts, and the composer needs timeouts and fallbacks. An **iframe** is the opposite: a separate document with its own origin, globals, styles and crash domain. That suits third-party or legacy content. It costs a document and a framework copy per frame, `postMessage` plumbing, sizing and focus glue, and weak SEO and deep linking.

### Web components, import maps, single-spa

A **web component** is the framework-neutral contract: a custom element with attributes and properties in and DOM events out. Shadow DOM isolates CSS only if the element opts in, and the tag name is a global, so collisions are possible. **Import maps** let the browser resolve bare names such as `react` or `@shop/recs` to URLs. **Native Federation** builds on native ES modules and import maps, adding shared-dependency metadata. **single-spa** is an orchestrator that mounts and unmounts whole applications by route through `bootstrap`, `mount` and `unmount` lifecycles, and often pairs with import maps.

### Module Federation 2.0

A remote builds with `exposes` and `shared` and emits a `remoteEntry.js` and an `mf-manifest.json`. The host registers the remote by URL and loads it at runtime: manifest, then entry, then the exposed chunks, which is a waterfall unless you preload. Version 2.0 made the runtime, `@module-federation/runtime`, bundler-agnostic, so webpack, Rspack and Vite builds can interoperate, and added runtime plugins and preloading. The critical setting is `shared`: React must be a **singleton** with a version range, because two copies break hooks and context. Mount each remote behind `lazy`, `Suspense` and an error boundary, so a failed fetch becomes a local fallback.

## Labs

The labs run in the app. Each one below links to the live version.

### The live storefront

Try this:

- Leave **X-ray** off and use the page: add a product from the catalogue and watch the cart. It looks like one app, yet the boxes are separate builds from separate teams
- Turn **X-ray** on and read each tag: team, framework, how it was loaded, version, size and load time. React boxes load through Module Federation and show **same React**, the Vue, Svelte and Angular boxes are web components, and the store locator is an iframe
- Press **Kill Recommendations**. Only that box swaps to its fallback and the rest of the page keeps working. Press **Restore Recommendations** to bring it back
- Press **Kill Cart**, add a product from the catalogue, then press **Restore Cart**. The click worked but the cart is empty: the catalogue only announces the purchase, nothing was listening, and announcements are not replayed

[Open the live lab](https://jdtoon.github.io/react-learn/modules/22-mfe-composition#lab-live-storefront)

### Integration styles side by side

Try this:

- Select **Isolation** and **Small blast radius** in the matrix. Iframes lead, and the build-time package is last because it shares everything
- Select **SEO and SSR** and **Independent deploy** together. Server or edge composition is the only style that is strong on both
- Choose **Module Federation** and step through the load. Count the requests before the remote appears, and note that React is not fetched again
- Step through **Iframe**, then **Build-time package**, and compare the request lists

[Open the live lab](https://jdtoon.github.io/react-learn/modules/22-mfe-composition#lab-integration-styles)

## Pitfalls

### Two copies of React

- **Symptom:** Invalid hook call, or a context provider in the host is invisible inside a remote, but only when the remote is federated
- **Cause:** The remote bundled its own React because `shared` is missing or is not a singleton, so its hooks and contexts belong to a different React instance from the host
- **Fix:** Share `react` and `react-dom` as singletons with a `requiredVersion` range, agree one major version across teams, and verify with a runtime check that both sides resolve one instance

Bad:

```tsx
shared: {}
```

Good:

```tsx
shared: {
  react: { singleton: true, requiredVersion: '^19.3.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.3.0' },
}
```

### A remote with no failure boundary

- **Symptom:** One team's outage or a slow CDN blanks the whole page, or the page waits on a spinner for ever
- **Cause:** The host awaits the remote with no timeout and no error boundary, so a rejected import travels up to the root
- **Fix:** Wrap every slot in `Suspense` and an error boundary, add a timeout, and give each slot a fallback that says what is unavailable. Treat a remote as a network call that can fail

Bad:

```tsx
const Recs = lazy(() => import('recs/Recs'));

<Recs />
```

Good:

```tsx
<ErrorBoundary fallback={<SlotDown name="Recommendations" />}>
  <Suspense fallback={<SlotSkeleton height={320} />}>
    <Recs />
  </Suspense>
</ErrorBoundary>
```

### Styles that leak across slices

- **Symptom:** A heading or button in one slice changes colour or spacing after another team deploys
- **Cause:** Client-side remotes share one document, so a global selector or reset in one remote applies to all of them. Only iframes and shadow roots stop it
- **Fix:** Scope CSS with modules, a team prefix or `@scope`, ban element selectors in remotes, and share design tokens as CSS custom properties. Use shadow DOM when a slice must be sealed

Bad:

```tsx
h2 {
  font-size: 2rem;
}
```

Good:

```tsx
.recs-title {
  font-size: var(--text-lg);
}
```

### The load waterfall nobody measured

- **Symptom:** Largest Contentful Paint slips and the layout jumps when a slice arrives late
- **Cause:** The host loads the manifest, then the entry, then the chunks, one after another after its own JavaScript runs, and the slot has no reserved size
- **Fix:** Preload remote manifests, render above-the-fold slots on the server or edge, reserve each slot height, and enforce a size and load-time budget per slice in CI

### Exposing internals as the contract

- **Symptom:** A deploy by one team breaks another team's slice at runtime, with no failing build
- **Cause:** Remotes expose internal modules, other remotes import them, and the contract changes with every refactor
- **Fix:** Expose a small public surface, version it like an API, keep events additive, and run contract tests against the versions that are live

## In the meeting

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

## Self-check

1. A product page must rank in search and paint quickly, but three teams own parts of it and want to deploy alone. Which join point fits?

   <details>
   <summary>Answer</summary>

   Server or edge composition. The composer fetches each team fragment and streams HTML before any JavaScript runs, so crawlers and first paint get content while the teams still deploy alone. Client-side loading can enhance the interactive pieces afterwards.

   </details>

2. A federated remote throws Invalid hook call only when it is mounted in the host. What is the likely cause and the first check?

   <details>
   <summary>Answer</summary>

   Two copies of React: the remote bundled its own instead of using the host singleton. Check the `shared` config for `react` and `react-dom` on both sides, with `singleton` and a compatible version range, and confirm they resolve one instance.

   </details>

3. Module Federation 2.0 and Native Federation both load remotes at runtime. What is the main difference?

   <details>
   <summary>Answer</summary>

   Module Federation 2.0 has a bundler-agnostic runtime that negotiates shared dependencies and loads through a manifest, and works with webpack, Rspack and Vite. Native Federation leans on native ES modules and import maps, so the browser does the resolving and the library only builds the map.

   </details>

## Go deeper

- [Micro Frontends (Cam Jackson)](https://martinfowler.com/articles/micro-frontends.html)
- [What is Module Federation](https://module-federation.io/guide/start/index.html)
- [single-spa: micro frontend concepts](https://single-spa.js.org/docs/microfrontends-concept/)
- [MDN: import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap)
- [MDN: Web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
