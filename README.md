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

| #   | Module                                                     | Track           | Status           |
| --- | ---------------------------------------------------------- | --------------- | ---------------- |
| 01  | How React thinks                                           | Foundations     | Planned, phase 2 |
| 02  | [Rendering & reconciliation](docs/modules/02-rendering.md) | Foundations     | Built            |
| 03  | State & the snapshot model                                 | Foundations     | Planned, phase 2 |
| 04  | Effects, refs & synchronisation                            | Foundations     | Planned, phase 2 |
| 05  | Component design & composition                             | Architecture    | Planned, phase 3 |
| 06  | State management at scale                                  | Architecture    | Planned, phase 3 |
| 07  | Data fetching, Suspense & errors                           | Architecture    | Planned, phase 3 |
| 08  | Forms & Actions                                            | Architecture    | Planned, phase 3 |
| 09  | Routing & code splitting                                   | Architecture    | Planned, phase 3 |
| 10  | Rendering strategies                                       | Architecture    | Planned, phase 3 |
| 11  | The browser's frame budget                                 | Performance     | Planned, phase 2 |
| 12  | Re-renders, memoisation & the Compiler                     | Performance     | Planned, phase 2 |
| 13  | Concurrent React                                           | Performance     | Planned, phase 2 |
| 14  | Core Web Vitals & loading                                  | Performance     | Planned, phase 2 |
| 15  | Styling & design systems                                   | Craft           | Planned, phase 4 |
| 16  | Accessibility                                              | Craft           | Planned, phase 4 |
| 17  | Motion & perceived performance                             | Craft           | Planned, phase 4 |
| 18  | Testing strategy                                           | Production      | Planned, phase 4 |
| 19  | Frontend security                                          | Production      | Planned, phase 4 |
| 20  | Build, ship & observe                                      | Production      | Planned, phase 4 |
| 21  | Why & when                                                 | Micro frontends | Planned, phase 1 |
| 22  | Composition patterns                                       | Micro frontends | Planned, phase 1 |
| 23  | Sharing & communication                                    | Micro frontends | Planned, phase 1 |
| 24  | MFEs in production                                         | Micro frontends | Planned, phase 1 |

## Guides

- [Getting started](docs/GETTING-STARTED.md): run, check and extend the app
- [How this app is built](docs/HOW-THIS-APP-IS-BUILT.md): the architecture, from workspace layout to deploy pipeline
- [Meeting cheatsheet](docs/MEETING-CHEATSHEET.md): the say, ask and red-flag cards for every built module
- [Glossary](docs/GLOSSARY.md): key terms with the module that teaches each

## Licence

[MIT](LICENSE)
