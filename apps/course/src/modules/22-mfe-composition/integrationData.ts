export type StyleId = 'package' | 'server' | 'iframe' | 'component' | 'federation' | 'importmap';
export type CriterionId = 'deploy' | 'cost' | 'isolation' | 'shared' | 'seo' | 'blast';
export type Zone = 'build' | 'server' | 'edge' | 'browser';
export type Score = 0 | 1 | 2 | 3;

export interface Criterion {
  id: CriterionId;
  label: string;
}

export interface Rating {
  score: Score;
  why: string;
}

export interface LoadStep {
  title: string;
  description: string;
  zone: Zone;
}

export interface LoadRequest {
  id: string;
  label: string;
  start: number;
  end: number;
  step: number;
}

export interface IntegrationStyle {
  id: StyleId;
  label: string;
  ratings: Record<CriterionId, Rating>;
  steps: LoadStep[];
  requests: LoadRequest[];
  span: number;
}

export const criteria: Criterion[] = [
  { id: 'deploy', label: 'Independent deploy' },
  { id: 'cost', label: 'Low runtime cost' },
  { id: 'isolation', label: 'Isolation' },
  { id: 'shared', label: 'Shared deps' },
  { id: 'seo', label: 'SEO and SSR' },
  { id: 'blast', label: 'Small blast radius' },
];

export const scoreLabels: Record<Score, string> = {
  0: 'Poor',
  1: 'Weak',
  2: 'Good',
  3: 'Strong',
};

export const zones: { id: Zone; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'server', label: 'Server' },
  { id: 'edge', label: 'Edge' },
  { id: 'browser', label: 'Browser' },
];

