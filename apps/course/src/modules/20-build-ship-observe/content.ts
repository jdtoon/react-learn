import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '20-build-ship-observe',
  number: 20,
  title: 'Build, ship & observe',
  track: 'production',
  oneIdea:
    'The toolchain turns TS and JSX into fast static files. CI, source maps and monitoring keep it honest in production.',
  minutes: 12,
  phase: 4,
  outcomes: [
    'Trace a commit through install, build, assemble and deploy in a pnpm monorepo, and say what each stage guards',
    'Explain why a passing build does not mean the types, hooks and tests are right',
    'Say what you need in production to see a failure: source maps, release tags, error monitoring and feature flags',
  ],
  sections: [
    {
      heading: 'From source to static files',
      paragraphs: [
        'Browsers cannot run TSX, so a toolchain compiles it. In development Vite serves your files as native ES modules and transforms each on request, so start-up does not grow with the app. For production it bundles: Vite 8 hands the module graph to **Rolldown**, a Rust bundler with a Rollup-compatible API, and uses Oxc to strip types and compile JSX. The output is minified, hashed static files, split at each dynamic `import()`. Rspack, webpack, Turbopack and esbuild differ in speed, plugin ecosystem and Module Federation support, which is what matters when you choose or migrate.',
      ],
    },
    {
      heading: 'Transpiling is not checking',
      paragraphs: [
        'The bundler removes TypeScript types and never checks them, so a type error still builds. Type checking is a separate `tsc --noEmit` step. Linting is another: ESLint with the React Hooks rules catches broken hook usage that the type checker cannot see. Run all three and make CI fail on each, or the pipeline ships what the editor was warning about.',
      ],
    },
    {
      heading: 'Monorepo and CI',
      paragraphs: [
        'A pnpm workspace links several packages in one repository and installs once. `pnpm -r build` builds them in dependency order, and Turborepo or Nx add caching and run only what changed. CI should be boring: install with a frozen lockfile, check, test, build, then upload the artefact and deploy that artefact rather than rebuilding. Give deploy permissions to the deploy job alone.',
      ],
    },
    {
      heading: 'Observe in production',
      paragraphs: [
        'Shipping is finished only when you can see failures. Build source maps with `sourcemap: "hidden"` and upload them to your error tracker, not your CDN, so stack traces map back to source without publishing it. Tag every release with the commit SHA and report Web Vitals from real users (module 14). Put risky changes behind a feature flag and roll them out by percentage, so a bad release is a toggle, not a redeploy.',
      ],
    },
  ],
  labs: [
    {
      id: 'pipeline',
      title: "This repo's pipeline",
      tryThis: [
        'Click each stage in turn and read its command, what it produces and what guards it',
        'Pick **Type error in a component**. Every stage passes and the change ships, because Vite does not type-check and CI never runs tsc',
        'Pick **package.json changed, lockfile did not** and **A remote fails to compile**. Compare where each one stops and what stays live',
        'Pick **An exception only real users hit** and look at the last card. This repo has no way to see it',
      ],
      whatHappened:
        'The diagram is this repository, read from its files. `pnpm run build` runs every package build in dependency order and then `scripts/assemble-site.mjs`, which copies the course and the remotes into one folder for GitHub Pages. The CI workflow adds a frozen install, an artefact upload and a separate deploy job. The scenarios show what each guard really stops. The install and assemble stages fail loudly. The build stages catch syntax and import errors. Type errors, failing tests and runtime exceptions pass straight through, because nothing in the workflow checks them or watches production.',
    },
    {
      id: 'bundlers',
      title: 'The bundler landscape',
      tryThis: [
        'Select only **Existing webpack app**. Rspack and webpack lead because their configs and loaders carry over',
        'Add **Module Federation** and **Raw build speed**. Watch the ranking move',
        'Clear everything and select **Next.js app** alone. The framework mostly chooses for you',
      ],
      whatHappened:
        'Each bundler has a fit score from 0 to 3 for every criterion, and the ranking sums the criteria you select. Vite wins on speed and ecosystem for a new single-page app, Rspack wins when you must keep a webpack setup or lean on Module Federation, and Turbopack only matters inside Next.js. The scores are judgements, so the useful part is the question each criterion forces you to ask.',
    },
  ],
  pitfalls: [
    {
      title: 'Treating a green build as a type-safe build',
      symptom: 'The editor shows red, `vite build` succeeds, and the error reaches production',
      cause: 'Vite compiles TypeScript by removing the types. It never runs the type checker',
      fix: 'Add `tsc --noEmit` and ESLint to CI as separate steps that block the deploy',
      bad: '"build": "vite build"',
      good: '"build": "tsc --noEmit && vite build"',
    },
    {
      title: 'Serving source maps to everyone',
      symptom:
        'Anyone can read your original source in dev tools, or production stack traces are unreadable',
      cause:
        'Maps are either published openly with the bundle, or never generated, so errors point at minified code',
      fix: 'Generate hidden source maps, upload them to the error tracker with a release name, and keep them off the public host',
      bad: 'build: { sourcemap: true }',
      good: "build: { sourcemap: 'hidden' }",
    },
    {
      title: 'Rebuilding on deploy instead of shipping the tested artefact',
      symptom: 'Production behaves differently from what CI tested',
      cause:
        'A second build can resolve different dependencies or read different environment variables from the first',
      fix: 'Build once in CI, upload the output as an artefact and deploy exactly that artefact',
    },
    {
      title: 'Feature flags that never get removed',
      symptom: 'Code is full of branches for flags nobody remembers, and tests cover only one side',
      cause: 'A flag was added for a rollout and nobody owned its removal',
      fix: 'Give every flag an owner and a removal date, and delete the flag and the dead branch once the rollout is complete',
    },
  ],
  meeting: {
    say: [
      'Vite transpiles, it does not type-check. Type checking, linting and tests are separate CI steps, and each one has to block the deploy.',
      'We build once, upload the artefact and deploy that same artefact. The deploy job is the only one with write permissions.',
      'Source maps go to the error tracker, not the CDN, and every release is tagged with the commit SHA.',
      'Risky changes go behind a flag with a percentage rollout, so the rollback is a toggle.',
    ],
    ask: [
      'Which CI steps can fail the pipeline, and do type errors and failing tests block a deploy?',
      'How do we find out about a production exception, and how long does that take?',
      'Where do source maps go, and can we map a production stack trace to a commit?',
      'What does it cost us to switch bundlers, and have we measured our own build?',
    ],
    redFlags: [
      'A pipeline that only runs the build',
      'Deploying from a developer machine, or rebuilding at deploy time',
      'Public source maps, or no source maps and unreadable stack traces',
      'Flags with no owner and no removal date',
    ],
    tradeoff:
      'More pipeline stages and monitoring catch more problems before and after release, and cost build minutes, setup effort and a slower path to production.',
  },
  selfCheck: [
    {
      question:
        'A pull request has a type error, `vite build` passes, and CI is green. Is that a bug in the pipeline?',
      answer:
        'Yes, in the sense that the pipeline has a gap. Vite strips types without checking them, so a green build says nothing about types. Add a `tsc --noEmit` step and make it block the merge.',
    },
    {
      question:
        'Why does the deploy job use the artefact from the ci job instead of building again?',
      answer:
        'So production runs exactly what CI built and checked. A second build could resolve different dependencies or environment values. It also keeps write permissions out of the job that runs build scripts.',
    },
    {
      question: 'Where should source maps live, and why?',
      answer:
        'In your error tracker, uploaded at build time with a release name. Production stack traces then map back to source, and you do not publish your original code to every visitor.',
    },
  ],
  links: [
    { label: 'Vite: why Vite', url: 'https://vite.dev/guide/why' },
    { label: 'Rolldown', url: 'https://rolldown.rs/' },
    { label: 'pnpm workspaces', url: 'https://pnpm.io/workspaces' },
    {
      label: 'GitHub Actions: deploying to GitHub Pages',
      url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages',
    },
    {
      label: 'Chrome DevTools: source maps',
      url: 'https://developer.chrome.com/docs/devtools/javascript/source-maps',
    },
  ],
  glossary: [
    {
      term: 'Bundler',
      definition:
        'A tool that follows the import graph, transforms the code and emits optimised static files. Vite 8 uses Rolldown for this.',
    },
    {
      term: 'Rolldown',
      definition:
        'A Rust bundler with a Rollup-compatible plugin API that Vite 8 uses for production builds.',
    },
    {
      term: 'Transpile versus type check',
      definition:
        'Transpiling rewrites TypeScript into JavaScript by removing types. Type checking verifies them. Bundlers do the first and never the second.',
    },
    {
      term: 'Monorepo',
      definition:
        'One repository holding several packages, such as an app and shared libraries, installed and built together.',
    },
    {
      term: 'Frozen lockfile',
      definition:
        'Installing with the exact versions in the lockfile and failing if it is out of date, so CI builds what was reviewed.',
    },
    {
      term: 'Source map',
      definition:
        'A file that maps minified code back to the original source, so stack traces and debuggers show the code you wrote.',
    },
    {
      term: 'Feature flag',
      definition:
        'A runtime switch that turns a feature on for some users, so a release can be gradual and reversible.',
    },
  ],
};
