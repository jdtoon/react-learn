import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '24-mfe-in-production',
  number: 24,
  title: 'MFEs in production',
  track: 'micro-frontends',
  oneIdea:
    "Independent deploys need versioned remotes, fallbacks and contracts, or one team's bad deploy breaks the page.",
  minutes: 12,
  phase: 1,
  outcomes: [
    'Describe how a host ships a new remote version with a manifest edit, a canary and a rollback, with no host rebuild',
    'Design failure handling so one remote outage costs one slot instead of the page',
    'Argue for the contracts, budgets and platform team that keep independent teams compatible, and say when to merge remotes back',
  ],
  sections: [
    {
      heading: 'Deploying without the host',
      paragraphs: [
        'A micro-frontend exists to ship one slice without rebuilding the rest, so the host must not import remotes at build time. It reads a remote manifest at runtime: a small JSON file that maps each slot to a versioned entry URL such as `remotes/react-recs/v2/remoteEntry.js`.',
        'A release is a new immutable build at its own path plus a one-line manifest change. Only the manifest and the entry file get a short cache lifetime. A canary serves a percentage of visitors, chosen by a stable hash of the user id so nobody flips between versions. Rollback reverses the same line, and nothing rebuilds.',
      ],
    },
    {
      heading: 'Contracts, budgets and telemetry',
      paragraphs: [
        "Independence lasts only while remotes keep their promises. A contract test in each remote's pipeline checks the shared event types and exposed module signatures, and fails the build before a break ships. Consumer-driven tests add the reverse view: neighbours state what they depend on.",
        "Give each remote a performance budget, such as gzipped size and load time in its slot, enforced in CI, because the page's LCP and INP are the sum of every team's choices. Tag every log line, error and trace with the remote name and version, so an alert reaches the owning team.",
      ],
    },
    {
      heading: 'Failure is the default',
      paragraphs: [
        "Assume every remote will fail: a 404 on the entry, a hung connection, an exception in render. The host wraps each slot in an error boundary, times the load out (this course uses 8 s) and renders a fallback with the slot's dimensions so the layout does not jump. A boundary catches errors only. A hang is not an error, which is why the timeout exists.",
        'Choose fallbacks by importance: hide a promo, show a cached cart, link to a plain checkout. Blast radius is the number of slots one failure touches. Shared state, shared CSS and one Suspense boundary around everything widen it.',
      ],
    },
    {
      heading: 'Governance, and when to merge back',
      paragraphs: [
        "A small platform team owns what is shared: the shell, contracts, tokens, pipeline templates and budgets. It builds a paved road and a short list of rules, and does not review each remote's code. Without it, every team rebuilds the same plumbing.",
        'Migrate by strangler fig: put the shell in front of the monolith, carve out one low-risk slice behind a contract, and repeat while the old route stays one switch away. Merge remotes back when two always deploy together, share most of their code, or cost more in runtime and coordination than their autonomy is worth.',
      ],
    },
  ],
  labs: [
    {
      id: 'deploy-simulator',
      title: 'Ship v2 without rebuilding the host',
      tryThis: [
        'Press **Ramp to 5%**. One line of the manifest changes, the host build counter stays at 0, and your own bucket decides whether you are in the canary',
        'Keep **v2 has a bug** on and ramp to 25%, then 50%. The error rate crosses the budget and the gate tells you to roll back',
        'Press **Roll back**. The percentage returns to 0 and the Storefront below swaps back to v1 with no page reload',
        'Turn the bug off and ramp to 100%. Watch the Storefront listener count stay at 1 through every swap',
      ],
      whatHappened:
        'The host reads the manifest at runtime, so a release is a new immutable build at its own path and one edited line. A canary gives each visitor a stable bucket from 0 to 99 and serves v2 to buckets below the percentage, so a reload never flips you. Rollback reverts the same line. The error rate is simulated, but the swap is real: the Storefront unmounts v1, which releases its bus listener, and mounts v2 without a page reload or a host build.',
    },
    {
      id: 'resilience',
      title: 'Kill a remote and measure the blast radius',
      tryThis: [
        'Press **Kill Cart**. Cart shows its fallback, the other slots keep working, and the readout drops by one',
        'With Cart killed, press **Add** in the Catalogue. The log shows `cart:add` dropped: the failure has an effect no error boundary can display',
        'Kill the Catalogue as well, then restore both one at a time',
        'In the policy simulator, compare a remote that never answers under an error boundary only with the same remote under a boundary and a timeout',
      ],
      whatHappened:
        'Killing a slot points it at a broken URL, so the load fails inside the host. The load timeout and the error boundary turn that into a fallback in one slot, and nothing else shares its bundle, state or styles. The dropped event shows the second-order effect: the Catalogue worked and the Cart was gone, so the purchase silently went nowhere. A boundary catches thrown errors only. A remote that never answers needs the timeout.',
    },
    {
      id: 'strangler-fig',
      title: 'Strangle the monolith, one slice at a time',
      tryThis: [
        'Press **Next** from step 1 to step 2. Nothing on the page changes, yet the shell now owns every route',
        'At step 4, see why Promotion goes first: a leaf with little state and few callers. Read the shell line to find the one route that moved',
        'At step 7, find the area that never moved and ask whether rewriting it would help a user',
      ],
      whatHappened:
        'The migration never has a big-bang date. A shell routes every request, first to the monolith, then area by area to slots, with the old route kept as a fallback. Events replace calls between the old and new code before the core moves, so nothing is wired through shared state. The last step keeps one area contained rather than rewriting it, because a rewrite with no user benefit is a bad trade.',
    },
  ],
  pitfalls: [
    {
      title: 'Remote versions baked into the host build',
      symptom: 'Every remote release needs a host deploy, and teams queue behind the host pipeline',
      cause:
        'The host config lists remote entry URLs at build time, so the host is the bottleneck the architecture was meant to remove',
      fix: 'Read a manifest at runtime and let each remote pipeline publish its build and edit its own manifest entry',
      bad: "remotes: { recs: 'recs@/remotes/react-recs/v2/remoteEntry.js' }",
      good: "const manifest = await fetch('/remotes/manifest.json', { cache: 'no-cache' }).then((r) => r.json());",
    },
    {
      title: 'A cached entry file',
      symptom: 'A rollback is done but users keep seeing the bad version for hours',
      cause:
        'The entry file or the manifest was served with a long cache lifetime, so browsers and the CDN never ask again',
      fix: 'Serve the manifest and entry with `no-cache` or a short `max-age`. Content-hash every asset beneath them and mark those `immutable`',
    },
    {
      title: 'No timeout or fallback',
      symptom: 'One slow remote leaves a spinner forever, or a thrown error blanks the whole page',
      cause:
        'A boundary catches errors but not a promise that never settles, and a lazy import that rejects with no boundary unmounts the tree',
      fix: 'Wrap every slot in a boundary, race the load against a timeout and render a fallback with the slot size',
    },
    {
      title: 'A breaking event change with no version',
      symptom: 'After one deploy the cart total shows NaN, and the error trace points at nobody',
      cause: 'A producer renamed `sku` to `id`. Consumers silently read undefined',
      fix: 'Change contracts additively, version the event name when you cannot, and run contract tests in both the producer and consumer pipelines',
    },
    {
      title: 'Telemetry for the page, not the remote',
      symptom: 'An alert says errors are up 4 percent and nobody knows whose problem it is',
      cause: 'Errors and traces carry no remote name or version',
      fix: 'Attach the remote id and version to every log, error and span, and route alerts by owner',
    },
  ],
  meeting: {
    say: [
      'A deploy is a manifest change. The remote ships to its own versioned path and the host never rebuilds.',
      'We canary by stable user bucket and roll back by reverting one manifest line.',
      'Every slot has an error boundary, a timeout and a same-size fallback, so a failure costs one slot.',
      'Contracts, budgets and per-remote telemetry live in each team pipeline, set by a platform team.',
    ],
    ask: [
      'What is the rollback procedure, and how long until users really get the old version?',
      'Which slots may degrade gracefully, and which are important enough to block the page?',
      'Who owns each contract and budget, and what fails the build when one is broken?',
    ],
    redFlags: [
      'The host build lists remote versions, so every release needs a host deploy',
      'A remote on the critical path with no timeout or fallback',
      'Errors and traces with no remote name or version',
      'A migration plan that switches everything over on one date',
    ],
    tradeoff:
      'Independent deploys buy team speed and fast rollback, and cost a platform to maintain: manifests, contract tests, telemetry and fallbacks that a monolith gets for free.',
  },
  selfCheck: [
    {
      question: 'How do you roll back a bad recommendations release without rebuilding the host?',
      answer:
        'Revert the manifest entry, or set the canary to 0. The old build is immutable and still hosted, so the host loads its URL on the next load, and a short cache lifetime on the manifest and entry makes that quick.',
    },
    {
      question:
        "A remote's server stops answering. What should the user see, and what limits the damage?",
      answer:
        'A fallback in that slot only. The load timeout and the error boundary produce it, and no other slot shares its bundle, state or CSS. Events sent to it are dropped, so a critical flow needs its own alternative.',
    },
    {
      question: 'When would you merge two micro-frontends back together?',
      answer:
        'When they always deploy together, one team changes both, they share most of their code, or the duplicated runtime and coordination cost more than the independence is worth.',
    },
  ],
  links: [
    {
      label: 'Module Federation: runtime',
      url: 'https://module-federation.io/guide/basic/runtime',
    },
    {
      label: 'React: error boundaries',
      url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
    },
    {
      label: 'web.dev: HTTP caching',
      url: 'https://web.dev/articles/http-cache',
    },
    {
      label: 'Martin Fowler: Strangler Fig',
      url: 'https://martinfowler.com/bliki/StranglerFigApplication.html',
    },
    {
      label: 'Micro Frontends (Cam Jackson)',
      url: 'https://martinfowler.com/articles/micro-frontends.html',
    },
  ],
  glossary: [
    {
      term: 'Remote manifest',
      definition:
        'A small JSON file the host reads at runtime that maps each slot to the versioned URL of the remote that serves it.',
    },
    {
      term: 'Canary release',
      definition:
        'Serving a new version to a small, stable share of visitors first, and widening it only while the error rate stays inside budget.',
    },
    {
      term: 'Strangler fig',
      definition:
        'A migration that puts a shell in front of a legacy app and moves one area at a time behind it until the old code can be retired.',
    },
    {
      term: 'Fallback slot',
      definition:
        'The placeholder a host renders in a slot when its remote fails or times out, sized like the real content.',
    },
    {
      term: 'Platform team',
      definition:
        'A small team that owns the shared shell, contracts, tokens and pipeline templates that feature teams build on.',
    },
  ],
};
