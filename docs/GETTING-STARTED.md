# Getting started

This guide covers running the course, using it, checking your changes and adding a module. For how the code is organised, read [How this app is built](HOW-THIS-APP-IS-BUILT.md).

## Set up

You need:

- Node 24 (`.nvmrc` pins the major version)
- pnpm 11. The exact version is set by `packageManager` in `package.json`. Run `corepack enable` once and pnpm switches to it automatically.

```sh
pnpm i
pnpm dev
```

The course runs at http://localhost:5173/react-learn/ and each remote has its own dev server on a port from 5201 up. If you only work on the course, `pnpm dev:course` starts just that. The `/react-learn/` base path is used in dev, in the build and in the preview, so a link that works locally works on the live site.

To see exactly what gets deployed, build the static site and serve it:

```sh
pnpm build
pnpm preview
```

The preview runs at http://localhost:4173/react-learn/ and answers unknown paths with the app shell, as GitHub Pages does.

## Using the course

- **Home** shows the curriculum as a map. Each track is a lane and each module is a node, marked built, planned or completed. Start here opens the first built module. Prep for a meeting opens meeting mode.
- **A module page** runs in a fixed order: the one idea and what you can do after it, the model, the labs, pitfalls, the meeting card, a three-question self-check and links to go deeper. Each lab has a Try this checklist and a What just happened reveal that names the mechanism.
- **Meeting mode** at `/meeting` gathers the meeting card of every built module on one page, filterable by track. Each card has what to say, what to ask, red flags and the trade-off.
- **The glossary** at `/glossary` lists every key term in A to Z order with the module that teaches it.
- **Search** opens with Ctrl+K (Cmd+K on macOS) or the button in the top bar.
- **Theme** switches between dark, light and system from the top bar.
- **Progress** is stored in your browser. Mark complete on a module page updates the map. Nothing is sent anywhere, and clearing site data resets it.
- **The kit gallery** at `/kit` shows every lab component with its signature, which helps when building a new lab.

The same content is written out as plain Markdown in this folder: [the meeting cheatsheet](MEETING-CHEATSHEET.md), [the glossary](GLOSSARY.md) and one guide per built module in [modules](modules).

## Commands

Run all of these from the repository root.

| Command             | What it does                                                                      |
| ------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`          | Starts the course and every remote, each with hot reload                          |
| `pnpm dev:course`   | Starts only the course                                                            |
| `pnpm build`        | Builds the app and assembles `dist-site/react-learn`, the folder that is deployed |
| `pnpm preview`      | Serves `dist-site` on port 4173 with the Pages fallback                           |
| `pnpm typecheck`    | Runs the TypeScript compiler in strict mode                                       |
| `pnpm lint`         | Runs ESLint                                                                       |
| `pnpm test`         | Runs the Vitest unit and component tests                                          |
| `pnpm e2e`          | Runs the Playwright tests against the preview                                     |
| `pnpm docs:gen`     | Regenerates the Markdown guides in `docs`                                         |
| `pnpm docs:check`   | Fails when the committed guides differ from what the content would generate       |
| `pnpm format`       | Formats the code with Prettier                                                    |
| `pnpm format:check` | Checks formatting without changing files                                          |

`pnpm e2e` needs a fresh `pnpm build` first because it serves `dist-site`. On a new machine, install the browser once:

```sh
pnpm --filter @react-field-guide/course exec playwright install chromium
```

## Before you push

CI runs these in order, and each one has to pass:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm docs:check
pnpm build
pnpm e2e
```

Pushes to `main` that pass are deployed to GitHub Pages. Pull requests run the same checks and do not deploy.

## Add a module

All 24 modules are already listed in `apps/course/src/content/curriculum.ts` with their slug, title, track, one idea, length and phase. A module becomes part of the app when its folder has an `index.ts`. There is no registry to edit.

1. Create `apps/course/src/modules/<slug>/`, using the slug from the curriculum.
2. Add `content.ts` exporting `content`, typed as `ModuleContent`. Its slug, number, title, track, one idea, minutes and phase must match the curriculum entry.
3. Add the lab components and a `labs.tsx` that exports `labs`, an object whose keys are the lab ids declared in `content.labs`.
4. Add `index.ts` that default-exports `{ content, loadLabs: () => import('./labs') }`.
5. Add a `content.test.ts` that runs `validateModuleContent(content)` and expects no problems. The validator enforces the module shape: one to three labs, at least three pitfalls, exactly three self-check questions, three to five https links and a section word limit.
6. Run `pnpm docs:gen` and commit the generated files together with the module.
7. Change the module's row in the curriculum table in the root `README.md` to Built and link its guide.

`pnpm dev` picks the new folder up straight away. The home map, the sidebar, search, meeting mode and the glossary all read from the same registry.

Never edit the generated files in `docs`. Each starts with a line that names the source to change instead.
