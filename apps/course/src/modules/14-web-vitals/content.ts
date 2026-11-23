import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '14-web-vitals',
  number: 14,
  title: 'Core Web Vitals & loading',
  track: 'performance',
  oneIdea:
    'LCP, INP and CLS are how Google and your users measure loading, responsiveness and stability.',
  minutes: 12,
  phase: 2,
  outcomes: [
    'State the three Core Web Vitals, what each measures, its threshold and the 75th percentile rule',
    'Match a slow LCP, a poor INP or a high CLS to its usual cause and its fix',
    'Explain why lab and field data disagree, and which one decides',
  ],
  sections: [
    {
      heading: 'Three numbers, judged in the field',
      paragraphs: [
        '**LCP** (Largest Contentful Paint) is when the biggest visible element renders: good is 2.5 s or less. **INP** (Interaction to Next Paint) is the delay from a click, tap or key press to the next frame, close to the worst across the visit: good is 200 ms or less. **CLS** (Cumulative Layout Shift) scores unexpected movement: good is 0.1 or less. A page passes when the 75th percentile of real visits is good on all three.',
      ],
    },
    {
      heading: 'What moves each one',
      paragraphs: [
        'LCP follows the critical rendering path: server response, render-blocking CSS and JavaScript, then discovering and fetching the hero image. A client-rendered React app cannot start until its bundle has downloaded and run, so bundle size, code splitting and tree-shaking matter, and server rendering or streaming brings first content forward. Keep the LCP image in the initial HTML, give it `fetchPriority="high"` and never lazy-load it.',
        'INP is main-thread time in three parts: input delay (the thread was busy), processing (your handlers and the renders they trigger) and presentation delay (layout and paint). Break long tasks up, yield between slices, and mark non-urgent updates as transitions.',
        'CLS is content that arrives without reserved space: images without dimensions, late banners, ads and font swaps. Reserve space with `width` and `height` or `aspect-ratio`, and animate with `transform`. A shift within 500 ms of a user input does not count.',
      ],
    },
    {
      heading: 'Lab data against field data',
      paragraphs: [
        'Lighthouse and DevTools give lab data: one device and network, reproducible, ideal for debugging and CI, but with no real interactions. It reports Total Blocking Time as a stand-in for INP. Field data, from the Chrome UX Report or your own real-user monitoring built on the `web-vitals` library, shows what users experienced, and it is what the pass mark uses. Third-party scripts are the usual reason the two disagree.',
      ],
    },
  ],
  labs: [
    {
      id: 'layout-shift',
      title: 'Layout shift playground',
      tryThis: [
        'Press **Load the page** with the defaults. The hero image arrives late, pushes the article down, and the score lands in the red',
        'Tick **Reserve the image space** and load again. The image still arrives late, but nothing moves',
        'Untick **Float the banner over the content** and load again. The banner now takes space in the flow and pushes everything down',
        'After the page loads, press **Expand details**. The content jumps, yet the score holds because you caused the movement',
      ],
      whatHappened:
        'Each unexpected movement scores impact fraction (how much of the viewport the moved content covers, before and after) times distance fraction (how far it moved, against the larger viewport dimension). A late image or banner in the flow pushes everything below it, so large areas move a long way. Reserving the box with an aspect ratio, or floating the banner so it takes no space, leaves the rest in place. A shift within 500 ms of your own input is expected, so it is excused. The page readout above counts the same shifts against your real viewport.',
    },
    {
      id: 'long-task-vs-yield',
      title: 'Long task or yielded task',
      tryThis: [
        'Press **Run as one long task** and read **Latency to next paint**. The page cannot paint until the task ends',
        'Press **Run in slices and yield**. The work takes about as long overall, but the first paint follows within a frame or two',
        'Start a long task, then press **Tap counter** straight away. Its handler waits for the task to end. Do the same during the sliced run and it answers at once',
        'Choose 600 ms of work and compare the **INP** readout after each style of run',
      ],
      whatHappened:
        'INP runs from the input to the next frame the browser paints. In one long task the thread is held until the work is done, so the paint, and any queued tap, waits for all of it. Yielding between slices (`scheduler.yield()`, or a zero timeout) lets the browser handle input and paint between slices, so the first response is quick although the total work is the same. Each slice stays under 50 ms, the long-task threshold. The page readout is the real INP this browser has recorded, which keeps the worst interaction.',
    },
  ],
  pitfalls: [
    {
      title: 'Images without dimensions',
      symptom: 'Text jumps down when images load, and CLS is high on pages that look fine in the lab',
      cause:
        'The browser cannot size the box until the image has downloaded, so everything below it moves when the file arrives',
      fix: 'Set `width` and `height` (or `aspect-ratio`) so the space is reserved from the first layout. The same applies to embeds and ad slots',
      bad: '<img src={hero} alt="Launch day" />',
      good: '<img src={hero} alt="Launch day" width={1200} height={675} />',
    },
    {
      title: 'Lazy-loading the LCP image',
      symptom: 'LCP is poor even though the image is small and the server is fast',
      cause:
        '`loading="lazy"` defers the fetch until layout, and an image inserted by client-side JavaScript is found late, so it queues behind render-blocking work',
      fix: 'Put the hero in the initial HTML, load it eagerly and raise its priority. Lazy-load only what is below the fold',
      bad: '<img src={hero} alt="" loading="lazy" />',
      good: '<img src={hero} alt="" fetchPriority="high" />',
    },
    {
      title: 'Heavy work inside the event handler',
      symptom: 'Typing or clicking freezes the page for a few hundred milliseconds, and INP is red',
      cause:
        'The handler filters or sorts a large list and renders it in one synchronous pass, so the next frame waits for all of it',
      fix: 'Update the input at once and let the expensive result lag behind as a deferred value or transition, or yield between slices of work',
      bad: 'function onChange(event) {\n  setQuery(event.target.value);\n  setRows(filterAll(allRows, event.target.value));\n}',
      good: 'const [query, setQuery] = useState("");\nconst deferredQuery = useDeferredValue(query);\nconst rows = useMemo(\n  () => filterAll(allRows, deferredQuery),\n  [deferredQuery],\n);',
    },
    {
      title: 'Trusting a green Lighthouse score',
      symptom: 'CI shows 95, yet field data at the 75th percentile fails INP or LCP',
      cause:
        'A lab run is one fast device with no real interactions, no extension noise and a tidy network. Real users bring slow phones and third-party scripts',
      fix: 'Report the vitals from real sessions and set targets on the 75th percentile, split by device',
      good: 'import { onCLS, onINP, onLCP } from "web-vitals";\n\nfor (const observe of [onCLS, onINP, onLCP]) {\n  observe((metric) => navigator.sendBeacon("/vitals", JSON.stringify(metric)));\n}',
    },
  ],
  meeting: {
    say: [
      'We pass when the 75th percentile of real visits is good on LCP, INP and CLS. Lab scores help us debug, but field data decides.',
      'INP is main-thread time: input delay, processing and presentation. We fix it by doing less per interaction or yielding between pieces of work.',
      'LCP is usually a discovery and priority problem, not a bandwidth one. Find the LCP element and make sure it is in the first HTML and fetched early.',
      'CLS is space we did not reserve. Give media dimensions, give late content a slot, and animate with transform.',
    ],
    ask: [
      'What is the field p75 for our key pages, split by device, and is that the number our target uses?',
      'Which element is the LCP here, and is it in the initial HTML rather than inserted by JavaScript?',
      'Which interactions have the worst INP, and how does that split into input delay, processing and presentation?',
      'What do third-party scripts cost in main-thread time, and who owns removing them?',
    ],
    redFlags: [
      'Targets set from a Lighthouse score with no real-user data behind them',
      '`loading="lazy"` on the hero image, or a hero that only appears after JavaScript runs',
      'Images, embeds or ad slots with no reserved size',
      'Event handlers that sort or filter a large list in one synchronous pass',
      'A tag manager anyone can add scripts to without review',
    ],
    tradeoff:
      'Meeting the thresholds means shipping less JavaScript and reserving space up front, which costs some design and feature freedom and buys pages that load and respond well for the slowest quarter of real users.',
  },
  selfCheck: [
    {
      question:
        'Lighthouse scores 95 on your laptop, but field INP at the 75th percentile is 380 ms. Which do you trust, and why do they differ?',
      answer:
        'The field figure. A default lab run is one fast device with no real interactions and reports Total Blocking Time as a proxy for INP, whereas field data is real devices and real taps at the 75th percentile, which is what the pass mark uses.',
    },
    {
      question:
        'The hero image is small and the server is quick, yet LCP is 4 s. Name two likely causes and the check for each.',
      answer:
        'The image is discovered late or fetched late. It may be lazy-loaded or inserted by client-side JavaScript, so look for it in the initial HTML. It may also compete with render-blocking CSS and scripts, so give it `fetchPriority="high"` and trim what blocks rendering.',
    },
    {
      question:
        'A banner appears 800 ms after load and pushes the content down. Separately, an accordion pushes content down when the user opens it. Which one hurts CLS, and what is the fix?',
      answer:
        'The banner. Shifts within 500 ms of a user input are excused, so the accordion does not count. Give the banner a reserved slot, or float it so it takes no space in the flow.',
    },
  ],
  links: [
    { label: 'Web Vitals', url: 'https://web.dev/articles/vitals' },
    { label: 'Interaction to Next Paint', url: 'https://web.dev/articles/inp' },
    { label: 'Optimize Largest Contentful Paint', url: 'https://web.dev/articles/optimize-lcp' },
    { label: 'Optimize Cumulative Layout Shift', url: 'https://web.dev/articles/optimize-cls' },
    {
      label: 'PerformanceObserver',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver',
    },
  ],
  glossary: [
    {
      term: 'LCP',
      definition:
        'Largest Contentful Paint: the time until the largest image or text block in the viewport is rendered. Good is 2.5 s or less, poor is over 4 s.',
    },
    {
      term: 'INP',
      definition:
        'Interaction to Next Paint: the latency from an input to the next frame, taken close to the worst across the visit. Good is 200 ms or less, poor is over 500 ms.',
    },
    {
      term: 'CLS',
      definition:
        'Cumulative Layout Shift: the sum of layout shift scores, each impact fraction times distance fraction, over the worst burst of shifts. Good is 0.1 or less, poor is over 0.25.',
    },
    {
      term: 'Long task',
      definition:
        'Any task that holds the main thread for more than 50 ms. Input and painting wait behind it.',
    },
    {
      term: 'Critical rendering path',
      definition:
        'The sequence from request to first paint: HTML, then the CSS and blocking scripts it references, then layout and paint. Anything that blocks it delays LCP.',
    },
    {
      term: 'Field data (RUM)',
      definition:
        'Measurements from real users on real devices, such as the Chrome UX Report or your own real-user monitoring. Lab data comes from a controlled, repeatable run such as Lighthouse.',
    },
    {
      term: 'Tree-shaking',
      definition:
        'Dropping exports that nothing imports during the build, which shrinks the bundle. It relies on static ES module imports and side-effect-free code.',
    },
  ],
};
