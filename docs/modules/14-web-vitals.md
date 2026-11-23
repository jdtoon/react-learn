> Generated from the app's content. Edit `apps/course/src/modules/14-web-vitals/content.ts`.

# 14. Core Web Vitals & loading

**Performance** · Module 14 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/14-web-vitals)

**The one idea:** LCP, INP and CLS are how Google and your users measure loading, responsiveness and stability.

## After this you can

- State the three Core Web Vitals, what each measures, its threshold and the 75th percentile rule
- Match a slow LCP, a poor INP or a high CLS to its usual cause and its fix
- Explain why lab and field data disagree, and which one decides

## The model

### Three numbers, judged in the field

**LCP** (Largest Contentful Paint) is when the biggest visible element renders: good is 2.5 s or less. **INP** (Interaction to Next Paint) is the delay from a click, tap or key press to the next frame, close to the worst across the visit: good is 200 ms or less. **CLS** (Cumulative Layout Shift) scores unexpected movement: good is 0.1 or less. A page passes when the 75th percentile of real visits is good on all three.

### What moves each one

LCP follows the critical rendering path: server response, render-blocking CSS and JavaScript, then discovering and fetching the hero image. A client-rendered React app cannot start until its bundle has downloaded and run, so bundle size, code splitting and tree-shaking matter, and server rendering or streaming brings first content forward. Keep the LCP image in the initial HTML, give it `fetchPriority="high"` and never lazy-load it.

INP is main-thread time in three parts: input delay (the thread was busy), processing (your handlers and the renders they trigger) and presentation delay (layout and paint). Break long tasks up, yield between slices, and mark non-urgent updates as transitions.

CLS is content that arrives without reserved space: images without dimensions, late banners, ads and font swaps. Reserve space with `width` and `height` or `aspect-ratio`, and animate with `transform`. A shift within 500 ms of a user input does not count.

### Lab data against field data

Lighthouse and DevTools give lab data: one device and network, reproducible, ideal for debugging and CI, but with no real interactions. It reports Total Blocking Time as a stand-in for INP. Field data, from the Chrome UX Report or your own real-user monitoring built on the `web-vitals` library, shows what users experienced, and it is what the pass mark uses. Third-party scripts are the usual reason the two disagree.

## Labs

The labs run in the app. Each one below links to the live version.

### Layout shift playground

Try this:

- Press **Load the page** with the defaults. The hero image arrives late, pushes the article down, and the score lands in the red
- Tick **Reserve the image space** and load again. The image still arrives late, but nothing moves
- Untick **Float the banner over the content** and load again. The banner now takes space in the flow and pushes everything down
- After the page loads, press **Expand details**. The content jumps, yet the score holds because you caused the movement

