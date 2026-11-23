# React Field Guide

A visual course that teaches frontend through React. Each concept has a live lab you can poke at, and each module ends with a card of what to say, what to ask and what to watch for in a meeting.

**Live site: https://jdtoon.github.io/react-learn/**

![The React Field Guide course map](docs/assets/home.png)

## Run it locally

You need Node 24 and pnpm 11. The exact pnpm version is pinned in `package.json`, so `corepack enable` selects it for you.

```sh
pnpm i
pnpm dev
```

The app is served at http://localhost:5173/react-learn/. [Getting started](docs/GETTING-STARTED.md) covers the other commands and how to add a module.

## Curriculum

Six tracks, 24 modules. Built modules link to a written guide generated from the same content as the app. Planned modules show the phase they arrive in: phase 1 is the micro frontends track, phase 2 finishes foundations and covers performance, phase 3 is architecture, phase 4 is craft and production.

| #   | Module                                                                                | Track           | Status |
| --- | ------------------------------------------------------------------------------------- | --------------- | ------ |
| 01  | [How React thinks](docs/modules/01-how-react-thinks.md)                               | Foundations     | Built  |
| 02  | [Rendering & reconciliation](docs/modules/02-rendering.md)                            | Foundations     | Built  |
| 03  | [State & the snapshot model](docs/modules/03-state-snapshots.md)                      | Foundations     | Built  |
| 04  | [Effects, refs & synchronisation](docs/modules/04-effects-and-refs.md)                | Foundations     | Built  |
| 05  | [Component design & composition](docs/modules/05-component-design.md)                 | Architecture    | Built  |
| 06  | [State management at scale](docs/modules/06-state-management.md)                      | Architecture    | Built  |
| 07  | [Data fetching, Suspense & errors](docs/modules/07-data-fetching.md)                  | Architecture    | Built  |
| 08  | [Forms & Actions](docs/modules/08-forms-and-actions.md)                               | Architecture    | Built  |
| 09  | [Routing & code splitting](docs/modules/09-routing-and-splitting.md)                  | Architecture    | Built  |
| 10  | [Rendering strategies](docs/modules/10-rendering-strategies.md)                       | Architecture    | Built  |
| 11  | [The browser's frame budget](docs/modules/11-frame-budget.md)                         | Performance     | Built  |
| 12  | [Re-renders, memoisation & the Compiler](docs/modules/12-memoization-and-compiler.md) | Performance     | Built  |
| 13  | [Concurrent React](docs/modules/13-concurrent-react.md)                               | Performance     | Built  |
| 14  | [Core Web Vitals & loading](docs/modules/14-web-vitals.md)                            | Performance     | Built  |
| 15  | [Styling & design systems](docs/modules/15-styling-and-design-systems.md)             | Craft           | Built  |
| 16  | [Accessibility](docs/modules/16-accessibility.md)                                     | Craft           | Built  |
| 17  | [Motion & perceived performance](docs/modules/17-motion-and-perceived-performance.md) | Craft           | Built  |
| 18  | [Testing strategy](docs/modules/18-testing-strategy.md)                               | Production      | Built  |
| 19  | [Frontend security](docs/modules/19-frontend-security.md)                             | Production      | Built  |
| 20  | [Build, ship & observe](docs/modules/20-build-ship-observe.md)                        | Production      | Built  |
| 21  | [Why & when](docs/modules/21-mfe-why-and-when.md)                                     | Micro frontends | Built  |
| 22  | [Composition patterns](docs/modules/22-mfe-composition.md)                            | Micro frontends | Built  |
| 23  | [Sharing & communication](docs/modules/23-mfe-sharing-and-communication.md)           | Micro frontends | Built  |
| 24  | [MFEs in production](docs/modules/24-mfe-in-production.md)                            | Micro frontends | Built  |

## Guides

- [Getting started](docs/GETTING-STARTED.md): run, check and extend the app
- [How this app is built](docs/HOW-THIS-APP-IS-BUILT.md): the architecture, from workspace layout to deploy pipeline
- [Meeting cheatsheet](docs/MEETING-CHEATSHEET.md): the say, ask and red-flag cards for every built module
- [Glossary](docs/GLOSSARY.md): key terms with the module that teaches each

## Licence

[MIT](LICENSE)
