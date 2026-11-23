> Generated from the app's content. Edit `apps/course/src/modules/09-routing-and-splitting/content.ts`.

# 09. Routing & code splitting

**Architecture** · Module 09 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/09-routing-and-splitting)

**The one idea:** Routes are natural split points. Ship only the code for the screen the user is on.

## After this you can

- Split an app at its routes and predict first-load size, navigation delay and which chunks are shared
- Hide the cost of splitting with prefetch on hover, focus or visibility, and with route loaders that start data early
- Decide what belongs in the URL and read it as validated input instead of copying it into state

## The model

### Routes are split points

One bundle makes every visitor download every screen before seeing the first. The cheapest cut is the route, because a user is on one route at a time. `lazy(() => import("./Reports"))`, or a router `lazy` property, turns the import into a separate **chunk** that the browser requests when needed, and `<Suspense>` shows a fallback meanwhile. The bundler (Vite 8 with Rolldown) puts code that two routes share, such as a chart library, in its own chunk so it downloads once.

### The cost, and how to hide it

Splitting moves cost from first load to navigation. Hide the wait by loading earlier: prefetch a route on hover, on focus or when its link scrolls into view, or when the browser is idle. Vite adds `modulepreload` hints for a chunk's static imports so they download in parallel, not one after another. Keep the layout and navigation in the main chunk so a fallback never blanks the page. Split a screen further only for heavy, rarely used code such as an editor.

### Nested routes and loaders

Routes nest. A parent renders a layout with an `<Outlet />` where the child goes, and the layout stays mounted while the child changes. A route `loader` starts the data request in parallel with the code chunk. Fetching after the chunk lands creates a code-then-data waterfall (module 7).

### The URL is state

Whatever a user should be able to share, bookmark or recover by reloading belongs in the URL: filters, sort, page, selected tab, the open record. Use path segments for identity (`/orders/42`) and search params for view options (`?status=open&sort=date`). Read them with `useSearchParams`, treat them as untrusted input, validate them and fall back to defaults. Do not copy them into `useState`, which creates a second source of truth. Use `replace` while typing so Back is not flooded. Keep transient UI, such as an open menu, out of the URL.

## Labs

The labs run in the app. Each one below links to the live version.

### Chunk map and prefetch on hover

Try this:

- Pick **One bundle** and read the first-load meter, then switch to **Split by route**. The first load shrinks to the entry chunk
- In **Split by route**, click **Reports**. The chunk map shows reports.js and the shared charts.js downloading, and the new screen appears only when both have arrived
- Click **Dashboard** next. The charts chunk is already in memory, so only dashboard.js is fetched
- Choose **Split and prefetch on hover**, hover **Settings** for a second, then click it. The wait is gone