[Open the live lab](https://jdtoon.github.io/react-learn/modules/14-web-vitals#lab-layout-shift)

### Long task or yielded task

Try this:

- Press **Run as one long task** and read **Latency to next paint**. The page cannot paint until the task ends
- Press **Run in slices and yield**. The work takes about as long overall, but the first paint follows within a frame or two
- Start a long task, then press **Tap counter** straight away. Its handler waits for the task to end. Do the same during the sliced run and it answers at once
- Choose 600 ms of work and compare the **INP** readout after each style of run

[Open the live lab](https://jdtoon.github.io/react-learn/modules/14-web-vitals#lab-long-task-vs-yield)

## Pitfalls

### Images without dimensions

- **Symptom:** Text jumps down when images load, and CLS is high on pages that look fine in the lab
- **Cause:** The browser cannot size the box until the image has downloaded, so everything below it moves when the file arrives
- **Fix:** Set `width` and `height` (or `aspect-ratio`) so the space is reserved from the first layout. The same applies to embeds and ad slots

Bad:

```tsx
<img src={hero} alt="Launch day" />
```

Good:

```tsx
<img src={hero} alt="Launch day" width={1200} height={675} />
```

### Lazy-loading the LCP image

- **Symptom:** LCP is poor even though the image is small and the server is fast
- **Cause:** `loading="lazy"` defers the fetch until layout, and an image inserted by client-side JavaScript is found late, so it queues behind render-blocking work
- **Fix:** Put the hero in the initial HTML, load it eagerly and raise its priority. Lazy-load only what is below the fold

Bad:

```tsx
<img src={hero} alt="" loading="lazy" />
```

Good:

```tsx
<img src={hero} alt="" fetchPriority="high" />
```

### Heavy work inside the event handler

- **Symptom:** Typing or clicking freezes the page for a few hundred milliseconds, and INP is red
- **Cause:** The handler filters or sorts a large list and renders it in one synchronous pass, so the next frame waits for all of it
- **Fix:** Update the input at once and let the expensive result lag behind as a deferred value or transition, or yield between slices of work

Bad:

```tsx
function onChange(event) {
  setQuery(event.target.value);
  setRows(filterAll(allRows, event.target.value));
}
```

Good:

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);
const rows = useMemo(
  () => filterAll(allRows, deferredQuery),
  [deferredQuery],
);
```

### Trusting a green Lighthouse score

- **Symptom:** CI shows 95, yet field data at the 75th percentile fails INP or LCP
- **Cause:** A lab run is one fast device with no real interactions, no extension noise and a tidy network. Real users bring slow phones and third-party scripts
- **Fix:** Report the vitals from real sessions and set targets on the 75th percentile, split by device

Good:

```tsx
import { onCLS, onINP, onLCP } from "web-vitals";

for (const observe of [onCLS, onINP, onLCP]) {
  observe((metric) => navigator.sendBeacon("/vitals", JSON.stringify(metric)));
}
```

## In the meeting

**Say**

- We pass when the 75th percentile of real visits is good on LCP, INP and CLS. Lab scores help us debug, but field data decides.
- INP is main-thread time: input delay, processing and presentation. We fix it by doing less per interaction or yielding between pieces of work.
- LCP is usually a discovery and priority problem, not a bandwidth one. Find the LCP element and make sure it is in the first HTML and fetched early.
- CLS is space we did not reserve. Give media dimensions, give late content a slot, and animate with transform.

**Ask**

- What is the field p75 for our key pages, split by device, and is that the number our target uses?
- Which element is the LCP here, and is it in the initial HTML rather than inserted by JavaScript?
- Which interactions have the worst INP, and how does that split into input delay, processing and presentation?
- What do third-party scripts cost in main-thread time, and who owns removing them?

**Red flags**

- Targets set from a Lighthouse score with no real-user data behind them
- `loading="lazy"` on the hero image, or a hero that only appears after JavaScript runs
- Images, embeds or ad slots with no reserved size
- Event handlers that sort or filter a large list in one synchronous pass
- A tag manager anyone can add scripts to without review

**Trade-off:** Meeting the thresholds means shipping less JavaScript and reserving space up front, which costs some design and feature freedom and buys pages that load and respond well for the slowest quarter of real users.

## Self-check

1. Lighthouse scores 95 on your laptop, but field INP at the 75th percentile is 380 ms. Which do you trust, and why do they differ?

   <details>
   <summary>Answer</summary>

   The field figure. A default lab run is one fast device with no real interactions and reports Total Blocking Time as a proxy for INP, whereas field data is real devices and real taps at the 75th percentile, which is what the pass mark uses.

   </details>

2. The hero image is small and the server is quick, yet LCP is 4 s. Name two likely causes and the check for each.

   <details>
   <summary>Answer</summary>

   The image is discovered late or fetched late. It may be lazy-loaded or inserted by client-side JavaScript, so look for it in the initial HTML. It may also compete with render-blocking CSS and scripts, so give it `fetchPriority="high"` and trim what blocks rendering.

   </details>

3. A banner appears 800 ms after load and pushes the content down. Separately, an accordion pushes content down when the user opens it. Which one hurts CLS, and what is the fix?

   <details>
   <summary>Answer</summary>

   The banner. Shifts within 500 ms of a user input are excused, so the accordion does not count. Give the banner a reserved slot, or float it so it takes no space in the flow.

   </details>

## Go deeper

- [Web Vitals](https://web.dev/articles/vitals)
- [Interaction to Next Paint](https://web.dev/articles/inp)
- [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
