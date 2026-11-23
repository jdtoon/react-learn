import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '11-frame-budget',
  number: 11,
  title: "The browser's frame budget",
  track: 'performance',
  oneIdea: 'You get about 16 ms per frame on one main thread. Anything longer is felt as jank.',
  minutes: 12,
  phase: 2,
  outcomes: [
    'Explain what the main thread does in a frame, and why one long task freezes input as well as animation',
    'Pick animation properties by pipeline cost, and spot layout thrashing in review',
    'Decide when work should be sliced, yielded or moved off the main thread, and ask for a measurement first',
  ],
  sections: [
    {
      heading: 'One thread, one budget',
      paragraphs: [
        'The browser runs your JavaScript, handles input and builds every frame on one **main thread**, taking turns through the event loop. At 60 Hz a frame lasts 16.7 ms, and the browser needs part of that for its own work, so yours is nearer 10 ms. At 120 Hz the whole budget is 8.3 ms.',
        'When a task overruns, the next frame is late. Animation stutters, which is **jank**, and clicks wait, because input queues behind the running task.',
      ],
    },
    {
      heading: 'The pipeline',
      paragraphs: [
        'A frame runs JavaScript, then style, layout, paint and composite. Changing a layout property such as `width` or `top` runs everything after it. A paint property such as `background-color` skips layout. `transform` and `opacity` can skip both: the compositor moves cached layers, usually on its own thread, so they keep moving while JavaScript is busy.',
        '**Layout thrashing** is the classic self-inflicted wound. Reading geometry such as `offsetHeight` after a style write forces a synchronous layout, and doing it in a loop forces one per iteration. Read everything first, then write.',
      ],
    },
    {
      heading: 'Long tasks and yielding',
      paragraphs: [
        'A task over 50 ms is a **long task**. It delays everything queued behind it, which is what Interaction to Next Paint (INP) measures. At the 75th percentile, 200 ms or less is good.',
        'Fix it by doing less, or by slicing: run a chunk, **yield** to the event loop so the browser can paint and handle input, then continue. `scheduler.yield()` does this where supported, with `setTimeout` as the fallback. Heavy computation can move to a Web Worker.',
        'React rendering is main thread work too, so a slow render spends the same budget. Module 13 shows how transitions slice it.',
      ],
    },
  ],
  labs: [
    {
      id: 'frame-budget',
      title: 'Frame budget visualiser',
      tryThis: [
        'Leave it idle for a moment. Each bar is one frame, and they sit under the dashed 16.7 ms line',
        'Press **Run 200 ms task**. The box freezes, one tall bar appears, and the missed-frames count jumps by about eleven',
        'Press **Run 200 ms in 8 ms slices**. It is the same amount of work, but the box keeps moving and no bar passes the budget by much',
        'Press **Run 50 ms task** and compare it with the 8 ms one. The longer task is the smallest that counts as a long task',
      ],
      whatHappened:
        'The browser can only paint between tasks. A 200 ms task occupies the main thread, so no frame is produced and input waits: one bar of about 200 ms and roughly eleven missed frames. Slicing the same work into 8 ms tasks leaves gaps where the browser renders and handles input. The work finishes a little later, because each yield has a cost, but the page never stalls. Same total work, very different responsiveness.',
    },
    {
      id: 'compositor-glide',
      title: 'Left versus transform',
      tryThis: [
        'Press **Block the main thread for 600 ms** with both animations running. The `left` box stalls, then jumps. The `transform` box keeps gliding',
        'Press **Run the animations** to stop them, then start them again. Both boxes follow the same motion, so the difference is in what the browser does each frame, not in what you see when the thread is free',
        'Block several times in a row. A late frame shows up as a jump to where the animation clock says the box should be, not as slower motion',
      ],
      whatHappened:
        'Changing `left` invalidates layout, so every frame needs style, layout and paint on the main thread, and a blocked thread means no frames. A `transform` animation only changes the matrix of a layer the compositor already holds, so it carries on without asking the main thread. Only a few properties get this treatment, chiefly `transform` and `opacity`. A busy main thread still delays starting an animation and responding to input, so compositor-only motion is protection, not a licence to block.',
    },
  ],
  pitfalls: [
    {
      title: 'Animating a layout property',
      symptom:
        'A slide or progress animation is smooth on its own and stutters as soon as anything else runs, especially on a phone',
      cause:
        'Properties such as `top`, `left`, `width` and `height` invalidate layout, so every frame repeats layout and paint on the main thread, in competition with your JavaScript',
      fix: 'Animate `transform` and `opacity`. Use `translate` for movement and `scale` for size, and keep the layout box fixed',
      bad: '.drawer {\n  transition: left 300ms;\n}\n.drawer.open {\n  left: 0;\n}',
      good: '.drawer {\n  transition: transform 300ms;\n  transform: translateX(-100%);\n}\n.drawer.open {\n  transform: translateX(0);\n}',
    },
    {
      title: 'Layout thrashing in a loop',
      symptom:
        'A resize or measure routine takes hundreds of milliseconds for a few hundred elements, and the profiler shows many small forced layouts',
      cause:
        'Each geometry read after a style write forces the browser to lay the page out right then, so a loop of write, read, write, read lays out once per element',
      fix: 'Do all reads first, then all writes, so layout runs once. `ResizeObserver` avoids polling for size at all',
      bad: 'for (const el of items) {\n  el.style.width = `${box.offsetWidth / 2}px`;\n}',
      good: 'const half = box.offsetWidth / 2;\nfor (const el of items) {\n  el.style.width = `${half}px`;\n}',
    },
    {
      title: 'One long synchronous task in an input handler',
      symptom:
        'A click or keystroke feels dead for a few hundred milliseconds, then everything happens at once',
      cause:
        'Sorting, parsing or processing a large array runs in a single task, so the browser cannot paint or take input until it ends',
      fix: 'Give the user an immediate response, then process in slices that yield, or move the work to a worker',
      bad: 'button.onclick = () => {\n  for (const row of rows) process(row);\n};',
      good: 'button.onclick = async () => {\n  let start = performance.now();\n  for (const row of rows) {\n    process(row);\n    if (performance.now() - start > 8) {\n      await scheduler.yield();\n      start = performance.now();\n    }\n  }\n};',
    },
    {
      title: 'Judging performance on a fast development machine',
      symptom: 'The feature feels fine locally and users on mid-range phones report lag',
      cause:
        'A developer laptop can be several times faster than a typical phone, so a 20 ms task becomes a 100 ms task for the people it matters to',
      fix: 'Profile with CPU throttling in DevTools, and watch field data such as INP from real users',
    },
  ],
  meeting: {
    say: [
      'Everything shares one main thread: our JavaScript, input handling, React rendering, layout and paint. At 60 Hz we have about 16 ms per frame, and a task over 50 ms is a long task users can feel.',
      'Animate `transform` and `opacity`, not `top`, `left` or `width`. The compositor can run those without the main thread.',
      'If one loop is the problem, slice it and yield. If it is heavy computation, move it to a worker.',
      'Layout thrashing is reads and writes interleaved. Batch the reads, then the writes.',
    ],
    ask: [
      'Is this still smooth on a mid-range phone with 4x CPU throttling, not just on a development laptop?',
      'Which task is the long one in the performance trace, and what called it?',
      'Is this animation using compositor-only properties?',
      'Can this work be sliced, deferred or moved to a worker, and what does the user see while it runs?',
    ],
    redFlags: [
      'Animating `top`, `left`, `width` or `height` on something that moves every frame',
      'A loop that reads `offsetHeight` or `getBoundingClientRect` and writes styles in the same iteration',
      'Synchronous work over 50 ms inside an input handler, such as parsing, sorting or building a large structure',
      '"It is fast on my machine" as the only evidence',
    ],
    tradeoff:
      'Yielding keeps the page responsive but finishes the work later and adds code, and a worker removes main thread cost but adds the cost of copying data and messaging.',
  },
  selfCheck: [
    {
      question:
        'A 200 ms loop runs in a click handler. The page has a CSS spinner animating `transform` and a progress bar updated by JavaScript. What does the user see during the loop?',
      answer:
        'The spinner keeps turning, because the compositor animates its layer without the main thread. The progress bar freezes and clicks queue until the loop ends, because both need the main thread.',
    },
    {
      question: 'The target is 60 Hz, so a frame is 16.7 ms. Why is your own budget nearer 10 ms?',
      answer:
        'The browser also spends part of each frame on style, layout, paint, compositing and its own bookkeeping. Your JavaScript has to leave room for that or the frame is late.',
    },
    {
      question:
        'A loop over 500 elements writes a style and then reads `offsetHeight` on each pass. What is wrong and what is the fix?',
      answer:
        'Each read after a write forces a synchronous layout, so there are 500 layouts. Do all the reads first and then all the writes, so layout runs once.',
    },
  ],
  links: [
    { label: 'Optimize long tasks', url: 'https://web.dev/articles/optimize-long-tasks' },
    { label: 'Interaction to Next Paint (INP)', url: 'https://web.dev/articles/inp' },
    {
      label: 'Stick to compositor-only properties',
      url: 'https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count',
    },
    {
      label: 'Avoid layout thrashing',
      url: 'https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing',
    },
    {
      label: 'Scheduler: yield()',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield',
    },
  ],
  glossary: [
    {
      term: 'Main thread',
      definition:
        'The single thread where the browser runs your JavaScript, handles input, and performs style, layout and paint.',
    },
    {
      term: 'Frame budget',
      definition:
        'The time available to produce one frame: 16.7 ms at 60 Hz and 8.3 ms at 120 Hz, shared between your code and the browser.',
    },
    {
      term: 'Jank',
      definition: 'Visible stutter or delayed response caused by frames arriving late.',
    },
    {
      term: 'Long task',
      definition:
        'Any task that keeps the main thread busy for more than 50 ms, long enough to delay input and painting.',
    },
    {
      term: 'Compositor',
      definition:
        'The part of the browser that assembles painted layers into the final frame, often on a separate thread, which lets `transform` and `opacity` animate while JavaScript is busy.',
    },
    {
      term: 'Layout thrashing',
      definition:
        'Alternating style writes and geometry reads so the browser is forced to run layout repeatedly instead of once.',
    },
    {
      term: 'Yielding',
      definition:
        'Handing control back to the event loop in the middle of a long job so the browser can paint and handle input before the job resumes.',
    },
  ],
};
