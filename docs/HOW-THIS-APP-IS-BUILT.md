# How this app is built

The course is a single-page React app that is also its own worked example. This guide walks through how it is organised, from the workspace down to the deploy pipeline, and ends with the micro-frontend lab planned for the micro frontends track. For the commands, read [Getting started](GETTING-STARTED.md).

## The stack

- pnpm workspace, TypeScript in strict mode
- Vite 8 and React 19, with React Router in data router mode
- Tailwind CSS 4, with design tokens as CSS custom properties
- Zustand for the two small client stores, progress and theme
- Radix primitives for dialogs and cmdk for search
- Vitest and Testing Library for unit and component tests, Playwright for end-to-end tests
- ESLint and Prettier

## Workspace layout

```text
.
├── apps/
│   └── course/                the Vite and React app
│       ├── src/
│       │   ├── app/           shell: layout, top bar, sidebar, search, theme, progress
│       │   ├── content/       curriculum, content types, validator, module registry
│       │   ├── kit/           the lab kit
│       │   ├── lib/           safe storage and the search index
│       │   ├── module-page/   renders a module's content and its labs
│       │   ├── modules/       one folder per module
│       │   ├── pages/         home, meeting mode, glossary, kit gallery, planned and not found
│       │   └── styles/        tokens and global styles
│       ├── e2e/               Playwright specs
│       └── scripts/           the docs generator
├── mfe/
│   └── react-catalog/         a remote built on its own with Module Federation
├── packages/
│   ├── mfe-contracts/         typed events and the manifest shape shared by host and remotes
│   └── design-tokens/         the colour, type and theme variables every remote reads
├── docs/                      hand-written and generated guides
├── scripts/                   dev orchestrator, remote registry, site assembly and the preview server
└── .github/workflows/ci.yml   CI and the Pages deploy
```

`pnpm-workspace.yaml` lists `apps/*`, `packages/*` for the code the host and the remotes share, and `mfe/*` for the remotes. The micro-frontend lab is covered at the end.

Every build and the dev server use the base path `/react-learn/`. The Vite config sets it once, and the router takes its `basename` from `import.meta.env.BASE_URL`, so no route or link hard-codes the prefix.

## Content as data

A module is a typed object. `content.ts` in each module folder exports `content: ModuleContent`:

- metadata that mirrors the curriculum entry: slug, number, title, track, the one idea, minutes and phase
- two or three outcomes
- sections of short paragraphs
- lab specs: an id, a title, the Try this prompts and the What just happened explanation
- pitfalls, each with symptom, cause, fix and an optional bad and good snippet
- the meeting card: what to say, what to ask, red flags and the trade-off
- three self-check questions, three to five links and the glossary terms the module introduces

Everything that shows a module reads this one object. The module page renders it. Meeting mode collects the meeting cards. The glossary page collects the terms. The search index is built from it. The Markdown guides are generated from it.

`validate.ts` checks the shape: a word limit on sections, one to three labs, at least three pitfalls, exactly three self-check questions, https links only, and metadata that matches the curriculum. Each module has a test that runs it, so a content change that breaks the format fails `pnpm test`.

`content.ts` files use only erasable TypeScript: types and plain values, no enums and no JSX. The compiler option `erasableSyntaxOnly` enforces it, and it lets Node import the file directly. That matters for the docs generator below.

`curriculum.ts` is the map. It declares the six tracks and all 24 modules with their phase, whether or not the module has been built.

## Registering modules with a glob

Adding a module needs no registry edit. `content/registry.ts` calls `import.meta.glob('../modules/*/index.ts', { eager: true, import: 'default' })` and indexes the results by slug. Each `index.ts` default-exports an entry:

- `content`, the object above
- `loadLabs`, a function that dynamically imports the module's `labs.tsx`

`content/builtSlugs.ts` uses the same pattern without `eager` and reads only the matched paths. Components that need to know whether a module exists, such as the sidebar and the map, call `isBuilt(slug)` and import no module content.

The `modules/:slug` route decides what to render:

- a slug that is not in the curriculum shows the not-found page
- a slug in the curriculum with no folder shows the planned page, which names the phase the module arrives in
- a built slug shows the module page

Lab code is split from content. The module page loads the labs with `use()` inside a `Suspense` boundary, so lab components download only when a module is opened. Each lab sits in its own error boundary. A lab that throws shows an error box in its place and the rest of the page keeps working.

## Generated docs

`apps/course/scripts/gen-docs.ts` imports the `content.ts` of every module folder, with Node running the TypeScript directly, and writes:

- `docs/modules/<slug>.md`, one guide per built module
- `docs/MEETING-CHEATSHEET.md`, every meeting card grouped by track
- `docs/GLOSSARY.md`, every term in A to Z order

`pnpm docs:gen` writes the files. `pnpm docs:check` renders them in memory, compares them with what is committed and fails on any difference, including guides left behind for a module that no longer exists. CI runs the check, so the Markdown cannot drift from the app. Each generated file starts with a line naming the source to edit.

## The lab kit

