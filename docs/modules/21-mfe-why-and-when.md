> Generated from the app's content. Edit `apps/course/src/modules/21-mfe-why-and-when/content.ts`.

# 21. Why & when

**Micro frontends** · Module 21 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/21-mfe-why-and-when)

**The one idea:** Micro frontends solve an organisation-scaling problem, not a technical one, and they cost real complexity.

## After this you can

- Decide, with named criteria, whether a product should stay one app, pilot a slice or adopt micro frontends
- Explain Conway's law and why slices follow business capabilities instead of technical layers
- Name the costs micro frontends add and the guardrails that contain them

## The model

### A people problem first

Micro frontends split one web app into parts that separate teams build and deploy on their own, then join them somewhere between build and browser. The gain is **independent deployability**: a team ships its slice without a shared release train. That matters only when teams are blocking each other. Conway's law says a system's structure copies the communication structure of the organisation that builds it, so the split is an organisation decision with a technical costume on. Tooling is no longer the obstacle, because Module Federation 2.0, Native Federation and web components make splitting cheap. Choosing the right seams and paying the running costs are not cheap.

### Slice vertically

Split by business capability, not by layer. A **vertical slice**, such as catalogue, cart or account, is owned end to end by one team, from UI to API to data, so most features touch one team. A **horizontal** split, with a header team, a forms team and a data team, makes every feature cross three teams and three release queues. Shared UI belongs to a platform team that publishes it as a contract, such as design tokens or a component library, and not as a slice that features depend on.

### What it costs

You pay in five places. **Complexity**: contracts between slices, version negotiation and local development against remotes. **Consistency**: design and accessibility drift unless a platform enforces them. **Performance**: more requests, duplicated code, load waterfalls and layout shift when a slice arrives late. **Operations**: more pipelines, dashboards and on-call surfaces, and failures that cross team lines. **Testing**: you must verify combinations of versions that deploy independently. Each is manageable. Together they need a funded platform team.

### Try the modular monolith first

A **modular monolith** is one deployable with enforced internal boundaries: package public APIs, lint rules on imports, code owners per module and one build. It gives ownership and clear seams without runtime integration, so it is the baseline to beat. Move to micro frontends when several teams are demonstrably blocked by shared releases, the boundaries have held for months, you can afford the performance cost, and a platform team exists. Good reasons are a large organisation, a gradual migration off a legacy app and an acquired product. "Teams can pick any framework" is a weak reason, because every extra framework is another runtime to ship.

## Labs

The labs run in the app. Each one below links to the live version.

### Should we go micro frontends?

Try this:

- Press **Startup, one team**. The answer is a single app with clear modules, because nothing pushes towards a split
- Press **Enterprise portal** and note the answer, then set **Platform team** to **None**. Pressure stays at 100, capacity drops, and the advice falls back to a modular monolith first
- Press **Scale-up, six teams**, then set **Domain boundaries** to **Fuzzy**. A split along unclear seams is ruled out whatever the pressure, and the risks list says why
- Press **Scale-up, six teams** and drag **Teams** from 1 to 12. The answer is a single app at one or two teams and a pilot from three. It never reaches micro frontends, because capacity stays at 50

[Open the live lab](https://jdtoon.github.io/react-learn/modules/21-mfe-why-and-when#lab-should-we)

### Org chart to architecture

Try this:

- Keep **Organised by layer**, pick **Coupon field** and press **Replay**. Three teams touch it and the work waits in two queues
- Switch to **Organised by capability** with the same feature. The colours regroup into columns and one team owns every box the feature touches
- Pick **Buy again** under capability. It now costs more than under layers, because the feature crosses slices and the seams need a contract
- Compare the elapsed days for all three features under both shapes, and decide which shape suits the changes your product sees most

[Open the live lab](https://jdtoon.github.io/react-learn/modules/21-mfe-why-and-when#lab-org-to-architecture)

## Pitfalls

### Splitting by technical layer

- **Symptom:** Every feature needs changes from three teams and three releases, and the work queues behind each team in turn
- **Cause:** The seams follow technology, so Conway's law copies a layered organisation into the architecture. Each team owns a layer and no team owns an outcome
- **Fix:** Reslice by business capability and give each slice to one team end to end. Share UI through a platform-owned contract, not through a slice that other slices depend on

Bad:

```tsx
teams/
  header-team/
  forms-team/
  data-team/
```

Good:

```tsx
teams/
  catalogue/   (UI, API, data)
  checkout/    (UI, API, data)
  account/     (UI, API, data)
```

### Adopting it to fix a slow build or tangled code

- **Symptom:** The same tangled code now lives in four repositories, builds are no faster, and one change needs four pull requests
- **Cause:** Coupling inside the code was mistaken for a deployment problem. Splitting the deploy does not remove coupling, it moves it across a network
- **Fix:** Fix coupling and build time first: enforce module boundaries, cache or parallelise builds, and use a fast bundler such as Vite 8 with Rolldown. Split the deployment only when teams still block each other

Bad:

```tsx
import { priceLine } from '../../checkout/internal/price';
```

Good:

```tsx
import { priceLine } from '@shop/checkout';
```

### Splitting before the boundaries are stable

- **Symptom:** Two slices always change and release together, or a change in one forces a fix in another on the same day
- **Cause:** The seam was a guess, so you built a distributed monolith. Moving code across deployables costs two teams, two pipelines and a contract version
- **Fix:** Start as a modular monolith and watch where changes land. Split a seam once it has held for months and the teams on each side rarely need each other's release. If two slices always ship together, merge them

### No owner for the shared parts

- **Symptom:** Buttons, fonts and focus rings differ between slices, shared dependency versions drift, and nobody can trace a slow page
- **Cause:** Autonomy went to the slices while the design system, the shell, observability and dependency policy had no team
- **Fix:** Fund a platform team before the second slice ships. It owns the shell, design tokens, the shared dependency policy, error reporting and the paved road for creating a new slice

## In the meeting

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

## Self-check

1. One team of seven engineers owns the whole product and wants micro frontends because the build is slow. Is that a good reason?

   <details>
   <summary>Answer</summary>

   No. A slow build is a tooling problem, and one team has no cross-team coordination to remove. Fix the build with caching and a faster bundler, enforce module boundaries, and stay a modular monolith.

   </details>

2. The organisation has a header and navigation team, a forms team and a data team, each owning a remote. A feature needs a new checkout form with new data. What happens, and what is the fix?

   <details>
   <summary>Answer</summary>

   Three teams and three releases, in order. This is a horizontal split, and Conway's law copied the layered organisation into the system. Reslice by capability so one checkout team owns the form, the API and the data.

   </details>

3. What does independent deployability buy, and what gets you part of it without runtime integration?

   <details>
   <summary>Answer</summary>

   Teams ship without a shared release train. A modular monolith with enforced boundaries, code owners, trunk-based delivery and feature flags gives clear ownership and much of the speed, while the deploy stays shared and the runtime stays simple.

   </details>

## Go deeper

- [Micro Frontends (Cam Jackson)](https://martinfowler.com/articles/micro-frontends.html)
- [Conway's Law (Martin Fowler)](https://martinfowler.com/bliki/ConwaysLaw.html)
- [Monolith First (Martin Fowler)](https://martinfowler.com/bliki/MonolithFirst.html)
- [What is Module Federation](https://module-federation.io/guide/start/index.html)
