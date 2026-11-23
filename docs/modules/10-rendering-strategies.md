> Generated from the app's content. Edit `apps/course/src/modules/10-rendering-strategies/content.ts`.

# 10. Rendering strategies

**Architecture** · Module 10 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/10-rendering-strategies)

**The one idea:** Where and when HTML is produced (client, server, build time, streamed) trades speed, cost and JavaScript shipped.

## After this you can

- Place CSR, SSR, SSG, streaming SSR and Server Components on a timeline of first content, interactivity and JavaScript shipped
- Explain hydration, why SSR can look ready before it works, and what a hydration mismatch is
- Review a server and client boundary: what may cross it, what ships to the browser, and where `use client` belongs

## The model

### Where and when HTML is made

Every strategy answers two questions: where is the HTML produced, and when? **CSR** ships an empty shell and builds the page in the browser, so users wait for the script and then for data. **SSR** renders HTML on the server per request. Content appears sooner and each request costs server time. **SSG** renders at build time and serves files from a CDN, which is fastest and cheapest but fits only content that is the same for everyone until the next build. **ISR** regenerates static pages in the background.

### Hydration

Server HTML is visible but inert until the browser downloads the same component code and **hydrates**: it attaches handlers and rebuilds state. The gap between first paint and interactivity is the price of SSR and SSG, and it grows with the JavaScript shipped. The first client render must match the server HTML, or React reports a **hydration mismatch**. The usual causes are `Date.now()`, a locale format or `window` read during render.

**Streaming SSR** sends the shell first and fills each `<Suspense>` boundary as its data resolves. **Selective hydration** hydrates boundaries as their code arrives, and first the one the user clicks. Islands hydrate only the interactive parts.

### Server Components

A **Server Component** runs only on the server, at request time or build time, and can read a database directly. Its code and libraries never ship, because the client receives its rendered output. A file marked `use client` starts a client boundary: everything it imports ships and hydrates. Props that cross the boundary must be serialisable. Functions cannot, except Server Functions marked `use server`. Server content passed as `children` stays on the server. Server Components decide what code ships. SSR decides where the first HTML is made, and frameworks combine the two.

### Choosing

Choose per route, not per app. A dashboard behind a login needs no indexing, so CSR is fine. Marketing and docs suit SSG. Personal or SEO-critical pages suit streaming SSR. Next.js, React Router framework mode, TanStack Start and Astro provide these. This site is static, so everything in these labs is simulated.

## Labs

The labs run in the app. Each one below links to the live version.

### Strategy timeline

Try this:

- Choose **CSR** and press **Play**. The screen stays blank until the script has run, then shows a skeleton, and content waits for the data request
- Switch to **SSR**. Content appears at the second step, but the page is not interactive until hydration finishes. Note the gap between the two
- Pick **Streaming SSR**. The shell paints with a skeleton, then the content streams in without waiting for scripts
- Pick **RSC** and compare the JavaScript shipped with the other four

