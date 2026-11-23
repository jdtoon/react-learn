> Generated from the app's content. Edit `apps/course/src/modules/20-build-ship-observe/content.ts`.

# 20. Build, ship & observe

**Production** · Module 20 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/20-build-ship-observe)

**The one idea:** The toolchain turns TS and JSX into fast static files. CI, source maps and monitoring keep it honest in production.

## After this you can

- Trace a commit through install, build, assemble and deploy in a pnpm monorepo, and say what each stage guards
- Explain why a passing build does not mean the types, hooks and tests are right
- Say what you need in production to see a failure: source maps, release tags, error monitoring and feature flags

## The model

### From source to static files

Browsers cannot run TSX, so a toolchain compiles it. In development Vite serves your files as native ES modules and transforms each on request, so start-up does not grow with the app. For production it bundles: Vite 8 hands the module graph to **Rolldown**, a Rust bundler with a Rollup-compatible API, and uses Oxc to strip types and compile JSX. The output is minified, hashed static files, split at each dynamic `import()`. Rspack, webpack, Turbopack and esbuild differ in speed, plugin ecosystem and Module Federation support, which is what matters when you choose or migrate.

### Transpiling is not checking

The bundler removes TypeScript types and never checks them, so a type error still builds. Type checking is a separate `tsc --noEmit` step. Linting is another: ESLint with the React Hooks rules catches broken hook usage that the type checker cannot see. Run all three and make CI fail on each, or the pipeline ships what the editor was warning about.

### Monorepo and CI

A pnpm workspace links several packages in one repository and installs once. `pnpm -r build` builds them in dependency order, and Turborepo or Nx add caching and run only what changed. CI should be boring: install with a frozen lockfile, check, test, build, then upload the artefact and deploy that artefact rather than rebuilding. Give deploy permissions to the deploy job alone.

### Observe in production

Shipping is finished only when you can see failures. Build source maps with `sourcemap: "hidden"` and upload them to your error tracker, not your CDN, so stack traces map back to source without publishing it. Tag every release with the commit SHA and report Web Vitals from real users (module 14). Put risky changes behind a feature flag and roll them out by percentage, so a bad release is a toggle, not a redeploy.

## Labs

The labs run in the app. Each one below links to the live version.

### This repo's pipeline

Try this:

- Click each stage in turn and read its command, what it produces and what guards it
- Pick **Type error in a component**. Every stage passes and the change ships, because Vite does not type-check and CI never runs tsc
- Pick **package.json changed, lockfile did not** and **A remote fails to compile**. Compare where each one stops and what stays live
- Pick **An exception only real users hit** and look at the last card. This repo has no way to see it

[Open the live lab](https://jdtoon.github.io/react-learn/modules/20-build-ship-observe#lab-pipeline)

### The bundler landscape

Try this:

- Select only **Existing webpack app**. Rspack and webpack lead because their configs and loaders carry over
- Add **Module Federation** and **Raw build speed**. Watch the ranking move
- Clear everything and select **Next.js app** alone. The framework mostly chooses for you

[Open the live lab](https://jdtoon.github.io/react-learn/modules/20-build-ship-observe#lab-bundlers)

## Pitfalls

### Treating a green build as a type-safe build

- **Symptom:** The editor shows red, `vite build` succeeds, and the error reaches production
- **Cause:** Vite compiles TypeScript by removing the types. It never runs the type checker
- **Fix:** Add `tsc --noEmit` and ESLint to CI as separate steps that block the deploy

Bad:

```tsx
"build": "vite build"
```

Good:

```tsx
"build": "tsc --noEmit && vite build"
```

### Serving source maps to everyone

- **Symptom:** Anyone can read your original source in dev tools, or production stack traces are unreadable
- **Cause:** Maps are either published openly with the bundle, or never generated, so errors point at minified code
- **Fix:** Generate hidden source maps, upload them to the error tracker with a release name, and keep them off the public host

Bad:

```tsx
build: { sourcemap: true }
```

Good:

```tsx
build: { sourcemap: 'hidden' }
```

### Rebuilding on deploy instead of shipping the tested artefact

- **Symptom:** Production behaves differently from what CI tested
- **Cause:** A second build can resolve different dependencies or read different environment variables from the first
- **Fix:** Build once in CI, upload the output as an artefact and deploy exactly that artefact

### Feature flags that never get removed

- **Symptom:** Code is full of branches for flags nobody remembers, and tests cover only one side
- **Cause:** A flag was added for a rollout and nobody owned its removal
- **Fix:** Give every flag an owner and a removal date, and delete the flag and the dead branch once the rollout is complete

## In the meeting

**Say**

- Vite transpiles, it does not type-check. Type checking, linting and tests are separate CI steps, and each one has to block the deploy.
- We build once, upload the artefact and deploy that same artefact. The deploy job is the only one with write permissions.
- Source maps go to the error tracker, not the CDN, and every release is tagged with the commit SHA.
- Risky changes go behind a flag with a percentage rollout, so the rollback is a toggle.

**Ask**

- Which CI steps can fail the pipeline, and do type errors and failing tests block a deploy?
- How do we find out about a production exception, and how long does that take?
- Where do source maps go, and can we map a production stack trace to a commit?
- What does it cost us to switch bundlers, and have we measured our own build?

**Red flags**

- A pipeline that only runs the build
- Deploying from a developer machine, or rebuilding at deploy time
- Public source maps, or no source maps and unreadable stack traces
- Flags with no owner and no removal date

**Trade-off:** More pipeline stages and monitoring catch more problems before and after release, and cost build minutes, setup effort and a slower path to production.

## Self-check

1. A pull request has a type error, `vite build` passes, and CI is green. Is that a bug in the pipeline?

   <details>
   <summary>Answer</summary>

   Yes, in the sense that the pipeline has a gap. Vite strips types without checking them, so a green build says nothing about types. Add a `tsc --noEmit` step and make it block the merge.

   </details>

2. Why does the deploy job use the artefact from the ci job instead of building again?

   <details>
   <summary>Answer</summary>

   So production runs exactly what CI built and checked. A second build could resolve different dependencies or environment values. It also keeps write permissions out of the job that runs build scripts.

   </details>

3. Where should source maps live, and why?

   <details>
   <summary>Answer</summary>

   In your error tracker, uploaded at build time with a release name. Production stack traces then map back to source, and you do not publish your original code to every visitor.

   </details>

## Go deeper

- [Vite: why Vite](https://vite.dev/guide/why)
- [Rolldown](https://rolldown.rs/)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [GitHub Actions: deploying to GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Chrome DevTools: source maps](https://developer.chrome.com/docs/devtools/javascript/source-maps)
