import type { ModuleMeta, Track } from './types';

const foundations: Track = {
  id: 'foundations',
  title: 'Foundations',
  blurb: 'How React turns state into a screen, and how to keep it in sync with the outside world.',
  order: 1,
  colorVar: '--track-foundations',
};

const architecture: Track = {
  id: 'architecture',
  title: 'Architecture',
  blurb: 'Component design, state, data, forms, routing and where HTML gets produced.',
  order: 2,
  colorVar: '--track-architecture',
};

const performance: Track = {
  id: 'performance',
  title: 'Performance',
  blurb: 'The frame budget, re-renders, concurrency and the metrics users feel.',
  order: 3,
  colorVar: '--track-performance',
};

const craft: Track = {
  id: 'craft',
  title: 'Craft',
  blurb: 'Design systems, accessibility and motion that make an interface feel right.',
  order: 4,
  colorVar: '--track-craft',
};

const production: Track = {
  id: 'production',
  title: 'Production',
  blurb: 'Testing, security and the pipeline that ships and watches the app.',
  order: 5,
  colorVar: '--track-production',
};

const microFrontends: Track = {
  id: 'micro-frontends',
  title: 'Micro frontends',
  blurb: 'When to split a frontend across teams, how to compose it and how to run it.',
  order: 6,
  colorVar: '--track-micro-frontends',
};

export const tracks: Track[] = [
  foundations,
  architecture,
  performance,
  craft,
  production,
  microFrontends,
];

export const trackById = {
  foundations,
  architecture,
  performance,
  craft,
  production,
  'micro-frontends': microFrontends,
} satisfies Record<Track['id'], Track>;