[Open the live lab](https://jdtoon.github.io/react-learn/modules/10-rendering-strategies#lab-strategy-timeline)

### Server or client?

Try this:

- Press **Everything on the server**. The components that need state or event handlers are flagged
- Press **Everything on the client**. The database component breaks and the bundle is at its largest
- Put `<Tabs>` on the client and untick **Pass server content as children**. Its imports fall into the client bundle, and the reviews break. Tick it again and they return to the server
- Put `<AddToCart>` on the client. Its function prop fails to serialise until you tick **Make onAdd a Server Function**

[Open the live lab](https://jdtoon.github.io/react-learn/modules/10-rendering-strategies#lab-boundary-builder)

## Pitfalls

### Hydration mismatch from non-deterministic render

- **Symptom:** The console reports a hydration mismatch, or text flickers to a new value just after load
- **Cause:** The component reads the clock, a random number, `window` or the user locale during render, so the server and the browser produce different output
- **Fix:** Render something stable first and apply the browser-only value in an effect, or use `useSyncExternalStore` with a server snapshot

Bad:

```tsx
function Greeting() {
  return <p>{new Date().toLocaleTimeString()}</p>;
}
```

Good:

```tsx
function Greeting() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => setTime(new Date().toLocaleTimeString()), []);
  return <p>{time ?? ""}</p>;
}
```

### use client at the top of a layout

- **Symptom:** The client bundle is large although most of the page is static text, and every library is shipped to every visitor
- **Cause:** The directive marks a boundary. Everything the file imports joins the client bundle and hydrates
- **Fix:** Move the directive down to the smallest interactive component and pass server-rendered content in as `children`

Bad:

```tsx
"use client";

export function Layout({ children }) {
  const [open, setOpen] = useState(false);
  return <Shell open={open}>{children}</Shell>;
}
```

Good:

```tsx
"use client";

export function MenuButton() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(!open)}>Menu</button>;
}
```

### Passing a function from a Server Component to a Client Component

- **Symptom:** The build or the render fails with an error that functions cannot be passed to Client Components
- **Cause:** Props cross the boundary as serialised data, and a plain function is not serialisable
- **Fix:** Define the handler inside the client component, or pass a Server Function marked with `use server`

Bad:

```tsx
<AddToCart onAdd={() => db.cart.add(id)} />
```

Good:

```tsx
async function addToCart() {
  "use server";
  await db.cart.add(id);
}

<AddToCart onAdd={addToCart} />
```

### Server rendering content that never changes per request

- **Symptom:** Time to first byte is high and the hosting bill grows with traffic for pages that rarely change
- **Cause:** The server renders the same HTML for every visitor on every request, instead of once
- **Fix:** Prerender at build time (SSG) or regenerate on a schedule (ISR) and serve it from a CDN. Keep SSR for personal or live content

## In the meeting

**Say**

- SSR and SSG improve first paint, not interactivity. The page is visible but inert until hydration finishes.
- We choose per route: static where content is shared, server-rendered where it is personal or live, client-only behind a login.
- Server Components decide what code ships. Their libraries and data access stay on the server. SSR is a separate choice about where the first HTML is made.
- `use client` is a boundary, not a label on one component. Everything it imports goes to the browser.

**Ask**

- Who needs this page indexed, and how fast must content appear? That decides between CSR, SSR and SSG.
- How much JavaScript does this route ship, and how much of it hydrates content that never changes?
- Where are the `use client` boundaries, and can they move down to the leaves?
- What does per-request rendering cost us compared with serving static files?

**Red flags**

- SSR adopted for performance with no measurement of time to first byte or hydration time
- `use client` at the top of every file, or on a layout
- A hydration warning in the console that nobody owns
- `window` or `Date.now()` read during render in an app that renders on the server
- A large CSR bundle behind a public marketing page

**Trade-off:** Rendering earlier on the server improves first paint and indexing and costs server time, hosting complexity and a hydration step, while static files are cheapest but fit only content that is the same for everyone.

## Self-check

1. A server-rendered page looks complete, but its buttons do nothing for two seconds. Where is the time going?

   <details>
   <summary>Answer</summary>

   Hydration. The HTML is visible at once, but handlers attach only after the script downloads, parses and hydrates. Ship less JavaScript, stream and hydrate selectively, or move static parts to Server Components.

   </details>

2. A Server Component passes `onClick={() => save()}` to a Client Component and the render fails. Why, and what are two fixes?

   <details>
   <summary>Answer</summary>

   A function is not serialisable across the boundary. Either define the handler inside the Client Component, or pass a Server Function marked `use server`, which the client calls as a reference.

   </details>

3. Is a Server Component the same thing as server-side rendering?

   <details>
   <summary>Answer</summary>

   No. A Server Component is a component whose code runs only on the server and never ships. SSR is producing the first HTML on the server. An app can use SSR without Server Components, and a framework usually combines both.

   </details>

## Go deeper

- [Server Components](https://react.dev/reference/rsc/server-components)
- [The 'use client' directive](https://react.dev/reference/rsc/use-client)
- [Server Functions](https://react.dev/reference/rsc/server-functions)
- [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Rendering on the web](https://web.dev/articles/rendering-on-the-web)
