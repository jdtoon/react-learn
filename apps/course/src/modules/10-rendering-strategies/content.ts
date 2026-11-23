import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '10-rendering-strategies',
  number: 10,
  title: 'Rendering strategies',
  track: 'architecture',
  oneIdea:
    'Where and when HTML is produced (client, server, build time, streamed) trades speed, cost and JavaScript shipped.',
  minutes: 12,
  phase: 3,
  outcomes: [
    'Place CSR, SSR, SSG, streaming SSR and Server Components on a timeline of first content, interactivity and JavaScript shipped',
    'Explain hydration, why SSR can look ready before it works, and what a hydration mismatch is',
    'Review a server and client boundary: what may cross it, what ships to the browser, and where `use client` belongs',
  ],
  sections: [
    {
      heading: 'Where and when HTML is made',
      paragraphs: [
        'Every strategy answers two questions: where is the HTML produced, and when? **CSR** ships an empty shell and builds the page in the browser, so users wait for the script and then for data. **SSR** renders HTML on the server per request. Content appears sooner and each request costs server time. **SSG** renders at build time and serves files from a CDN, which is fastest and cheapest but fits only content that is the same for everyone until the next build. **ISR** regenerates static pages in the background.',
      ],
    },
    {
      heading: 'Hydration',
      paragraphs: [
        'Server HTML is visible but inert until the browser downloads the same component code and **hydrates**: it attaches handlers and rebuilds state. The gap between first paint and interactivity is the price of SSR and SSG, and it grows with the JavaScript shipped. The first client render must match the server HTML, or React reports a **hydration mismatch**. The usual causes are `Date.now()`, a locale format or `window` read during render.',
        '**Streaming SSR** sends the shell first and fills each `<Suspense>` boundary as its data resolves. **Selective hydration** hydrates boundaries as their code arrives, and first the one the user clicks. Islands hydrate only the interactive parts.',
      ],
    },
    {
      heading: 'Server Components',
      paragraphs: [
        'A **Server Component** runs only on the server, at request time or build time, and can read a database directly. Its code and libraries never ship, because the client receives its rendered output. A file marked `use client` starts a client boundary: everything it imports ships and hydrates. Props that cross the boundary must be serialisable. Functions cannot, except Server Functions marked `use server`. Server content passed as `children` stays on the server. Server Components decide what code ships. SSR decides where the first HTML is made, and frameworks combine the two.',
      ],
    },
    {
      heading: 'Choosing',
      paragraphs: [
        'Choose per route, not per app. A dashboard behind a login needs no indexing, so CSR is fine. Marketing and docs suit SSG. Personal or SEO-critical pages suit streaming SSR. Next.js, React Router framework mode, TanStack Start and Astro provide these. This site is static, so everything in these labs is simulated.',
      ],
    },
  ],
  labs: [
    {
      id: 'strategy-timeline',
      title: 'Strategy timeline',
      tryThis: [
        'Choose **CSR** and press **Play**. The screen stays blank until the script has run, then shows a skeleton, and content waits for the data request',
        'Switch to **SSR**. Content appears at the second step, but the page is not interactive until hydration finishes. Note the gap between the two',
        'Pick **Streaming SSR**. The shell paints with a skeleton, then the content streams in without waiting for scripts',
        'Pick **RSC** and compare the JavaScript shipped with the other four',
      ],
      whatHappened:
        'CSR must download and run the app before it can ask for data, so first content is late and equals interactivity. SSR and SSG put content on screen after the first response, and then the script and hydration must catch up, so the page looks ready before it works. SSG skips the server render because a CDN already holds the HTML. Streaming sends the shell at once and each boundary when its data is ready, so the slowest query no longer holds back the page. Server Components render their own output on the server, so the client downloads and hydrates only the interactive code, which shrinks both the JavaScript and the hydration gap. All timings are illustrative.',
    },
    {
      id: 'boundary-builder',
      title: 'Server or client?',
      tryThis: [
        'Press **Everything on the server**. The components that need state or event handlers are flagged',
        'Press **Everything on the client**. The database component breaks and the bundle is at its largest',
        'Put `<Tabs>` on the client and untick **Pass server content as children**. Its imports fall into the client bundle, and the reviews break. Tick it again and they return to the server',
        'Put `<AddToCart>` on the client. Its function prop fails to serialise until you tick **Make onAdd a Server Function**',
      ],
      whatHappened:
        'A component that uses state, effects or event handlers needs the client, and one that reads the database or a secret needs the server. A client boundary pulls in everything its file imports, so a client component that renders another by import takes that component to the browser. When the server creates the content and passes it in as `children`, it stays a Server Component. A function prop cannot be serialised across the boundary, so it must be defined on the client or marked as a Server Function. The meter totals the client runtime plus every component and library that ends up on the client side.',
    },
  ],
  pitfalls: [
    {
      title: 'Hydration mismatch from non-deterministic render',
      symptom:
        'The console reports a hydration mismatch, or text flickers to a new value just after load',
      cause:
        'The component reads the clock, a random number, `window` or the user locale during render, so the server and the browser produce different output',
      fix: 'Render something stable first and apply the browser-only value in an effect, or use `useSyncExternalStore` with a server snapshot',
      bad: 'function Greeting() {\n  return <p>{new Date().toLocaleTimeString()}</p>;\n}',
      good: 'function Greeting() {\n  const [time, setTime] = useState<string | null>(null);\n  useEffect(() => setTime(new Date().toLocaleTimeString()), []);\n  return <p>{time ?? ""}</p>;\n}',
    },
    {
      title: 'use client at the top of a layout',
      symptom:
        'The client bundle is large although most of the page is static text, and every library is shipped to every visitor',
      cause:
        'The directive marks a boundary. Everything the file imports joins the client bundle and hydrates',
      fix: 'Move the directive down to the smallest interactive component and pass server-rendered content in as `children`',
      bad: '"use client";\n\nexport function Layout({ children }) {\n  const [open, setOpen] = useState(false);\n  return <Shell open={open}>{children}</Shell>;\n}',
      good: '"use client";\n\nexport function MenuButton() {\n  const [open, setOpen] = useState(false);\n  return <button onClick={() => setOpen(!open)}>Menu</button>;\n}',
    },
    {
      title: 'Passing a function from a Server Component to a Client Component',
      symptom:
        'The build or the render fails with an error that functions cannot be passed to Client Components',
      cause:
        'Props cross the boundary as serialised data, and a plain function is not serialisable',
      fix: 'Define the handler inside the client component, or pass a Server Function marked with `use server`',
      bad: '<AddToCart onAdd={() => db.cart.add(id)} />',
      good: 'async function addToCart() {\n  "use server";\n  await db.cart.add(id);\n}\n\n<AddToCart onAdd={addToCart} />',
    },
    {
      title: 'Server rendering content that never changes per request',
      symptom:
        'Time to first byte is high and the hosting bill grows with traffic for pages that rarely change',
      cause: 'The server renders the same HTML for every visitor on every request, instead of once',
      fix: 'Prerender at build time (SSG) or regenerate on a schedule (ISR) and serve it from a CDN. Keep SSR for personal or live content',
    },
  ],
  meeting: {
    say: [
      'SSR and SSG improve first paint, not interactivity. The page is visible but inert until hydration finishes.',
      'We choose per route: static where content is shared, server-rendered where it is personal or live, client-only behind a login.',
      'Server Components decide what code ships. Their libraries and data access stay on the server. SSR is a separate choice about where the first HTML is made.',
      '`use client` is a boundary, not a label on one component. Everything it imports goes to the browser.',
    ],
    ask: [
      'Who needs this page indexed, and how fast must content appear? That decides between CSR, SSR and SSG.',
      'How much JavaScript does this route ship, and how much of it hydrates content that never changes?',
      'Where are the `use client` boundaries, and can they move down to the leaves?',
      'What does per-request rendering cost us compared with serving static files?',
    ],
    redFlags: [
      'SSR adopted for performance with no measurement of time to first byte or hydration time',
      '`use client` at the top of every file, or on a layout',
      'A hydration warning in the console that nobody owns',
      '`window` or `Date.now()` read during render in an app that renders on the server',
      'A large CSR bundle behind a public marketing page',
    ],
    tradeoff:
      'Rendering earlier on the server improves first paint and indexing and costs server time, hosting complexity and a hydration step, while static files are cheapest but fit only content that is the same for everyone.',
  },
  selfCheck: [
    {
      question:
        'A server-rendered page looks complete, but its buttons do nothing for two seconds. Where is the time going?',
      answer:
        'Hydration. The HTML is visible at once, but handlers attach only after the script downloads, parses and hydrates. Ship less JavaScript, stream and hydrate selectively, or move static parts to Server Components.',
    },
    {
      question:
        'A Server Component passes `onClick={() => save()}` to a Client Component and the render fails. Why, and what are two fixes?',
      answer:
        'A function is not serialisable across the boundary. Either define the handler inside the Client Component, or pass a Server Function marked `use server`, which the client calls as a reference.',
    },
    {
      question: 'Is a Server Component the same thing as server-side rendering?',
      answer:
        'No. A Server Component is a component whose code runs only on the server and never ships. SSR is producing the first HTML on the server. An app can use SSR without Server Components, and a framework usually combines both.',
    },
  ],
  links: [
    { label: 'Server Components', url: 'https://react.dev/reference/rsc/server-components' },
    { label: "The 'use client' directive", url: 'https://react.dev/reference/rsc/use-client' },
    { label: 'Server Functions', url: 'https://react.dev/reference/rsc/server-functions' },
    { label: 'hydrateRoot', url: 'https://react.dev/reference/react-dom/client/hydrateRoot' },
    { label: 'Rendering on the web', url: 'https://web.dev/articles/rendering-on-the-web' },
  ],
  glossary: [
    {
      term: 'Hydration',
      definition:
        'React attaching event handlers and state to HTML that the server already produced, by running the same components in the browser. The page is inert until it finishes.',
    },
    {
      term: 'Hydration mismatch',
      definition:
        'A difference between the HTML the server sent and what the first client render produces, usually caused by time, randomness or browser-only values read during render.',
    },
    {
      term: 'Streaming SSR',
      definition:
        'Sending server-rendered HTML in pieces. The shell goes first and each Suspense boundary is filled when its data is ready.',
    },
    {
      term: 'Selective hydration',
      definition:
        'Hydrating Suspense boundaries independently as their code arrives, giving priority to the one the user interacts with.',
    },
    {
      term: 'Server Component',
      definition:
        'A component that runs only on the server, can read data directly and never ships its code to the browser.',
    },
    {
      term: 'Client boundary',
      definition:
        'The point where a `use client` file begins. That file and everything it imports ship to the browser and hydrate.',
    },
    {
      term: 'ISR',
      definition:
        'Incremental static regeneration. Static pages are rebuilt in the background on a schedule or on demand, so content refreshes without a full deploy.',
    },
    {
      term: 'Island',
      definition:
        'An interactive component hydrated on its own in an otherwise static page, so the rest of the page ships no JavaScript.',
    },
  ],
};
