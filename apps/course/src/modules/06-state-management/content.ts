import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '06-state-management',
  number: 6,
  title: 'State management at scale',
  track: 'architecture',
  oneIdea:
    'Classify state first: UI, server, URL, form. Most "global state" is really a server cache.',
  minutes: 12,
  phase: 3,
  outcomes: [
    'Classify any piece of state as UI, form, URL, server or shared client before choosing a tool',
    'Explain why a context re-renders every consumer and when a selector store is the better fit',
    'Challenge a global store in review by asking which parts are really a server cache',
  ],
  sections: [
    {
      heading: 'Classify before you choose',
      paragraphs: [
        'State is not one thing. **UI state**, such as whether a menu is open, belongs to one component. **Form state** is a draft until it is submitted. **URL state**, such as filters, tab and page, should survive a reload and a shared link. **Server state** is a cached copy of data someone else owns, and it goes stale. **Shared client state**, such as a theme or a multi-step wizard, is what remains, and it is usually small. Most of what teams keep in a global store is server state, which needs a cache with invalidation, such as TanStack Query, SWR or framework loaders, not a reducer.',
      ],
    },
    {
      heading: 'Context is injection, not a store',
      paragraphs: [
        'Context delivers a value to a subtree without prop drilling. That suits stable values: a theme, a router, a client instance. It has no selectors. When the provider value changes, every component that reads the context renders, even one that reads a field that did not change. Split contexts by update rate, or keep fast-changing state elsewhere, to limit the blast radius.',
      ],
    },
    {
      heading: 'Selector stores',
      paragraphs: [
        'A selector store such as Zustand is built on `useSyncExternalStore`. A component subscribes to a slice, `useStore((s) => s.cart)`, and renders only when that slice changes by `Object.is`. Selecting a fresh object on every call defeats that, so select primitives or use a shallow comparison. Redux Toolkit adds conventions and devtools, Jotai builds state from atoms, and signals track reads automatically. Each trades an extra concept for finer-grained updates.',
      ],
    },
    {
      heading: 'Keep it low, lift when needed',
      paragraphs: [
        'Start with `useState` in the lowest component that needs the value. Lift it to the nearest common parent when two components need it, and reach for a store only when that tree is deep or the state outlives the screen. Derive values while rendering instead of storing them. Moving URL parameters into the router and server data into a cache often deletes the store.',
      ],
    },
  ],
  labs: [
    {
      id: 'blast-radius',
      title: 'Context or selector store?',
      tryThis: [
        'In **One context**, press **Add to cart**. All four components render, though only `<CartBadge>` shows the change, and the wasted count jumps by 3',
        'Switch to **Selector store** and press **Add to cart** again. Only `<CartBadge>` renders and the wasted count does not move',
        'Press each of the other buttons in both modes and compare which boxes flash',
      ],
      whatHappened:
        'Context has no selectors. When the provider value changes, every component that reads the context renders, including those that read a field that did not change. The children passed to the provider do not render, because they are elements React already holds, so the cost is limited to consumers. A selector store subscribes each component to one slice and compares it with `Object.is`, so a change to `cart` renders only components that select `cart`. The price is an extra library and a second place for state to live.',
    },
    {
      id: 'where-does-it-live',
      title: 'Where does it live?',
      tryThis: [
        'Move the first three items out of the global store and watch the meter fall',
        'Pick a wrong home on purpose and read the hint',
        'Place all eight. How many genuinely needed a client store?',
      ],
      whatHappened:
        'Seven of the eight items have a better home than a global store. Server data needs a cache that understands staleness, deduplication and invalidation. Anything people should share or reload belongs in the URL. Drafts belong to a form. An open drawer, or a selection two siblings share, belongs to a component or its nearest common parent. Only state that is client-owned and needed widely, here the theme, justifies a store or context.',
    },
  ],
  pitfalls: [
    {
      title: 'One big context for everything',
      symptom:
        'Typing in a search box makes a distant header render, and the profiler shows most of the app rendering on each keystroke',
      cause:
        'The provider value is one object, so a change to any field renders every consumer, whichever field it reads',
      fix: 'Split contexts by update rate, keep fast-changing values out of context, or move them into a selector store',
      bad: 'const value = { user, theme, search, setSearch };\n\n<AppContext value={value}>{children}</AppContext>',
      good: 'const search = useStore((s) => s.search);\nconst theme = use(ThemeContext);',
    },
    {
      title: 'Server data copied into a client store',
      symptom:
        'Lists show stale rows, loading flags drift out of sync, and the same fetch logic appears in several places',
      cause:
        'The store holds data the server owns, so it has no staleness, no deduplication and no invalidation after a mutation',
      fix: 'Keep server state in a query cache, and keep only client-owned state in the store',
      bad: 'useEffect(() => {\n  fetchProducts().then(setProducts);\n}, []);',
      good: 'const { data } = useQuery({\n  queryKey: ["products"],\n  queryFn: fetchProducts,\n});',
    },
    {
      title: 'Selecting a new object from a store',
      symptom:
        'A component renders on every store update, or React reports a maximum update depth error',
      cause:
        'The selector returns a new object each call, so the snapshot never compares equal to the previous one',
      fix: 'Select primitives separately, or wrap the selector in `useShallow`',
      bad: 'const { a, b } = useStore((s) => ({ a: s.a, b: s.b }));',
      good: 'const a = useStore((s) => s.a);\nconst b = useStore((s) => s.b);',
    },
    {
      title: 'Filters and tabs kept in useState',
      symptom:
        'A reload loses the filters, a shared link opens the default view, and the back button leaves the page',
      cause:
        'State that describes what the user is looking at lives in memory, not in the address bar',
      fix: 'Make the URL search params the source of truth and derive the value from them',
      bad: 'const [status, setStatus] = useState("open");',
      good: 'const [params, setParams] = useSearchParams();\nconst status = params.get("status") ?? "open";',
    },
  ],
  meeting: {
    say: [
      'Before we pick a library, what kind of state is this: UI, form, URL, server or shared client?',
      'Context injects stable values. It has no selectors, so a changing value renders every consumer.',
      'Most of our global state is a server cache. A cache with invalidation replaces the store and its loading flags.',
      'A selector store renders only components whose slice changed, at the cost of another dependency and mental model.',
    ],
    ask: [
      'Which parts of this store come from the server, and who else can change them?',
      'How often does this context value change, and how many components read it?',
      'Should this filter live in the URL so people can share and reload it?',
      'What do we lose if this state resets on navigation?',
    ],
    redFlags: [
      'One `AppContext` holding user, theme, cart and notifications',
      'A global store whose actions are `setProducts`, `setLoading` and `setError`',
      'Selectors that return new objects or arrays',
      'State copied from props or the server into a store and synchronised by hand',
      'Choosing a state library before naming the kind of state it will hold',
    ],
    tradeoff:
      'Selector stores and server caches cut re-renders and boilerplate, but each adds a dependency, a mental model and another place state can live.',
  },
  selfCheck: [
    {
      question:
        'A context value is `{ theme, setTheme, user }` and `user` changes often. Which components render when it does, and what is the cheapest fix?',
      answer:
        'Every component that reads the context renders, including those that read only `theme`, because context has no selectors. Split the context by update rate, or move the fast-changing field into a selector store.',
    },
    {
      question:
        'A Redux store holds `products`, `setProducts`, `loading` and `error`. What is it really, and what replaces it?',
      answer:
        'A hand-built server cache without staleness, deduplication or invalidation. A server-state cache such as TanStack Query, or framework loaders, replaces it, leaving only client-owned state in the store.',
    },
    {
      question:
        'Why does `useStore((s) => ({ a: s.a, b: s.b }))` cause trouble in Zustand 5, and how do you fix it?',
      answer:
        'The selector returns a new object on every call, so React sees a changed snapshot each time and re-renders, or loops. Select each primitive separately, or wrap the selector in `useShallow`.',
    },
  ],
  links: [
    {
      label: 'Choosing the state structure',
      url: 'https://react.dev/learn/choosing-the-state-structure',
    },
    {
      label: 'Scaling up with reducer and context',
      url: 'https://react.dev/learn/scaling-up-with-reducer-and-context',
    },
    {
      label: 'useSyncExternalStore',
      url: 'https://react.dev/reference/react/useSyncExternalStore',
    },
    {
      label: 'TanStack Query overview',
      url: 'https://tanstack.com/query/latest/docs/framework/react/overview',
    },
    { label: 'Zustand documentation', url: 'https://zustand.docs.pmnd.rs/' },
  ],
  glossary: [
    {
      term: 'Server state',
      definition:
        'A cached copy of data owned by a server. Others can change it, so it needs refetching, deduplication and invalidation.',
    },
    {
      term: 'Shared client state',
      definition:
        'State that exists only in the browser and is needed by distant components, such as a theme or a wizard. It is usually the smallest category.',
    },
    {
      term: 'URL state',
      definition:
        'State kept in the path or search params, such as filters or the open tab, so it survives reloads and can be shared as a link.',
    },
    {
      term: 'Selector',
      definition:
        'A function that picks a slice from a store. The component renders only when the picked value changes by `Object.is`.',
    },
    {
      term: 'Blast radius',
      definition:
        'How many components render when a given piece of state changes. Context widens it, selectors narrow it.',
    },
    {
      term: 'useSyncExternalStore',
      definition:
        'The React hook that subscribes a component to a store outside React and keeps every read consistent within a render.',
    },
  ],
};