[Open the live lab](https://jdtoon.github.io/react-learn/modules/09-routing-and-splitting#lab-chunk-map)

### Filters in the URL

Try this:

- With state in the **URL**, pick a category, type a search and change the sort. Watch the address bar change, then press **Simulate reload**. The filters survive
- Switch to **useState** and repeat. **Simulate reload** now resets every filter, and the address bar never changes
- Back in **URL** mode, change the category twice and press the browser Back button. Each step returns to the previous filter
- Press **Copy link**. Anyone who opens that address sees the same list

[Open the live lab](https://jdtoon.github.io/react-learn/modules/09-routing-and-splitting#lab-url-state)

## Pitfalls

### Copying URL params into state

- **Symptom:** The filter on screen and the filter in the address bar disagree after Back, a link click or a reload
- **Cause:** `useState(params.get("status"))` reads the URL once on mount. Later URL changes never reach the state, which is now a second source of truth
- **Fix:** Derive the value from `useSearchParams` on every render, and write changes back to the URL

Bad:

```tsx
const [params] = useSearchParams();
const [status, setStatus] = useState(params.get("status") ?? "open");
```

Good:

```tsx
const [params, setParams] = useSearchParams();
const status = params.get("status") ?? "open";
```

### Calling lazy inside a component

- **Symptom:** A route flashes its fallback on every parent render and loses its state, or refetches its data
- **Cause:** Each render creates a new lazy component type, so React sees a different component at that position and remounts the subtree
- **Fix:** Declare lazy components at module scope, once

Bad:

```tsx
function App() {
  const Reports = lazy(() => import("./Reports"));
  return <Reports />;
}
```

Good:

```tsx
const Reports = lazy(() => import("./Reports"));

function App() {
  return <Reports />;
}
```

### One Suspense boundary at the root

- **Symptom:** The navigation, header and layout vanish behind a full-page spinner whenever a route chunk loads
- **Cause:** The nearest boundary is the app root, so the whole tree is replaced by its fallback while one route suspends
- **Fix:** Keep layout and navigation outside the boundary and wrap only the route outlet, or use a transition so the old screen stays visible

Bad:

```tsx
<Suspense fallback={<Spinner />}>
  <Layout>
    <Outlet />
  </Layout>
</Suspense>
```

Good:

```tsx
<Layout>
  <Suspense fallback={<RouteSkeleton />}>
    <Outlet />
  </Suspense>
</Layout>
```

### A heavy library statically imported into the shared shell

- **Symptom:** The entry chunk is large although every route is lazy, and the bundle report shows a chart or editor library in it
- **Cause:** A layout, a barrel file or a shared module imports the library, so it joins the chunk every visitor downloads
- **Fix:** Import it only inside the route or component that uses it, or load it with a dynamic `import()` when needed

Bad:

```tsx
import { Chart } from "./charts";

export function Layout({ children }) {
  return <Shell badge={<Chart.Mini />}>{children}</Shell>;
}
```

Good:

```tsx
const ChartMini = lazy(() => import("./ChartMini"));

export function Layout({ children }) {
  return (
    <Shell badge={<Suspense fallback={null}><ChartMini /></Suspense>}>{children}</Shell>
  );
}
```

## In the meeting

**Say**

- We split at the routes first. Each screen then costs its own bytes, and the entry chunk holds only the shell.
- Splitting moves cost from first load to navigation, so we pair it with prefetch on hover or visibility to hide the wait.
- Filters, sort and page live in the URL, so links, reloads and the Back button work without extra code.
- The route loader starts the data in parallel with the code chunk, not after it.

**Ask**

- What is in the entry chunk, what is the biggest thing in it, and does CI show a bundle report?
- What does the user see while a route chunk loads: a skeleton inside the layout, or a blank page?
- Can I paste this URL to a colleague and see the same view?
- Do we fetch data after the chunk loads, or alongside it?

**Red flags**

- `lazy()` called inside a component body
- One `Suspense` at the app root that blanks the whole page
- Filter or sort state in `useState` on a list that people share or revisit
- Every route imported statically in the router file
- Prefetching every chunk at start-up, which cancels the saving

**Trade-off:** Splitting shrinks the first load and adds a request at navigation, which you pay for with prefetching, more chunks to reason about and a fallback state to design.

## Self-check

1. Two routes both import a charting library. After route-level splitting, how many times does the browser download it?

   <details>
   <summary>Answer</summary>

   Once. The bundler moves a module used by several chunks into its own shared chunk. The second route finds it already loaded and cached.

   </details>

2. A search box writes `?q=` on every keystroke, and pressing Back after typing seems to do nothing. What is the fix?

   <details>
   <summary>Answer</summary>

   Navigate with `replace` for keystrokes, or debounce, so the history holds one entry for the search. Reserve a pushed entry for a committed change, such as picking a category.

   </details>

3. Which belongs in the URL: the selected product category, an open tooltip, or the unsent text of a comment?

   <details>
   <summary>Answer</summary>

   The category. It describes the view and someone else can open it. An open tooltip is transient UI. Unsent comment text is private and can be sensitive, so it belongs in state or local storage, not in a link.

   </details>

## Go deeper

- [lazy](https://react.dev/reference/react/lazy)
- [Suspense](https://react.dev/reference/react/Suspense)
- [useSearchParams (React Router)](https://reactrouter.com/api/hooks/useSearchParams)
- [Code-splitting with React.lazy and Suspense](https://web.dev/articles/code-splitting-suspense)
- [rel="modulepreload"](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/modulepreload)
