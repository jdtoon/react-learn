import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '09-routing-and-splitting',
  number: 9,
  title: 'Routing & code splitting',
  track: 'architecture',
  oneIdea: 'Routes are natural split points. Ship only the code for the screen the user is on.',
  minutes: 12,
  phase: 3,
  outcomes: [
    'Split an app at its routes and predict first-load size, navigation delay and which chunks are shared',
    'Hide the cost of splitting with prefetch on hover, focus or visibility, and with route loaders that start data early',
    'Decide what belongs in the URL and read it as validated input instead of copying it into state',
  ],
  sections: [
    {
      heading: 'Routes are split points',
      paragraphs: [
        'One bundle makes every visitor download every screen before seeing the first. The cheapest cut is the route, because a user is on one route at a time. `lazy(() => import("./Reports"))`, or a router `lazy` property, turns the import into a separate **chunk** that the browser requests when needed, and `<Suspense>` shows a fallback meanwhile. The bundler (Vite 8 with Rolldown) puts code that two routes share, such as a chart library, in its own chunk so it downloads once.',
      ],
    },
    {
      heading: 'The cost, and how to hide it',
      paragraphs: [
        "Splitting moves cost from first load to navigation. Hide the wait by loading earlier: prefetch a route on hover, on focus or when its link scrolls into view, or when the browser is idle. Vite adds `modulepreload` hints for a chunk's static imports so they download in parallel, not one after another. Keep the layout and navigation in the main chunk so a fallback never blanks the page. Split a screen further only for heavy, rarely used code such as an editor.",
      ],
    },
    {
      heading: 'Nested routes and loaders',
      paragraphs: [
        'Routes nest. A parent renders a layout with an `<Outlet />` where the child goes, and the layout stays mounted while the child changes. A route `loader` starts the data request in parallel with the code chunk. Fetching after the chunk lands creates a code-then-data waterfall (module 7).',
      ],
    },
    {
      heading: 'The URL is state',
      paragraphs: [
        'Whatever a user should be able to share, bookmark or recover by reloading belongs in the URL: filters, sort, page, selected tab, the open record. Use path segments for identity (`/orders/42`) and search params for view options (`?status=open&sort=date`). Read them with `useSearchParams`, treat them as untrusted input, validate them and fall back to defaults. Do not copy them into `useState`, which creates a second source of truth. Use `replace` while typing so Back is not flooded. Keep transient UI, such as an open menu, out of the URL.',
      ],
    },
  ],
  labs: [
    {
      id: 'chunk-map',
      title: 'Chunk map and prefetch on hover',
      tryThis: [
        'Pick **One bundle** and read the first-load meter, then switch to **Split by route**. The first load shrinks to the entry chunk',
        'In **Split by route**, click **Reports**. The chunk map shows reports.js and the shared charts.js downloading, and the new screen appears only when both have arrived',
        'Click **Dashboard** next. The charts chunk is already in memory, so only dashboard.js is fetched',
        'Choose **Split and prefetch on hover**, hover **Settings** for a second, then click it. The wait is gone',
      ],
      whatHappened:
        'In one bundle the first load carries every screen and each navigation is free. Splitting at the routes shrinks the first load to the entry chunk, and a click on an unloaded route now waits for its chunks. `React.lazy` suspends until the chunk arrives. The navigation runs in a transition, so React keeps the old screen up and the app shows its own pending state, where an urgent update would show the `Suspense` fallback. The charts chunk is shared, so the second chart route skips it. Prefetching on hover starts the download before the click, so the wait shrinks by however long the pointer rested on the link. Prefetch spends bandwidth on routes the user may never open, which is why it follows intent and not page load. The chunk sizes and timings are simulated.',
    },
    {
      id: 'url-state',
      title: 'Filters in the URL',
      tryThis: [
        'With state in the **URL**, pick a category, type a search and change the sort. Watch the address bar change, then press **Simulate reload**. The filters survive',
        'Switch to **useState** and repeat. **Simulate reload** now resets every filter, and the address bar never changes',
        'Back in **URL** mode, change the category twice and press the browser Back button. Each step returns to the previous filter',
        'Press **Copy link**. Anyone who opens that address sees the same list',
      ],
      whatHappened:
        'With search params, the filters are the address. A reload, a shared link and the Back button all read the same value, so none of them needs code. `useState` keeps the filters inside the component instance, and a reload, a remount or a pasted link starts from the defaults. The category and sort change the history, so Back walks through them, while typing replaces the current entry so Back is not flooded. The component validates every param against an allowed list, so an edited address falls back to a default instead of breaking the page.',
    },
  ],
  pitfalls: [
    {
      title: 'Copying URL params into state',
      symptom:
        'The filter on screen and the filter in the address bar disagree after Back, a link click or a reload',
      cause:
        '`useState(params.get("status"))` reads the URL once on mount. Later URL changes never reach the state, which is now a second source of truth',
      fix: 'Derive the value from `useSearchParams` on every render, and write changes back to the URL',
      bad: 'const [params] = useSearchParams();\nconst [status, setStatus] = useState(params.get("status") ?? "open");',
      good: 'const [params, setParams] = useSearchParams();\nconst status = params.get("status") ?? "open";',
    },
    {
      title: 'Calling lazy inside a component',
      symptom:
        'A route flashes its fallback on every parent render and loses its state, or refetches its data',
      cause:
        'Each render creates a new lazy component type, so React sees a different component at that position and remounts the subtree',
      fix: 'Declare lazy components at module scope, once',
      bad: 'function App() {\n  const Reports = lazy(() => import("./Reports"));\n  return <Reports />;\n}',
      good: 'const Reports = lazy(() => import("./Reports"));\n\nfunction App() {\n  return <Reports />;\n}',
    },
    {
      title: 'One Suspense boundary at the root',
      symptom:
        'The navigation, header and layout vanish behind a full-page spinner whenever a route chunk loads',
      cause:
        'The nearest boundary is the app root, so the whole tree is replaced by its fallback while one route suspends',
      fix: 'Keep layout and navigation outside the boundary and wrap only the route outlet, or use a transition so the old screen stays visible',
      bad: '<Suspense fallback={<Spinner />}>\n  <Layout>\n    <Outlet />\n  </Layout>\n</Suspense>',
      good: '<Layout>\n  <Suspense fallback={<RouteSkeleton />}>\n    <Outlet />\n  </Suspense>\n</Layout>',
    },
    {
      title: 'A heavy library statically imported into the shared shell',
      symptom:
        'The entry chunk is large although every route is lazy, and the bundle report shows a chart or editor library in it',
      cause:
        'A layout, a barrel file or a shared module imports the library, so it joins the chunk every visitor downloads',
      fix: 'Import it only inside the route or component that uses it, or load it with a dynamic `import()` when needed',
      bad: 'import { Chart } from "./charts";\n\nexport function Layout({ children }) {\n  return <Shell badge={<Chart.Mini />}>{children}</Shell>;\n}',
      good: 'const ChartMini = lazy(() => import("./ChartMini"));\n\nexport function Layout({ children }) {\n  return (\n    <Shell badge={<Suspense fallback={null}><ChartMini /></Suspense>}>{children}</Shell>\n  );\n}',
    },
  ],
  meeting: {
    say: [
      'We split at the routes first. Each screen then costs its own bytes, and the entry chunk holds only the shell.',
      'Splitting moves cost from first load to navigation, so we pair it with prefetch on hover or visibility to hide the wait.',
      'Filters, sort and page live in the URL, so links, reloads and the Back button work without extra code.',
      'The route loader starts the data in parallel with the code chunk, not after it.',
    ],
    ask: [
      'What is in the entry chunk, what is the biggest thing in it, and does CI show a bundle report?',
      'What does the user see while a route chunk loads: a skeleton inside the layout, or a blank page?',
      'Can I paste this URL to a colleague and see the same view?',
      'Do we fetch data after the chunk loads, or alongside it?',
    ],
    redFlags: [
      '`lazy()` called inside a component body',
      'One `Suspense` at the app root that blanks the whole page',
      'Filter or sort state in `useState` on a list that people share or revisit',
      'Every route imported statically in the router file',
      'Prefetching every chunk at start-up, which cancels the saving',
    ],
    tradeoff:
      'Splitting shrinks the first load and adds a request at navigation, which you pay for with prefetching, more chunks to reason about and a fallback state to design.',
  },
  selfCheck: [
    {
      question:
        'Two routes both import a charting library. After route-level splitting, how many times does the browser download it?',
      answer:
        'Once. The bundler moves a module used by several chunks into its own shared chunk. The second route finds it already loaded and cached.',
    },
    {
      question:
        'A search box writes `?q=` on every keystroke, and pressing Back after typing seems to do nothing. What is the fix?',
      answer:
        'Navigate with `replace` for keystrokes, or debounce, so the history holds one entry for the search. Reserve a pushed entry for a committed change, such as picking a category.',
    },
    {
      question:
        'Which belongs in the URL: the selected product category, an open tooltip, or the unsent text of a comment?',
      answer:
        'The category. It describes the view and someone else can open it. An open tooltip is transient UI. Unsent comment text is private and can be sensitive, so it belongs in state or local storage, not in a link.',
    },
  ],
  links: [
    { label: 'lazy', url: 'https://react.dev/reference/react/lazy' },
    { label: 'Suspense', url: 'https://react.dev/reference/react/Suspense' },
    {
      label: 'useSearchParams (React Router)',
      url: 'https://reactrouter.com/api/hooks/useSearchParams',
    },
    {
      label: 'Code-splitting with React.lazy and Suspense',
      url: 'https://web.dev/articles/code-splitting-suspense',
    },
    {
      label: 'rel="modulepreload"',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/modulepreload',
    },
  ],
  glossary: [
    {
      term: 'Chunk',
      definition:
        'A JavaScript file the bundler emits. Splitting at dynamic `import()` calls produces extra chunks that the browser requests only when the code runs.',
    },
    {
      term: 'Entry chunk',
      definition:
        'The code every visitor downloads first: the framework runtime, the router, the layout and anything imported statically.',
    },
    {
      term: 'Prefetch',
      definition:
        'Downloading a resource before the user asks for it, at low priority, so a later navigation finds it ready. Intent signals such as hover or focus decide what to fetch.',
    },
    {
      term: 'modulepreload',
      definition:
        'A link hint that fetches a JavaScript module and its static imports early, so they download in parallel instead of in sequence.',
    },
    {
      term: 'Outlet',
      definition:
        'The place in a parent route where the matched child route renders. The parent layout stays mounted while the outlet changes.',
    },
    {
      term: 'Search params',
      definition:
        'The key and value pairs after `?` in a URL. They hold view state, such as filters and sort, that people can share, bookmark and reload.',
    },
  ],
};