export const curriculum: ModuleMeta[] = [
  {
    slug: '01-how-react-thinks',
    number: 1,
    title: 'How React thinks',
    track: 'foundations',
    oneIdea:
      'You describe what the UI should look like for a given state. React works out the DOM changes.',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '02-rendering',
    number: 2,
    title: 'Rendering & reconciliation',
    track: 'foundations',
    oneIdea:
      'A re-render is React calling your function again. The DOM only changes where the output differs.',
    minutes: 12,
    phase: 0,
  },
  {
    slug: '03-state-snapshots',
    number: 3,
    title: 'State & the snapshot model',
    track: 'foundations',
    oneIdea:
      'State is a snapshot per render. Setting it schedules a new render; it does not change a variable.',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '04-effects-and-refs',
    number: 4,
    title: 'Effects, refs & synchronisation',
    track: 'foundations',
    oneIdea:
      'Effects are for syncing with systems outside React, not for reacting to your own state.',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '05-component-design',
    number: 5,
    title: 'Component design & composition',
    track: 'architecture',
    oneIdea:
      'Compose with children and small parts instead of configuring one component with dozens of props.',
    minutes: 12,
    phase: 3,
  },
  {
    slug: '06-state-management',
    number: 6,
    title: 'State management at scale',
    track: 'architecture',
    oneIdea:
      'Classify state first: UI, server, URL, form. Most "global state" is really a server cache.',
    minutes: 12,
    phase: 3,
  },
  {
    slug: '07-data-fetching',
    number: 7,
    title: 'Data fetching, Suspense & errors',
    track: 'architecture',
    oneIdea:
      'Where you start a fetch decides your waterfalls. Suspense and error boundaries decide what users see meanwhile.',
    minutes: 12,
    phase: 3,
  },
  {
    slug: '08-forms-and-actions',
    number: 8,
    title: 'Forms & Actions',
    track: 'architecture',
    oneIdea: 'React 19 Actions make async submits, pending states and optimistic updates built-in.',
    minutes: 12,
    phase: 3,
  },
  {
    slug: '09-routing-and-splitting',
    number: 9,
    title: 'Routing & code splitting',
    track: 'architecture',
    oneIdea: 'Routes are natural split points. Ship only the code for the screen the user is on.',
    minutes: 12,
    phase: 3,
  },
  {
    slug: '10-rendering-strategies',
    number: 10,
    title: 'Rendering strategies',
    track: 'architecture',
    oneIdea:
      'Where and when HTML is produced (client, server, build time, streamed) trades speed, cost and JavaScript shipped.',
    minutes: 12,
    phase: 3,
  },
  {
    slug: '11-frame-budget',
    number: 11,
    title: "The browser's frame budget",
    track: 'performance',
    oneIdea: 'You get about 16 ms per frame on one main thread. Anything longer is felt as jank.',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '12-memoization-and-compiler',
    number: 12,
    title: 'Re-renders, memoisation & the Compiler',
    track: 'performance',
    oneIdea: 'Most re-renders are cheap. Measure first, then memoise, or let the Compiler do it.',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '13-concurrent-react',
    number: 13,
    title: 'Concurrent React',
    track: 'performance',
    oneIdea:
      'Transitions let urgent updates (typing) interrupt expensive ones (filtering a huge list).',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '14-web-vitals',
    number: 14,
    title: 'Core Web Vitals & loading',
    track: 'performance',
    oneIdea:
      'LCP, INP and CLS are how Google and your users measure loading, responsiveness and stability.',
    minutes: 12,
    phase: 2,
  },
  {
    slug: '15-styling-and-design-systems',
    number: 15,
    title: 'Styling & design systems',
    track: 'craft',
    oneIdea: 'Tokens are the contract between design and code. The styling tool is a detail.',
    minutes: 12,
    phase: 4,
  },
  {
    slug: '16-accessibility',
    number: 16,
    title: 'Accessibility',
    track: 'craft',
    oneIdea:
      'Semantic HTML gets you most of the way. Focus management is where React apps usually fail.',
    minutes: 12,
    phase: 4,
  },
  {
    slug: '17-motion-and-perceived-performance',
    number: 17,
    title: 'Motion & perceived performance',
    track: 'craft',
    oneIdea: 'How fast it feels matters as much as how fast it is.',
    minutes: 12,
    phase: 4,
  },
  {
    slug: '18-testing-strategy',
    number: 18,
    title: 'Testing strategy',
    track: 'production',
    oneIdea: "Test what the user sees, so a refactor doesn't break tests that should still pass.",
    minutes: 12,
    phase: 4,
  },
  {
    slug: '19-frontend-security',
    number: 19,
    title: 'Frontend security',
    track: 'production',
    oneIdea:
      'React escapes text by default. The risks live in the escape hatches, tokens and dependencies.',
    minutes: 12,
    phase: 4,
  },
  {
    slug: '20-build-ship-observe',
    number: 20,
    title: 'Build, ship & observe',
    track: 'production',
    oneIdea:
      'The toolchain turns TS and JSX into fast static files. CI, source maps and monitoring keep it honest in production.',
    minutes: 12,
    phase: 4,
  },
  {
    slug: '21-mfe-why-and-when',
    number: 21,
    title: 'Why & when',
    track: 'micro-frontends',
    oneIdea:
      'Micro frontends solve an organisation-scaling problem, not a technical one, and they cost real complexity.',
    minutes: 12,
    phase: 1,
  },
  {
    slug: '22-mfe-composition',
    number: 22,
    title: 'Composition patterns',
    track: 'micro-frontends',
    oneIdea:
      'Build-time, server-side, iframe, web component or Module Federation. Each draws the team boundary differently.',
    minutes: 12,
    phase: 1,
  },
  {
    slug: '23-mfe-sharing-and-communication',
    number: 23,
    title: 'Sharing & communication',
    track: 'micro-frontends',
    oneIdea: 'Share as little as possible: one React, a typed event contract and design tokens.',
    minutes: 12,
    phase: 1,
  },
  {
    slug: '24-mfe-in-production',
    number: 24,
    title: 'MFEs in production',
    track: 'micro-frontends',
    oneIdea:
      "Independent deploys need versioned remotes, fallbacks and contracts, or one team's bad deploy breaks the page.",
    minutes: 12,
    phase: 1,
  },
];