export const styles: IntegrationStyle[] = [
  {
    id: 'package',
    label: 'Build-time package',
    span: 450,
    ratings: {
      deploy: { score: 0, why: 'Any change rebuilds and redeploys the host.' },
      cost: { score: 3, why: 'No extra requests. One bundle, one React, tree-shaken.' },
      isolation: { score: 0, why: 'Same bundle, same globals, same CSS.' },
      shared: { score: 3, why: 'One lockfile resolves a single copy of everything.' },
      seo: { score: 3, why: 'Ordinary server rendering or static output.' },
      blast: {
        score: 1,
        why: 'CI catches breakage first, but a bad package ships inside the host.',
      },
    },
    steps: [
      {
        title: 'Install from the registry',
        description:
          "The host's pipeline installs `@shop/checkout` as a package. The version is pinned in the lockfile.",
        zone: 'build',
      },
      {
        title: 'Bundle together',
        description:
          'The bundler merges every package into one build and shares a single copy of React.',
        zone: 'build',
      },
      {
        title: 'Serve the page',
        description:
          'The server or CDN serves HTML rendered with checkout included. Nothing is fetched separately.',
        zone: 'server',
      },
      {
        title: 'Hydrate',
        description:
          'The browser downloads one bundle and hydrates. A new checkout version waits for the next host release.',
        zone: 'browser',
      },
    ],
    requests: [
      { id: 'html', label: 'GET / (HTML with checkout)', start: 0, end: 150, step: 2 },
      {
        id: 'bundle',
        label: 'GET /assets/app.js (checkout inside)',
        start: 150,
        end: 430,
        step: 3,
      },
    ],
  },
  {
    id: 'server',
    label: 'Server or edge composition',
    span: 450,
    ratings: {
      deploy: { score: 3, why: 'Each team deploys its fragment service on its own.' },
      cost: { score: 2, why: 'One hop per fragment, hidden by caching and streaming.' },
      isolation: {
        score: 1,
        why: 'Fragments are HTML, but they share one page of CSS and globals.',
      },
      shared: { score: 1, why: 'Each interactive fragment ships its own client JavaScript.' },
      seo: { score: 3, why: 'Complete HTML arrives before any script runs.' },
      blast: { score: 2, why: 'The composer times out a slow fragment and renders a fallback.' },
    },
    steps: [
      {
        title: 'Deploy fragments',
        description:
          'Each team deploys a fragment service, such as `/fragments/recs`. Nothing is bundled into a shell.',
        zone: 'build',
      },
      {
        title: 'Receive the request',
        description:
          'The edge or an origin composer receives the request and reads a layout template with fragment placeholders.',
        zone: 'edge',
      },
      {
        title: 'Fetch fragments',
        description:
          'The composer calls every fragment in parallel with a timeout, and swaps in cached or empty HTML for a slow one.',
        zone: 'server',
      },
      {
        title: 'Stream the page',
        description:
          'Stitched HTML streams to the browser. Users and crawlers see content before any JavaScript runs.',
        zone: 'edge',
      },
      {
        title: 'Hydrate islands',
        description:
          'Interactive fragments hydrate on their own scripts. Each ships its own client code unless an import map shares it.',
        zone: 'browser',
      },
    ],
    requests: [
      { id: 'recs', label: 'composer: GET /fragments/recs', start: 20, end: 170, step: 2 },
      { id: 'reviews', label: 'composer: GET /fragments/reviews', start: 20, end: 200, step: 2 },
      { id: 'html', label: 'GET / (stitched HTML)', start: 0, end: 240, step: 3 },
      { id: 'js', label: 'GET /recs.js (island code)', start: 240, end: 400, step: 4 },
    ],
  },
  {
    id: 'iframe',
    label: 'Iframe',
    span: 700,
    ratings: {
      deploy: { score: 3, why: 'The slice is its own site and deploys on its own.' },
      cost: { score: 0, why: 'A full document, framework copy and layout pass per frame.' },
      isolation: { score: 3, why: 'Separate origin, globals, styles and crash domain.' },
      shared: { score: 0, why: 'Nothing is shared. Every frame loads its own copy.' },
      seo: { score: 0, why: 'Frame content is a separate document, not part of the page.' },
      blast: { score: 3, why: 'A crash or leak stays inside the frame.' },
    },
    steps: [
      {
        title: 'Render the shell',
        description: 'The host page renders its shell with an empty `<iframe src>` for each slot.',
        zone: 'browser',
      },
      {
        title: 'Navigate the frame',
        description:
          'Each frame starts a new navigation: its own HTML, scripts and styles, as if it were a separate site.',
        zone: 'browser',
      },
      {
        title: 'Boot in a new realm',
        description:
          'The slice starts in its own realm with its own framework copy. CSS and globals cannot cross the frame.',
        zone: 'browser',
      },
      {
        title: 'Talk across the boundary',
        description:
          'Host and slice use `postMessage` or URL state. Height, focus order and deep links need glue code.',
        zone: 'browser',
      },
    ],
    requests: [
      { id: 'shell', label: 'GET / (shell)', start: 0, end: 140, step: 0 },
      { id: 'frame', label: 'GET /locator/ (frame HTML)', start: 140, end: 300, step: 1 },
      { id: 'js', label: 'GET /locator/app.js (its own framework)', start: 300, end: 640, step: 2 },
    ],
  },
  {
    id: 'component',
    label: 'Web component',
    span: 450,
    ratings: {
      deploy: { score: 3, why: 'The host loads a script URL the team can update.' },
      cost: { score: 1, why: 'Each element may ship its own framework runtime.' },
      isolation: {
        score: 2,
        why: 'Shadow DOM seals CSS if used. JavaScript and tag names are global.',
      },
      shared: { score: 1, why: 'Only shared if you wire it up, for example with an import map.' },
      seo: {
        score: 1,
        why: 'Declarative shadow DOM allows server rendering, with patchy tooling.',
      },
      blast: { score: 2, why: 'Contained to one element, though errors can still reach the page.' },
    },
    steps: [
      {
        title: 'Place the tag',
        description:
          'The host renders `<x-recs>` in its markup. The browser treats it as an unknown element and shows nothing.',
        zone: 'browser',
      },
      {
        title: 'Load and define',
        description:
          "A script from the remote's URL loads and calls `customElements.define('x-recs', ...)`.",
        zone: 'browser',
      },
      {
        title: 'Upgrade in place',
        description:
          'The browser upgrades existing elements. `connectedCallback` mounts the slice, inside a shadow root if it chose one.',
        zone: 'browser',
      },
      {
        title: 'Talk through the tag',
        description:
          'Attributes and properties go in, DOM events come out. Any framework can stand behind the tag.',
        zone: 'browser',
      },
    ],
    requests: [
      { id: 'shell', label: 'GET / (shell)', start: 0, end: 140, step: 0 },
      { id: 'element', label: 'GET /recs/element.js', start: 140, end: 420, step: 1 },
    ],
  },
  {
    id: 'federation',
    label: 'Module Federation',
    span: 600,
    ratings: {
      deploy: { score: 3, why: 'A remote ships its own build. The host resolves it at runtime.' },
      cost: { score: 2, why: 'Manifest, entry and chunks form a waterfall unless you preload.' },
      isolation: { score: 1, why: 'Same realm, same DOM, same CSS. Isolation is by convention.' },
      shared: { score: 3, why: 'Singleton negotiation shares React and more across remotes.' },
      seo: {
        score: 2,
        why: 'SSR works with a server-side federation setup and matching versions.',
      },
      blast: {
        score: 1,
        why: 'An error boundary contains render errors, not leaks or slow scripts.',
      },
    },
    steps: [
      {
        title: 'Build the remote',
        description:
          'Each remote builds with `exposes` and `shared` and emits `remoteEntry.js` and `mf-manifest.json`. It deploys on its own.',
        zone: 'build',
      },
      {
        title: 'Register the remote',
        description:
          'The host loads, and its `@module-federation/runtime` registers the remote by URL. Nothing is fetched yet.',
        zone: 'browser',
      },
      {
        title: 'Read the manifest',
        description:
          'On first use the runtime fetches `mf-manifest.json`: the exposed modules, shared dependencies and asset paths.',
        zone: 'browser',
      },
      {
        title: 'Share and load',
        description:
          "It matches shared singletons such as React against the host's copy, so React is not fetched again, then loads the entry and the exposed chunk.",
        zone: 'browser',
      },
      {
        title: 'Mount',
        description:
          'The host mounts the exposed component in its own React tree, behind `Suspense` and an error boundary.',
        zone: 'browser',
      },
    ],
    requests: [
      { id: 'shell', label: 'GET / (shell and host JS)', start: 0, end: 260, step: 1 },
      { id: 'manifest', label: 'GET /recs/mf-manifest.json', start: 260, end: 340, step: 2 },
      { id: 'entry', label: 'GET /recs/remoteEntry.js', start: 340, end: 430, step: 3 },
      { id: 'chunk', label: 'GET /recs/Recs.js (exposed chunk)', start: 430, end: 560, step: 3 },
    ],
  },
  {
    id: 'importmap',
    label: 'Import maps',
    span: 450,
    ratings: {
      deploy: { score: 3, why: 'Changing a URL in the map releases a new version.' },
      cost: { score: 2, why: 'Many small ES modules, well cached. Preload hints cut the chain.' },
      isolation: { score: 1, why: 'Same realm. single-spa adds lifecycles, not isolation.' },
      shared: {
        score: 2,
        why: 'One URL per bare name, so React loads once. Version policy is yours.',
      },
      seo: { score: 1, why: 'Client-rendered by default. Server rendering needs extra work.' },
      blast: { score: 1, why: 'A bad map entry or module can break every importer.' },
    },
    steps: [
      {
        title: 'Publish modules',
        description:
          'Each team publishes ES modules and a small metadata file. Shared libraries such as `react` are built once as their own URLs.',
        zone: 'build',
      },
      {
        title: 'Ship the map',
        description:
          'The shell page carries an `importmap` script that maps names like `react` and `@shop/recs` to URLs.',
        zone: 'browser',
      },
      {
        title: 'Import by name',
        description:
          'The shell imports `@shop/recs`. The browser resolves it through the map, fetches it, then fetches `react` once for everyone.',
        zone: 'browser',
      },
      {
        title: 'Orchestrate',
        description:
          'With single-spa, an orchestrator mounts and unmounts each application by route. `modulepreload` hints flatten the chain.',
        zone: 'browser',
      },
    ],
    requests: [
      { id: 'shell', label: 'GET / (shell with import map)', start: 0, end: 200, step: 1 },
      { id: 'recs', label: 'GET /recs.js', start: 200, end: 320, step: 2 },
      { id: 'react', label: 'GET /react.js (once, shared)', start: 320, end: 420, step: 2 },
    ],
  },
];

export function fitScore(style: IntegrationStyle, picked: CriterionId[]): number {
  return picked.reduce((total, id) => total + style.ratings[id].score, 0);
}
