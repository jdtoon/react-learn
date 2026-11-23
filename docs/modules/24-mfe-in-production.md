> Generated from the app's content. Edit `apps/course/src/modules/24-mfe-in-production/content.ts`.

# 24. MFEs in production

**Micro frontends** · Module 24 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/24-mfe-in-production)

**The one idea:** Independent deploys need versioned remotes, fallbacks and contracts, or one team's bad deploy breaks the page.

## After this you can

- Describe how a host ships a new remote version with a manifest edit, a canary and a rollback, with no host rebuild
- Design failure handling so one remote outage costs one slot instead of the page
- Argue for the contracts, budgets and platform team that keep independent teams compatible, and say when to merge remotes back

## The model

### Deploying without the host

A micro-frontend exists to ship one slice without rebuilding the rest, so the host must not import remotes at build time. It reads a remote manifest at runtime: a small JSON file that maps each slot to a versioned entry URL such as `remotes/react-recs/v2/remoteEntry.js`.

A release is a new immutable build at its own path plus a one-line manifest change. Only the manifest and the entry file get a short cache lifetime. A canary serves a percentage of visitors, chosen by a stable hash of the user id so nobody flips between versions. Rollback reverses the same line, and nothing rebuilds.

### Contracts, budgets and telemetry

Independence lasts only while remotes keep their promises. A contract test in each remote's pipeline checks the shared event types and exposed module signatures, and fails the build before a break ships. Consumer-driven tests add the reverse view: neighbours state what they depend on.

Give each remote a performance budget, such as gzipped size and load time in its slot, enforced in CI, because the page's LCP and INP are the sum of every team's choices. Tag every log line, error and trace with the remote name and version, so an alert reaches the owning team.

### Failure is the default

Assume every remote will fail: a 404 on the entry, a hung connection, an exception in render. The host wraps each slot in an error boundary, times the load out (this course uses 8 s) and renders a fallback with the slot's dimensions so the layout does not jump. A boundary catches errors only. A hang is not an error, which is why the timeout exists.

Choose fallbacks by importance: hide a promo, show a cached cart, link to a plain checkout. Blast radius is the number of slots one failure touches. Shared state, shared CSS and one Suspense boundary around everything widen it.

### Governance, and when to merge back

A small platform team owns what is shared: the shell, contracts, tokens, pipeline templates and budgets. It builds a paved road and a short list of rules, and does not review each remote's code. Without it, every team rebuilds the same plumbing.

Migrate by strangler fig: put the shell in front of the monolith, carve out one low-risk slice behind a contract, and repeat while the old route stays one switch away. Merge remotes back when two always deploy together, share most of their code, or cost more in runtime and coordination than their autonomy is worth.

## Labs

The labs run in the app. Each one below links to the live version.

### Ship v2 without rebuilding the host

Try this:

- Press **Ramp to 5%**. One line of the manifest changes, the host build counter stays at 0, and your own bucket decides whether you are in the canary
- Keep **v2 has a bug** on and ramp to 25%, then 50%. The error rate crosses the budget and the gate tells you to roll back
- Press **Roll back**. The percentage returns to 0 and the Storefront below swaps back to v1 with no page reload
- Turn the bug off and ramp to 100%. Watch the Storefront listener count stay at 1 through every swap

[Open the live lab](https://jdtoon.github.io/react-learn/modules/24-mfe-in-production#lab-deploy-simulator)

### Kill a remote and measure the blast radius

Try this:

- Press **Kill Cart**. Cart shows its fallback, the other slots keep working, and the readout drops by one
- With Cart killed, press **Add** in the Catalogue. The log shows `cart:add` dropped: the failure has an effect no error boundary can display
- Kill the Catalogue as well, then restore both one at a time
- In the policy simulator, compare a remote that never answers under an error boundary only with the same remote under a boundary and a timeout

[Open the live lab](https://jdtoon.github.io/react-learn/modules/24-mfe-in-production#lab-resilience)

### Strangle the monolith, one slice at a time

Try this:

- Press **Next** from step 1 to step 2. Nothing on the page changes, yet the shell now owns every route
- At step 4, see why Promotion goes first: a leaf with little state and few callers. Read the shell line to find the one route that moved
- At step 7, find the area that never moved and ask whether rewriting it would help a user

[Open the live lab](https://jdtoon.github.io/react-learn/modules/24-mfe-in-production#lab-strangler-fig)

## Pitfalls

### Remote versions baked into the host build

- **Symptom:** Every remote release needs a host deploy, and teams queue behind the host pipeline
- **Cause:** The host config lists remote entry URLs at build time, so the host is the bottleneck the architecture was meant to remove
- **Fix:** Read a manifest at runtime and let each remote pipeline publish its build and edit its own manifest entry

Bad:

```tsx
remotes: { recs: 'recs@/remotes/react-recs/v2/remoteEntry.js' }
```

Good:

```tsx
const manifest = await fetch('/remotes/manifest.json', { cache: 'no-cache' }).then((r) => r.json());
```

### A cached entry file

- **Symptom:** A rollback is done but users keep seeing the bad version for hours
- **Cause:** The entry file or the manifest was served with a long cache lifetime, so browsers and the CDN never ask again
- **Fix:** Serve the manifest and entry with `no-cache` or a short `max-age`. Content-hash every asset beneath them and mark those `immutable`

### No timeout or fallback

- **Symptom:** One slow remote leaves a spinner forever, or a thrown error blanks the whole page
- **Cause:** A boundary catches errors but not a promise that never settles, and a lazy import that rejects with no boundary unmounts the tree
- **Fix:** Wrap every slot in a boundary, race the load against a timeout and render a fallback with the slot size

### A breaking event change with no version

- **Symptom:** After one deploy the cart total shows NaN, and the error trace points at nobody
- **Cause:** A producer renamed `sku` to `id`. Consumers silently read undefined
- **Fix:** Change contracts additively, version the event name when you cannot, and run contract tests in both the producer and consumer pipelines

### Telemetry for the page, not the remote

- **Symptom:** An alert says errors are up 4 percent and nobody knows whose problem it is
- **Cause:** Errors and traces carry no remote name or version
- **Fix:** Attach the remote id and version to every log, error and span, and route alerts by owner

## In the meeting

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

## Self-check

1. How do you roll back a bad recommendations release without rebuilding the host?

   <details>
   <summary>Answer</summary>

   Revert the manifest entry, or set the canary to 0. The old build is immutable and still hosted, so the host loads its URL on the next load, and a short cache lifetime on the manifest and entry makes that quick.

   </details>

2. A remote's server stops answering. What should the user see, and what limits the damage?

   <details>
   <summary>Answer</summary>

   A fallback in that slot only. The load timeout and the error boundary produce it, and no other slot shares its bundle, state or CSS. Events sent to it are dropped, so a critical flow needs its own alternative.

   </details>

3. When would you merge two micro-frontends back together?

   <details>
   <summary>Answer</summary>

   When they always deploy together, one team changes both, they share most of their code, or the duplicated runtime and coordination cost more than the independence is worth.

   </details>

## Go deeper

- [Module Federation: runtime](https://module-federation.io/guide/basic/runtime)
- [React: error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [web.dev: HTTP caching](https://web.dev/articles/http-cache)
- [Martin Fowler: Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Micro Frontends (Cam Jackson)](https://martinfowler.com/articles/micro-frontends.html)
