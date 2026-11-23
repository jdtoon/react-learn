> Generated from the app's content. Edit `apps/course/src/modules/18-testing-strategy/content.ts`.

# 18. Testing strategy

**Production** · Module 18 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/18-testing-strategy)

**The one idea:** Test what the user sees, so a refactor doesn't break tests that should still pass.

## After this you can

- Place static, unit, integration and end-to-end tests on a cost versus confidence curve and say where most effort should go
- Tell a behavioural test from an implementation-detail test, and predict which one a refactor will break
- Name the usual causes of flaky tests and the fix for each

## The model

### The trophy, not the pyramid

Tests buy confidence and cost time to write, run and maintain. The **testing trophy** puts most effort in the middle. **Static** checks (TypeScript, ESLint) catch typos and wrong calls for almost nothing. **Unit** tests cover pure logic. **Integration** tests render a component tree with a real router and store and fake only the network, which is where most front-end bugs live. A few **end-to-end** tests in a real browser prove the journeys that matter. Each step up is slower and flakier, and closer to what users do.

### Behaviour, not structure

A test should fail when the user's experience breaks and stay green when the code is rearranged. Query the way a user finds things: `getByRole` first, then label and text, and `data-testid` as a last resort. Interact with `user-event` and assert on what is visible.

Tests that read state, class names or markup snapshots break on every refactor, and still pass when behaviour regresses.

### Fake the network, not React

Mock Service Worker intercepts requests at the network layer, so the component, its data library and `fetch` all run for real, and the same handlers serve tests, Storybook and local development. Vitest runs component tests in jsdom or in a real browser. Playwright drives real browsers for end-to-end tests and can compare screenshots for visual regression. Contract tests check that front end and API agree without running both.

### Flakiness

A flaky test teaches the team to ignore red. The usual causes are sleeps instead of waiting for a condition, state shared between tests, unmocked network, random or date-dependent data, and animations. Fix the cause: `findBy` and `expect.poll`, isolated state, a frozen clock. Quarantine a test rather than retrying it until it goes green.

## Labs

The labs run in the app. Each one below links to the live version.

### The testing trophy: cost versus confidence

Try this:

- Press **Pyramid**, then **Trophy**, then **Ice cream cone**. Compare Confidence, CI time and Flake risk for each shape
- Start from **Trophy** and drag **End-to-end** to its maximum. Confidence creeps up a few points while CI time more than doubles and flake risk climbs
- Press **Only unit tests**. Many fast tests still leave confidence low
- Set **Integration** to zero. Confidence holds only because the budget flows to end-to-end tests, and CI time and flake risk jump

[Open the live lab](https://jdtoon.github.io/react-learn/modules/18-testing-strategy#lab-trophy)

### The refactor toggle

Try this:

- Leave **Original** selected and press **Run tests**. All six tests pass
- Switch to **Refactored**. The component behaves identically, yet the implementation-detail tests go red while the behavioural ones stay green
- Switch to **Buggy**. A real regression appears: the implementation tests that click once stay green, and the behavioural tests that click twice catch it

[Open the live lab](https://jdtoon.github.io/react-learn/modules/18-testing-strategy#lab-refactor-toggle)

## Pitfalls

### Querying by class or test id when a role exists

- **Symptom:** Tests break whenever markup is reorganised, and inaccessible controls go unnoticed
- **Cause:** The query depends on a name that only developers see, so it says nothing about what the user can find
- **Fix:** Query by role and accessible name. If that fails, the control may not be accessible

Bad:

```tsx
container.querySelector('.basket-add').click();
```

Good:

```tsx
await user.click(screen.getByRole('button', { name: /add to basket/i }));
```

### Snapshotting whole components

- **Symptom:** Snapshot diffs are huge and the team updates them with `-u` without reading
- **Cause:** A snapshot asserts everything, so it fails on every harmless change and teaches people to approve blindly
- **Fix:** Assert the specific outcomes that matter. Keep snapshots small, and use them for stable data, not for markup

### Mocking your own modules instead of the network

- **Symptom:** The suite is green and the real request is wrong: a renamed field, a missing header, a changed status code
- **Cause:** Mocking a hook or a fetch wrapper removes the code you most need exercised, and the mock encodes what you hoped the API does
- **Fix:** Intercept at the network boundary with Mock Service Worker, and share the handlers with Storybook and development

### Sleeping to wait for the UI

- **Symptom:** Tests pass on a laptop and fail on CI, or fail one run in twenty
- **Cause:** A fixed delay guesses how long the work takes, and the guess is sometimes wrong
- **Fix:** Wait for the condition that proves the work is done

Bad:

```tsx
await new Promise((resolve) => setTimeout(resolve, 500));
expect(screen.getByText('Saved')).toBeInTheDocument();
```

Good:

```tsx
expect(await screen.findByText('Saved')).toBeInTheDocument();
```

## In the meeting

**Say**

- Test behaviour the user can see. If a refactor keeps behaviour and a test fails, that test was checking the implementation.
- Most of our confidence should come from integration tests that render real components with the network faked, plus a few end-to-end tests for critical journeys.
- Types and lint are the cheapest tests we have. They run on every save.
- A flaky test is a defect. We fix it or quarantine it, and we do not retry until it goes green.

**Ask**

- If we rewrite this component's internals and keep its behaviour, which tests fail?
- Where is the network faked: at `fetch`, in our own wrapper, or at the network layer?
- What is our flake rate, and who owns it?
- Which journeys would cost us money if they broke, and are they covered end to end?

**Red flags**

- Coverage percentage as the goal, with assertions that check little
- Snapshots updated with `-u` without reading the diff
- Tests that call internal functions, read component state or mock the module under test
- Retries or `sleep` calls added to make a test pass

**Trade-off:** Higher-level tests give more confidence per test and cost more to run, debug and keep stable, so most effort goes in the middle and a few tests go at the top.

## Self-check

1. A refactor keeps behaviour identical and three tests go red. What does that tell you, and what do you change?

   <details>
   <summary>Answer</summary>

   The tests were coupled to implementation: class names, test ids, markup or internal state. Rewrite them to query by role and assert on visible output, so they survive the next refactor.

   </details>

2. Why does Mock Service Worker give more confidence than mocking `fetch` in each test?

   <details>
   <summary>Answer</summary>

   It intercepts at the network boundary, so the component, your data layer, the real `fetch` and serialisation all run. A `fetch` mock replaces part of what you ship and can pass while the real request is wrong. The same handlers also serve Storybook and development.

   </details>

3. A suite is 90% unit tests and still a user cannot complete checkout after a release. Why is that plausible?

   <details>
   <summary>Answer</summary>

   Unit tests check pieces in isolation. Bugs in wiring, routing, state, the API contract and configuration live between the pieces, and integration and end-to-end tests are what exercise them.

   </details>

## Go deeper

- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/)
- [Testing Library query priority](https://testing-library.com/docs/queries/about/#priority)
- [Mock Service Worker](https://mswjs.io/docs/)
- [Vitest guide](https://vitest.dev/guide/)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
