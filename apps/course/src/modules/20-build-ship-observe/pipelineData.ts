export type StageId =
  | 'install'
  | 'build-course'
  | 'build-remotes'
  | 'assemble'
  | 'upload'
  | 'deploy'
  | 'serve'
  | 'observe';

export interface Stage {
  id: StageId;
  title: string;
  short: string;
  command: string;
  reads: string;
  produces: string;
  guards: string;
  gap?: string;
}

export const stages: Stage[] = [
  {
    id: 'install',
    title: 'Install',
    short: 'pnpm install --frozen-lockfile',
    command: 'pnpm install --frozen-lockfile',
    reads:
      'package.json in 11 workspace packages (apps/*, packages/*, mfe/*), pnpm-lock.yaml and pnpm-workspace.yaml',
    produces: "node_modules, linked from pnpm's content-addressed store",
    guards:
      'Fails if the lockfile is out of date. A release-age gate refuses brand-new versions when dependencies are updated. Install scripts run only for packages on the allowBuilds list: @parcel/watcher, esbuild, lmdb and msgpackr-extract.',
  },
  {
    id: 'build-course',
    title: 'Build the course',
    short: 'vite build in apps/course',
    command: 'pnpm -r build, which runs vite build in apps/course',
    reads: 'src/, index.html, and the shared design-tokens package',
    produces:
      'apps/course/dist: hashed JS and CSS under the base path /react-learn/. Each module is its own lazy chunk through import.meta.glob.',
    guards:
      'Vite 8 bundles with Rolldown and compiles TSX with Oxc. A syntax error or a missing import fails the build.',
    gap: 'Types are stripped, not checked, so a type error builds fine. CI does not run tsc, ESLint or the tests.',
  },
  {
    id: 'build-remotes',
    title: 'Build the remotes',
    short: '8 packages under mfe/',
    command: 'pnpm -r build, in each package under mfe/',
    reads:
      'Eight packages, each with its own vite.config.ts or angular.json: four React remotes, Vue, Svelte, a plain iframe page and Angular',
    produces:
      'One dist per remote. The React remotes add remoteEntry.js through @module-federation/vite and share React as a singleton.',
    guards:
      'pnpm builds in dependency order and stops at the first failing package. The Angular build also type-checks.',
  },
  {
    id: 'assemble',
    title: 'Assemble',
    short: 'node scripts/assemble-site.mjs',
    command: 'node scripts/assemble-site.mjs, the second half of pnpm run build',
    reads:
      "apps/course/dist and each remote's dist, found through the mfe block in each package.json",
    produces:
      'dist-site/react-learn with the course at the root, each remote under remotes/<name>/, remotes/manifest.json with file sizes, 404.html and .nojekyll',
    guards:
      'Throws if a remote has no build output. Leaves out dotfiles, index.html and mf-stats.json.',
  },
  {
    id: 'upload',
    title: 'Upload artefact',
    short: 'actions/upload-pages-artifact',
    command: 'actions/upload-pages-artifact, on push to main only',
    reads: 'dist-site/react-learn',
    produces: 'A Pages artefact attached to the workflow run',
    guards:
      'Skipped on pull requests, so a PR builds everything and publishes nothing. The workflow token is read-only for repository contents.',
  },
  {
    id: 'deploy',
    title: 'Deploy',
    short: 'actions/deploy-pages',
    command: 'actions/deploy-pages in the deploy job, which needs the ci job',
    reads: 'The artefact from the ci job, not a fresh build',
    produces: 'A deployment in the github-pages environment',
    guards:
      'Only this job gets pages: write and id-token: write. Deployments run one at a time and a running one is never cancelled.',
  },
  {
    id: 'serve',
    title: 'GitHub Pages',
    short: 'static files under /react-learn/',
    command: 'Static hosting at /react-learn/',
    reads: 'The deployed files',
    produces:
      'Pages served from a CDN. 404.html is a copy of index.html, so a deep link reaches the router.',
    guards: 'There is no server to patch.',
    gap: 'Pages cannot set response headers, so a CSP has to be a meta tag and directives such as frame-ancestors are unavailable.',
  },
  {
    id: 'observe',
    title: 'Observe',
    short: 'not in this repo',
    command: 'Not in this repo',
    reads: "Real users' browsers",
    produces: 'Nothing yet',
    guards:
      'What to add: build.sourcemap set to hidden plus an upload step, a release name from the commit SHA, Web Vitals reporting, and a feature flag around risky changes.',
    gap: 'No error tracker, no uploaded source maps, no release tag. A runtime exception stays invisible until a user reports it.',
  },
];

export const sequence: StageId[] = [
  'install',
  'build-course',
  'build-remotes',
  'assemble',
  'upload',
  'deploy',
  'serve',
];

export type ScenarioId =
  | 'none'
  | 'type-error'
  | 'stale-lockfile'
  | 'fresh-malware'
  | 'remote-broken'
  | 'missing-output'
  | 'failing-test'
  | 'prod-exception';

export interface Scenario {
  id: ScenarioId;
  label: string;
  stopsAt: StageId | null;
  focus?: StageId;
  unseen?: boolean;
  result: string;
}

export const scenarios: Scenario[] = [
  {
    id: 'none',
    label: 'No problem',
    stopsAt: null,
    result: 'Every stage passes and the site is published.',
  },
  {
    id: 'type-error',
    label: 'Type error in a component',
    stopsAt: null,
    focus: 'build-course',
    result:
      'It ships. Vite strips types without checking them and CI never runs tsc, so the error reaches production. The fix is a typecheck step before the build.',
  },
  {
    id: 'failing-test',
    label: 'A unit test fails',
    stopsAt: null,
    focus: 'build-course',
    result:
      'It ships. Nothing in CI runs the test suite, because pnpm test is a local step. The fix is a test step that blocks the deploy.',
  },
  {
    id: 'stale-lockfile',
    label: 'package.json changed, lockfile did not',
    stopsAt: 'install',
    result:
      'Stops at install. --frozen-lockfile refuses to rewrite the lockfile, so the job fails and nothing is published.',
  },
  {
    id: 'fresh-malware',
    label: 'A dependency publishes a bad version an hour ago',
    stopsAt: 'install',
    result:
      'Stopped at install, and earlier in practice. The release-age gate will not resolve a version that new when you update, and CI installs only the versions the lockfile pins.',
  },
  {
    id: 'remote-broken',
    label: 'A remote fails to compile',
    stopsAt: 'build-remotes',
    result:
      'Stops at the remotes build. pnpm halts on the first failing package, the job fails, and the previous site stays live.',
  },
  {
    id: 'missing-output',
    label: 'A remote produces no dist folder',
    stopsAt: 'assemble',
    result:
      'Stops at assemble, which throws when a remote has no build output. It is the last check before anything is uploaded.',
  },
  {
    id: 'prod-exception',
    label: 'An exception only real users hit',
    stopsAt: null,
    unseen: true,
    result:
      'It ships, and nobody is told. With no error monitoring the first report is a message from a user.',
  },
];
