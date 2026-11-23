> Generated from the app's content. Edit `apps/course/src/modules/06-state-management/content.ts`.

# 06. State management at scale

**Architecture** · Module 06 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/06-state-management)

**The one idea:** Classify state first: UI, server, URL, form. Most "global state" is really a server cache.

## After this you can

- Classify any piece of state as UI, form, URL, server or shared client before choosing a tool
- Explain why a context re-renders every consumer and when a selector store is the better fit
- Challenge a global store in review by asking which parts are really a server cache

## The model

### Classify before you choose

State is not one thing. **UI state**, such as whether a menu is open, belongs to one component. **Form state** is a draft until it is submitted. **URL state**, such as filters, tab and page, should survive a reload and a shared link. **Server state** is a cached copy of data someone else owns, and it goes stale. **Shared client state**, such as a theme or a multi-step wizard, is what remains, and it is usually small. Most of what teams keep in a global store is server state, which needs a cache with invalidation, such as TanStack Query, SWR or framework loaders, not a reducer.

### Context is injection, not a store

Context delivers a value to a subtree without prop drilling. That suits stable values: a theme, a router, a client instance. It has no selectors. When the provider value changes, every component that reads the context renders, even one that reads a field that did not change. Split contexts by update rate, or keep fast-changing state elsewhere, to limit the blast radius.

### Selector stores

A selector store such as Zustand is built on `useSyncExternalStore`. A component subscribes to a slice, `useStore((s) => s.cart)`, and renders only when that slice changes by `Object.is`. Selecting a fresh object on every call defeats that, so select primitives or use a shallow comparison. Redux Toolkit adds conventions and devtools, Jotai builds state from atoms, and signals track reads automatically. Each trades an extra concept for finer-grained updates.

### Keep it low, lift when needed

Start with `useState` in the lowest component that needs the value. Lift it to the nearest common parent when two components need it, and reach for a store only when that tree is deep or the state outlives the screen. Derive values while rendering instead of storing them. Moving URL parameters into the router and server data into a cache often deletes the store.

## Labs

The labs run in the app. Each one below links to the live version.

### Context or selector store?

Try this:

- In **One context**, press **Add to cart**. All four components render, though only `<CartBadge>` shows the change, and the wasted count jumps by 3
- Switch to **Selector store** and press **Add to cart** again. Only `<CartBadge>` renders and the wasted count does not move
- Press each of the other buttons in both modes and compare which boxes flash

[Open the live lab](https://jdtoon.github.io/react-learn/modules/06-state-management#lab-blast-radius)

### Where does it live?

Try this:

- Move the first three items out of the global store and watch the meter fall
- Pick a wrong home on purpose and read the hint
- Place all eight. How many genuinely needed a client store?

[Open the live lab](https://jdtoon.github.io/react-learn/modules/06-state-management#lab-where-does-it-live)

## Pitfalls

### One big context for everything

- **Symptom:** Typing in a search box makes a distant header render, and the profiler shows most of the app rendering on each keystroke
- **Cause:** The provider value is one object, so a change to any field renders every consumer, whichever field it reads
- **Fix:** Split contexts by update rate, keep fast-changing values out of context, or move them into a selector store

Bad:

```tsx
const value = { user, theme, search, setSearch };

<AppContext value={value}>{children}</AppContext>
```

Good:

```tsx
const search = useStore((s) => s.search);
const theme = use(ThemeContext);
```

### Server data copied into a client store

- **Symptom:** Lists show stale rows, loading flags drift out of sync, and the same fetch logic appears in several places
- **Cause:** The store holds data the server owns, so it has no staleness, no deduplication and no invalidation after a mutation
- **Fix:** Keep server state in a query cache, and keep only client-owned state in the store

Bad:

```tsx
useEffect(() => {
  fetchProducts().then(setProducts);
}, []);
```

Good:

```tsx
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
});
```

### Selecting a new object from a store

- **Symptom:** A component renders on every store update, or React reports a maximum update depth error
- **Cause:** The selector returns a new object each call, so the snapshot never compares equal to the previous one
- **Fix:** Select primitives separately, or wrap the selector in `useShallow`

Bad:

```tsx
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }));
```

Good:

```tsx
const a = useStore((s) => s.a);
const b = useStore((s) => s.b);
```

### Filters and tabs kept in useState

- **Symptom:** A reload loses the filters, a shared link opens the default view, and the back button leaves the page
- **Cause:** State that describes what the user is looking at lives in memory, not in the address bar
- **Fix:** Make the URL search params the source of truth and derive the value from them

Bad:

```tsx
const [status, setStatus] = useState("open");
```

Good:

```tsx
const [params, setParams] = useSearchParams();
const status = params.get("status") ?? "open";
```

## In the meeting

**Say**

- Before we pick a library, what kind of state is this: UI, form, URL, server or shared client?
- Context injects stable values. It has no selectors, so a changing value renders every consumer.
- Most of our global state is a server cache. A cache with invalidation replaces the store and its loading flags.
- A selector store renders only components whose slice changed, at the cost of another dependency and mental model.

**Ask**

- Which parts of this store come from the server, and who else can change them?
- How often does this context value change, and how many components read it?
- Should this filter live in the URL so people can share and reload it?
- What do we lose if this state resets on navigation?

**Red flags**

- One `AppContext` holding user, theme, cart and notifications
- A global store whose actions are `setProducts`, `setLoading` and `setError`
- Selectors that return new objects or arrays
- State copied from props or the server into a store and synchronised by hand
- Choosing a state library before naming the kind of state it will hold

**Trade-off:** Selector stores and server caches cut re-renders and boilerplate, but each adds a dependency, a mental model and another place state can live.

## Self-check

1. A context value is `{ theme, setTheme, user }` and `user` changes often. Which components render when it does, and what is the cheapest fix?

   <details>
   <summary>Answer</summary>

   Every component that reads the context renders, including those that read only `theme`, because context has no selectors. Split the context by update rate, or move the fast-changing field into a selector store.

   </details>

2. A Redux store holds `products`, `setProducts`, `loading` and `error`. What is it really, and what replaces it?

   <details>
   <summary>Answer</summary>

   A hand-built server cache without staleness, deduplication or invalidation. A server-state cache such as TanStack Query, or framework loaders, replaces it, leaving only client-owned state in the store.

   </details>

3. Why does `useStore((s) => ({ a: s.a, b: s.b }))` cause trouble in Zustand 5, and how do you fix it?

   <details>
   <summary>Answer</summary>

   The selector returns a new object on every call, so React sees a changed snapshot each time and re-renders, or loops. Select each primitive separately, or wrap the selector in `useShallow`.

   </details>

## Go deeper

- [Choosing the state structure](https://react.dev/learn/choosing-the-state-structure)
- [Scaling up with reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zustand documentation](https://zustand.docs.pmnd.rs/)
