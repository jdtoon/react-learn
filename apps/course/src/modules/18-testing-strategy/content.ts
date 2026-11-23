import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '18-testing-strategy',
  number: 18,
  title: 'Testing strategy',
  track: 'production',
  oneIdea: "Test what the user sees, so a refactor doesn't break tests that should still pass.",
  minutes: 12,
  phase: 4,
  outcomes: [
    'Place static, unit, integration and end-to-end tests on a cost versus confidence curve and say where most effort should go',
    'Tell a behavioural test from an implementation-detail test, and predict which one a refactor will break',
    'Name the usual causes of flaky tests and the fix for each',
  ],
  sections: [
    {
      heading: 'The trophy, not the pyramid',
      paragraphs: [
        'Tests buy confidence and cost time to write, run and maintain. The **testing trophy** puts most effort in the middle. **Static** checks (TypeScript, ESLint) catch typos and wrong calls for almost nothing. **Unit** tests cover pure logic. **Integration** tests render a component tree with a real router and store and fake only the network, which is where most front-end bugs live. A few **end-to-end** tests in a real browser prove the journeys that matter. Each step up is slower and flakier, and closer to what users do.',
      ],
    },
    {
      heading: 'Behaviour, not structure',
      paragraphs: [
        "A test should fail when the user's experience breaks and stay green when the code is rearranged. Query the way a user finds things: `getByRole` first, then label and text, and `data-testid` as a last resort. Interact with `user-event` and assert on what is visible.",
        'Tests that read state, class names or markup snapshots break on every refactor, and still pass when behaviour regresses.',
      ],
    },
    {
      heading: 'Fake the network, not React',
      paragraphs: [
        'Mock Service Worker intercepts requests at the network layer, so the component, its data library and `fetch` all run for real, and the same handlers serve tests, Storybook and local development. Vitest runs component tests in jsdom or in a real browser. Playwright drives real browsers for end-to-end tests and can compare screenshots for visual regression. Contract tests check that front end and API agree without running both.',
      ],
    },
    {
      heading: 'Flakiness',
      paragraphs: [
        'A flaky test teaches the team to ignore red. The usual causes are sleeps instead of waiting for a condition, state shared between tests, unmocked network, random or date-dependent data, and animations. Fix the cause: `findBy` and `expect.poll`, isolated state, a frozen clock. Quarantine a test rather than retrying it until it goes green.',
      ],
    },
  ],
  labs: [
    {
      id: 'trophy',
      title: 'The testing trophy: cost versus confidence',
      tryThis: [
        'Press **Pyramid**, then **Trophy**, then **Ice cream cone**. Compare Confidence, CI time and Flake risk for each shape',
        'Start from **Trophy** and drag **End-to-end** to its maximum. Confidence creeps up a few points while CI time more than doubles and flake risk climbs',
        'Press **Only unit tests**. Many fast tests still leave confidence low',
        'Set **Integration** to zero. Confidence holds only because the budget flows to end-to-end tests, and CI time and flake risk jump',
      ],
      whatHappened:
        'The sliders split a fixed testing budget between four layers. Each layer catches a different share of defects, with diminishing returns as you add tests, and costs a different amount to write, run and keep stable. The shape that spends most in the middle reaches high confidence at modest CI time and flake risk, because integration tests are the cheapest way to cover the wiring between pieces. The numbers come from a simple model with invented but plausible costs, so read the shape rather than the digits.',
    },
    {
      id: 'refactor-toggle',
      title: 'The refactor toggle',
      tryThis: [
        'Leave **Original** selected and press **Run tests**. All six tests pass',
        'Switch to **Refactored**. The component behaves identically, yet the implementation-detail tests go red while the behavioural ones stay green',
        'Switch to **Buggy**. A real regression appears: the implementation tests that click once stay green, and the behavioural tests that click twice catch it',
      ],
      whatHappened:
        'Each test mounts the selected variant in a fresh React root and runs against the real DOM, using the real Testing Library queries. The implementation-detail tests depend on a CSS class, a test id and the exact markup, so a refactor that renames them breaks the tests although no user would notice. The behavioural tests find the button by its role and name and read the status text, which is what a user does, so they survive the refactor. In the buggy variant the markup is unchanged, so the implementation tests pass while the behaviour is wrong.',
    },
  ],
  pitfalls: [
    {
      title: 'Querying by class or test id when a role exists',
      symptom: 'Tests break whenever markup is reorganised, and inaccessible controls go unnoticed',
      cause:
        'The query depends on a name that only developers see, so it says nothing about what the user can find',
      fix: 'Query by role and accessible name. If that fails, the control may not be accessible',
      bad: "container.querySelector('.basket-add').click();",
      good: "await user.click(screen.getByRole('button', { name: /add to basket/i }));",
    },
    {
      title: 'Snapshotting whole components',
      symptom: 'Snapshot diffs are huge and the team updates them with `-u` without reading',
      cause:
        'A snapshot asserts everything, so it fails on every harmless change and teaches people to approve blindly',
      fix: 'Assert the specific outcomes that matter. Keep snapshots small, and use them for stable data, not for markup',
    },
    {
      title: 'Mocking your own modules instead of the network',
      symptom:
        'The suite is green and the real request is wrong: a renamed field, a missing header, a changed status code',
      cause:
        'Mocking a hook or a fetch wrapper removes the code you most need exercised, and the mock encodes what you hoped the API does',
      fix: 'Intercept at the network boundary with Mock Service Worker, and share the handlers with Storybook and development',
    },
    {
      title: 'Sleeping to wait for the UI',
      symptom: 'Tests pass on a laptop and fail on CI, or fail one run in twenty',
      cause: 'A fixed delay guesses how long the work takes, and the guess is sometimes wrong',
      fix: 'Wait for the condition that proves the work is done',
      bad: "await new Promise((resolve) => setTimeout(resolve, 500));\nexpect(screen.getByText('Saved')).toBeInTheDocument();",
      good: "expect(await screen.findByText('Saved')).toBeInTheDocument();",
    },
  ],
  meeting: {
    say: [
      'Test behaviour the user can see. If a refactor keeps behaviour and a test fails, that test was checking the implementation.',
      'Most of our confidence should come from integration tests that render real components with the network faked, plus a few end-to-end tests for critical journeys.',
      'Types and lint are the cheapest tests we have. They run on every save.',
      'A flaky test is a defect. We fix it or quarantine it, and we do not retry until it goes green.',
    ],
    ask: [
      "If we rewrite this component's internals and keep its behaviour, which tests fail?",
      'Where is the network faked: at `fetch`, in our own wrapper, or at the network layer?',
      'What is our flake rate, and who owns it?',
      'Which journeys would cost us money if they broke, and are they covered end to end?',
    ],
    redFlags: [
      'Coverage percentage as the goal, with assertions that check little',
      'Snapshots updated with `-u` without reading the diff',
      'Tests that call internal functions, read component state or mock the module under test',
      'Retries or `sleep` calls added to make a test pass',
    ],
    tradeoff:
      'Higher-level tests give more confidence per test and cost more to run, debug and keep stable, so most effort goes in the middle and a few tests go at the top.',
  },
  selfCheck: [
    {
      question:
        'A refactor keeps behaviour identical and three tests go red. What does that tell you, and what do you change?',
      answer:
        'The tests were coupled to implementation: class names, test ids, markup or internal state. Rewrite them to query by role and assert on visible output, so they survive the next refactor.',
    },
    {
      question:
        'Why does Mock Service Worker give more confidence than mocking `fetch` in each test?',
      answer:
        'It intercepts at the network boundary, so the component, your data layer, the real `fetch` and serialisation all run. A `fetch` mock replaces part of what you ship and can pass while the real request is wrong. The same handlers also serve Storybook and development.',
    },
    {
      question:
        'A suite is 90% unit tests and still a user cannot complete checkout after a release. Why is that plausible?',
      answer:
        'Unit tests check pieces in isolation. Bugs in wiring, routing, state, the API contract and configuration live between the pieces, and integration and end-to-end tests are what exercise them.',
    },
  ],
  links: [
    {
      label: 'Testing Library guiding principles',
      url: 'https://testing-library.com/docs/guiding-principles/',
    },
    {
      label: 'Testing Library query priority',
      url: 'https://testing-library.com/docs/queries/about/#priority',
    },
    { label: 'Mock Service Worker', url: 'https://mswjs.io/docs/' },
    { label: 'Vitest guide', url: 'https://vitest.dev/guide/' },
    { label: 'Playwright best practices', url: 'https://playwright.dev/docs/best-practices' },
  ],
  glossary: [
    {
      term: 'Testing trophy',
      definition:
        'A model that puts most test effort into integration tests, with static checks as the base and a few unit and end-to-end tests around them.',
    },
    {
      term: 'Integration test',
      definition:
        'A test that renders several real components together, often with a router and store, and fakes only the network.',
    },
    {
      term: 'Implementation detail',
      definition:
        'Something users cannot observe, such as a class name, a state variable or the markup structure. Tests that depend on it break on refactors.',
    },
    {
      term: 'Query priority',
      definition:
        "Testing Library's order for finding elements: role first, then label and text, with test ids as a last resort.",
    },
    {
      term: 'Mock Service Worker',
      definition:
        'A library that intercepts requests at the network layer, so tests use the real client code against faked responses.',
    },
    {
      term: 'Flaky test',
      definition:
        'A test that passes and fails on the same code, usually because of timing, shared state or uncontrolled data.',
    },
    {
      term: 'Contract test',
      definition:
        'A test that checks a consumer and a provider agree on a request and response shape without running both together.',
    },
  ],
};