`src/kit` holds the components that labs and module pages share, so each lab only needs its own logic.

- `RenderBox` counts its commits and flashes on each one. It is the signature visual of the course. A render scope shared through context marks which box committed last, so a whole tree can be read at a glance.
- `Stepper`, `Timeline` and `Waterfall` show sequences: explicit steps, events on lanes along a time axis, and requests with start, end and status.
- `Meter` and `Compare` show quantities and trade-offs.
- `CodePeek` shows highlighted code that is collapsed by default, with a copy button.
- `LabFrame`, `PitfallCard`, `SelfCheck` and `MeetingCardView` frame a module's content. `RichText` renders inline code and bold in any content string.
- `sim.ts` provides a seeded random generator and a simulated request with latency and failure rate, so labs that need a network behave the same on every run.

The kit gallery at `/kit` renders each component with its props. Animation is switched off under `prefers-reduced-motion`, and counts and state changes stay visible without it.

## The shell

- **Theme.** Dark is the base and a full light theme sits beside it. The choice has three states: dark, light and system, and system, which follows the browser, is the default. A small script in `index.html` applies a stored choice before first paint, so there is no flash.
- **Progress.** A Zustand store records which modules are complete. It lives in the browser and never leaves it.
- **Storage.** Every `localStorage` access goes through `lib/safeStorage.ts`, which catches errors. When storage is blocked or full, the app still works and simply forgets between visits.
- **Search.** The command palette searches modules, glossary terms and meeting talk tracks. It is loaded on demand.
- **Tokens.** Colours, type and spacing are CSS custom properties in `styles/tokens.css`. Each track has a colour token that a module page picks up through a single `--tc` property, so a kit component takes the colour of whichever track it appears in.

## Build and deploy

`pnpm build` runs the Vite build of every workspace package and then `scripts/assemble-site.mjs`, which writes the final site to `dist-site/react-learn/`:

- a copy of the app build
- `404.html`, a copy of `index.html`. GitHub Pages serves it for any path that has no file, so a deep link such as `/react-learn/modules/02-rendering` loads the app and the router takes over
- each remote's build output under `remotes/<name>/`, and `remotes/manifest.json`, which lists every remote with its URL and size in bytes
- an empty `.nojekyll`, so Pages serves files whose names start with an underscore untouched

The folder mirrors the live site, so the layout that is tested is the layout that ships. `pnpm preview` serves `dist-site` on port 4173 with the same fallback behaviour, and the Playwright suite runs against it.

`.github/workflows/ci.yml` defines two jobs:

- `ci` runs on every pull request and every push to `main`. It installs with a frozen lockfile, then runs the type check, lint, unit tests, the docs freshness check, the build and the end-to-end suite. On `main` it also uploads `dist-site/react-learn` as the Pages artifact.
- `deploy` runs only after `ci` passes on a push to `main`. It publishes the artifact to the `github-pages` environment, and its concurrency group queues deploys so two never overlap.

Branch protection on `main` requires the `ci` job, so nothing reaches `main`, and therefore nothing reaches the live site, without passing every check.

## The planned micro-frontend lab

The micro frontends track, modules 21 to 24, arrives in phase 1. Its lab is a small storefront assembled inside the course page from independently built pieces, which the page shows with an overlay of team, framework, version, size and load time for each slot.

| Slot            | Remote                         | Integration                                      |
| --------------- | ------------------------------ | ------------------------------------------------ |
| Product catalog | `react-catalog`                | Module Federation, React shared as a singleton   |
| Cart            | `react-cart`                   | Module Federation, React shared as a singleton   |
| Recommendations | `react-recs`, versions 1 and 2 | Module Federation, with a runtime version switch |
| Reviews         | `vue-reviews`                  | Custom element                                   |
| Promo banner    | `svelte-promo`                 | Custom element                                   |
| Account panel   | `angular-account`              | Angular Elements custom element                  |
| Legacy widget   | `legacy-iframe`                | iframe with `postMessage`                        |

How it fits the existing layout:

- **Host.** The course app is the host. It uses the Module Federation runtime and provides its own React, so the React remotes resolve to the host's copy and there is exactly one React on the page.
- **Remotes.** Each remote is a workspace package under `mfe/`, built on its own, and deployed to `/react-learn/remotes/<name>/` next to the course. The recommendations remote is built twice and deployed as `v1` and `v2`.
- **Manifest.** The host finds remotes through a small manifest file. Deploying a new version is a manifest change, as it is with real remote manifests, and the lab can swap versions without rebuilding the host.
- **Shared packages.** `packages/mfe-contracts` holds the typed event names and payloads that form the contract between teams. `packages/design-tokens` is one token set that every remote consumes, whatever its framework.
- **Failure.** Each slot has an error boundary and a fallback. The lab can kill a remote to show the page degrade, restore it, and turn Shadow DOM on or off to show CSS leakage.
- **Pipeline.** `pnpm dev` starts the course and the remotes together, and `pnpm build` assembles them into the same `dist-site` that is deployed. The `.nojekyll` file is already in place for the underscore-prefixed chunks that federation emits.
