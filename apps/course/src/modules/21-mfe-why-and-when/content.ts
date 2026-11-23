import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '21-mfe-why-and-when',
  number: 21,
  title: 'Why & when',
  track: 'micro-frontends',
  oneIdea:
    'Micro frontends solve an organisation-scaling problem, not a technical one, and they cost real complexity.',
  minutes: 12,
  phase: 1,
  outcomes: [
    'Decide, with named criteria, whether a product should stay one app, pilot a slice or adopt micro frontends',
    "Explain Conway's law and why slices follow business capabilities instead of technical layers",
    'Name the costs micro frontends add and the guardrails that contain them',
  ],
  sections: [
    {
      heading: 'A people problem first',
      paragraphs: [
        "Micro frontends split one web app into parts that separate teams build and deploy on their own, then join them somewhere between build and browser. The gain is **independent deployability**: a team ships its slice without a shared release train. That matters only when teams are blocking each other. Conway's law says a system's structure copies the communication structure of the organisation that builds it, so the split is an organisation decision with a technical costume on. Tooling is no longer the obstacle, because Module Federation 2.0, Native Federation and web components make splitting cheap. Choosing the right seams and paying the running costs are not cheap.",
      ],
    },
    {
      heading: 'Slice vertically',
      paragraphs: [
        'Split by business capability, not by layer. A **vertical slice**, such as catalogue, cart or account, is owned end to end by one team, from UI to API to data, so most features touch one team. A **horizontal** split, with a header team, a forms team and a data team, makes every feature cross three teams and three release queues. Shared UI belongs to a platform team that publishes it as a contract, such as design tokens or a component library, and not as a slice that features depend on.',
      ],
    },
    {
      heading: 'What it costs',
      paragraphs: [
        'You pay in five places. **Complexity**: contracts between slices, version negotiation and local development against remotes. **Consistency**: design and accessibility drift unless a platform enforces them. **Performance**: more requests, duplicated code, load waterfalls and layout shift when a slice arrives late. **Operations**: more pipelines, dashboards and on-call surfaces, and failures that cross team lines. **Testing**: you must verify combinations of versions that deploy independently. Each is manageable. Together they need a funded platform team.',
      ],
    },
    {
      heading: 'Try the modular monolith first',
      paragraphs: [
        'A **modular monolith** is one deployable with enforced internal boundaries: package public APIs, lint rules on imports, code owners per module and one build. It gives ownership and clear seams without runtime integration, so it is the baseline to beat. Move to micro frontends when several teams are demonstrably blocked by shared releases, the boundaries have held for months, you can afford the performance cost, and a platform team exists. Good reasons are a large organisation, a gradual migration off a legacy app and an acquired product. "Teams can pick any framework" is a weak reason, because every extra framework is another runtime to ship.',
      ],
    },
  ],
  labs: [
    {
      id: 'should-we',
      title: 'Should we go micro frontends?',
      tryThis: [
        'Press **Startup, one team**. The answer is a single app with clear modules, because nothing pushes towards a split',
        'Press **Enterprise portal** and note the answer, then set **Platform team** to **None**. Pressure stays at 100, capacity drops, and the advice falls back to a modular monolith first',
        'Press **Scale-up, six teams**, then set **Domain boundaries** to **Fuzzy**. A split along unclear seams is ruled out whatever the pressure, and the risks list says why',
        'Press **Scale-up, six teams** and drag **Teams** from 1 to 12. The answer is a single app at one or two teams and a pilot from three. It never reaches micro frontends, because capacity stays at 50',
      ],
      whatHappened:
        'The tool scores two things separately. Pressure is what pushes you to split: team count, how often releases wait on each other, and a legacy or mixed stack. Capacity is what lets you pay for it: stable domain boundaries, a platform team and performance headroom. A split needs both. High pressure with low capacity is the common trap, and it points to a modular monolith that builds the missing capacity first. Fuzzy boundaries rule out a split altogether, because a seam in the wrong place is expensive to move once it is a deployment boundary. The weights are a judgement, not a measurement, so the breakdown is on show for you to argue with.',
    },
    {
      id: 'org-to-architecture',
      title: 'Org chart to architecture',
      tryThis: [
        'Keep **Organised by layer**, pick **Coupon field** and press **Replay**. Three teams touch it and the work waits in two queues',
        'Switch to **Organised by capability** with the same feature. The colours regroup into columns and one team owns every box the feature touches',
        'Pick **Buy again** under capability. It now costs more than under layers, because the feature crosses slices and the seams need a contract',
        'Compare the elapsed days for all three features under both shapes, and decide which shape suits the changes your product sees most',
      ],
      whatHappened:
        "Conway's law says the system copies the communication structure of the organisation. With teams organised by layer, every feature crosses every layer boundary, so each one pays handoffs between teams, and the architecture settles into stacked layers that release together. With teams organised by capability, the common feature stays inside one slice and ships alone. The cost moves to the seams: a feature that spans slices needs an explicit contract and two or three teams, as Buy again shows. That is the real trade of a vertical split. Draw slice boundaries where features rarely cross, and treat the contract between slices as a product.",
    },
  ],
  pitfalls: [
    {
      title: 'Splitting by technical layer',
      symptom:
        'Every feature needs changes from three teams and three releases, and the work queues behind each team in turn',
      cause:
        "The seams follow technology, so Conway's law copies a layered organisation into the architecture. Each team owns a layer and no team owns an outcome",
      fix: 'Reslice by business capability and give each slice to one team end to end. Share UI through a platform-owned contract, not through a slice that other slices depend on',
      bad: 'teams/\n  header-team/\n  forms-team/\n  data-team/',
      good: 'teams/\n  catalogue/   (UI, API, data)\n  checkout/    (UI, API, data)\n  account/     (UI, API, data)',
    },
    {
      title: 'Adopting it to fix a slow build or tangled code',
      symptom:
        'The same tangled code now lives in four repositories, builds are no faster, and one change needs four pull requests',
      cause:
        'Coupling inside the code was mistaken for a deployment problem. Splitting the deploy does not remove coupling, it moves it across a network',
      fix: 'Fix coupling and build time first: enforce module boundaries, cache or parallelise builds, and use a fast bundler such as Vite 8 with Rolldown. Split the deployment only when teams still block each other',
      bad: "import { priceLine } from '../../checkout/internal/price';",
      good: "import { priceLine } from '@shop/checkout';",
    },
    {
      title: 'Splitting before the boundaries are stable',
      symptom:
        'Two slices always change and release together, or a change in one forces a fix in another on the same day',
      cause:
        'The seam was a guess, so you built a distributed monolith. Moving code across deployables costs two teams, two pipelines and a contract version',
      fix: "Start as a modular monolith and watch where changes land. Split a seam once it has held for months and the teams on each side rarely need each other's release. If two slices always ship together, merge them",
    },
    {
      title: 'No owner for the shared parts',
      symptom:
        'Buttons, fonts and focus rings differ between slices, shared dependency versions drift, and nobody can trace a slow page',
      cause:
        'Autonomy went to the slices while the design system, the shell, observability and dependency policy had no team',
      fix: 'Fund a platform team before the second slice ships. It owns the shell, design tokens, the shared dependency policy, error reporting and the paved road for creating a new slice',
    },
  ],
  meeting: {
    say: [
      'Micro frontends are an organisational scaling tool. They buy independent deployability for teams and charge for it in runtime complexity, consistency and performance.',
      'Before we split, what does a modular monolith with enforced boundaries not give us? That is the baseline to beat.',
      'We slice vertically by business capability, one team from UI to data, so most features ship without a cross-team release.',
      "Conway's law runs both ways: choose the architecture we want, then check the organisation can sustain it.",
    ],
    ask: [
      "Which teams are blocked on each other's releases today, and how often?",
      'Where are the domain boundaries, and have they held for the last year?',
      'Who owns the shell, the design tokens, the shared dependencies and the on-call for the integration?',
      'What is our performance budget, and what does each extra slice spend from it?',
      'If two slices always release together, are they one slice?',
    ],
    redFlags: [
      'Chosen for the technology or the CV value, with no release pain behind it',
      'Seams drawn by technical layer: header, forms, data layer',
      'One team juggling several remotes, or one remote that needs three teams to change',
      'Several frameworks adopted for freedom with no platform team to fund the paved road',
      'No budget, owner or measurement for shared dependencies, tokens and observability',
    ],
    tradeoff:
      'Micro frontends trade runtime complexity, consistency and some performance for independent team delivery, so they pay back only when the coordination cost between teams is larger than the platform cost.',
  },
  selfCheck: [
    {
      question:
        'One team of seven engineers owns the whole product and wants micro frontends because the build is slow. Is that a good reason?',
      answer:
        'No. A slow build is a tooling problem, and one team has no cross-team coordination to remove. Fix the build with caching and a faster bundler, enforce module boundaries, and stay a modular monolith.',
    },
    {
      question:
        'The organisation has a header and navigation team, a forms team and a data team, each owning a remote. A feature needs a new checkout form with new data. What happens, and what is the fix?',
      answer:
        "Three teams and three releases, in order. This is a horizontal split, and Conway's law copied the layered organisation into the system. Reslice by capability so one checkout team owns the form, the API and the data.",
    },
    {
      question:
        'What does independent deployability buy, and what gets you part of it without runtime integration?',
      answer:
        'Teams ship without a shared release train. A modular monolith with enforced boundaries, code owners, trunk-based delivery and feature flags gives clear ownership and much of the speed, while the deploy stays shared and the runtime stays simple.',
    },
  ],
  links: [
    {
      label: 'Micro Frontends (Cam Jackson)',
      url: 'https://martinfowler.com/articles/micro-frontends.html',
    },
    {
      label: "Conway's Law (Martin Fowler)",
      url: 'https://martinfowler.com/bliki/ConwaysLaw.html',
    },
    {
      label: 'Monolith First (Martin Fowler)',
      url: 'https://martinfowler.com/bliki/MonolithFirst.html',
    },
    {
      label: 'What is Module Federation',
      url: 'https://module-federation.io/guide/start/index.html',
    },
  ],
  glossary: [
    {
      term: "Conway's law",
      definition:
        'The observation that a system tends to copy the communication structure of the organisation that builds it. The inverse manoeuvre shapes the teams to get the architecture you want.',
    },
    {
      term: 'Independent deployability',
      definition:
        'A team can build, test and release its part of the product without coordinating a release with other teams. It is the benefit micro frontends exist to buy.',
    },
    {
      term: 'Vertical slice',
      definition:
        'A part of the product cut by business capability, such as catalogue or checkout, and owned end to end by one team across UI, API and data.',
    },
    {
      term: 'Horizontal split',
      definition:
        'A division by technical layer, such as UI, API and data. Most features cross every layer, so most features cross every team.',
    },
    {
      term: 'Modular monolith',
      definition:
        'One deployable application with enforced internal module boundaries, public APIs per module and clear ownership. It gives most of the structure of micro frontends without runtime integration.',
    },
    {
      term: 'Distributed monolith',
      definition:
        'Separately deployed parts that must still change and release together, so the system pays the cost of distribution without gaining independence.',
    },
    {
      term: 'Platform team',
      definition:
        'A team that provides the shell, design tokens, shared dependency policy, observability and tooling that let stream-aligned product teams ship without rebuilding them.',
    },
  ],
};
