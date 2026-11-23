import type { ModuleContent } from '../../content/types';

export const content: ModuleContent = {
  slug: '19-frontend-security',
  number: 19,
  title: 'Frontend security',
  track: 'production',
  oneIdea:
    'React escapes text by default. The risks live in the escape hatches, tokens and dependencies.',
  minutes: 12,
  phase: 4,
  outcomes: [
    'Explain why React output is safe by default, and list the escape hatches where XSS gets in',
    'Choose where tokens live and what a CSP and a sandboxed iframe limit when an injection succeeds',
    'Name the supply chain controls that matter: lockfile, frozen installs, release-age gates and install-script policy',
  ],
  sections: [
    {
      heading: 'What React gives you',
      paragraphs: [
        'React escapes every value in JSX, so `{comment}` renders as text even when it contains `<script>`. Cross-site scripting (XSS) arrives through the escape hatches: `dangerouslySetInnerHTML`, `href` or `src` taken from user data, HTML built by hand and third-party scripts. React 19 blocks `javascript:` URLs set through props, but not HTML you inject yourself. If you must render HTML, sanitise it with an allow-list library such as DOMPurify, and enable Trusted Types where supported.',
      ],
    },
    {
      heading: 'Contain the damage',
      paragraphs: [
        'Assume one injection will eventually get through. A **Content Security Policy** limits what scripts may run: use nonces or hashes, avoid `unsafe-inline`, and set `object-src` and `base-uri` to `none`. A sandboxed iframe without `allow-same-origin` gets an opaque origin and cannot reach your DOM or storage.',
        'Token storage decides what an injection can steal. Anything in `localStorage` is readable by any script on the page. Prefer an `HttpOnly`, `Secure`, `SameSite` cookie issued by a backend-for-frontend (BFF) that holds the real tokens and proxies API calls. Cookies bring back CSRF, which `SameSite` and anti-forgery tokens handle.',
      ],
    },
    {
      heading: 'Supply chain',
      paragraphs: [
        "Most code in your bundle is someone else's. Commit the lockfile and install with `--frozen-lockfile`, so CI builds what you reviewed. Add a release-age gate such as pnpm's `minimumReleaseAge`, because poisoned releases are usually caught within hours or days. Self-replicating npm worms, from Shai-Hulud in 2025 onward, steal maintainer tokens and republish infected versions of every package they reach. Block install scripts by default, allow the few that need them, and pin CI actions to commit hashes.",
      ],
    },
    {
      heading: 'Secrets and Server Functions',
      paragraphs: [
        'Nothing in a client bundle is secret. A key in `import.meta.env` or `NEXT_PUBLIC_*` ships to every visitor, so keep secrets on a server. Server Functions are public HTTP endpoints: validate input and check authorisation inside each one, because hiding a button protects nothing.',
      ],
    },
  ],
  labs: [
    {
      id: 'xss-sandbox',
      title: 'XSS sandbox',
      tryThis: [
        'With **Image onerror** and **React text (escaped)** selected, look at the preview and the HTML box. The payload is text and nothing runs',
        'Switch to **Raw HTML**. The handler fires, the fake token is read, and the attempt to reach your app stays blocked by the sandbox',
        'Stay on **Raw HTML** and tick **Strict CSP in the preview**. The same HTML is in the page, but the handler is refused and the violations row names the directive',
        'Try **Sanitised HTML** with each payload, then try **Script tag** under **Raw HTML** and read why nothing runs',
      ],
      whatHappened:
        "The comment is turned into an HTML string by the selected mode and inserted into a sandboxed iframe with `innerHTML`, the same mechanism as `dangerouslySetInnerHTML`. Escaped, it becomes `&lt;img ...&gt;` and is only text. Raw, the broken image fires its `onerror` handler and the attacker code runs with the page's privileges, so it can read the page secret. The sandbox stops it reaching your app, but not the page it lives in. A strict CSP blocks inline handlers and `javascript:` URLs even though the markup is present, and the sanitiser removes them before insertion. Script elements added through `innerHTML` never run, which is why real payloads use handlers.",
    },
  ],
  pitfalls: [
    {
      title: 'Raw HTML from users or a CMS',
      symptom: 'A comment, profile or CMS field runs script for every visitor who views it',
      cause:
        '`dangerouslySetInnerHTML` inserts the string as live markup, so any event handler or `javascript:` URL in it runs',
      fix: 'Render as text where you can. Where you must render HTML, sanitise it with a maintained allow-list library, and back it with a CSP',
      bad: '<div dangerouslySetInnerHTML={{ __html: comment.body }} />',
      good: '<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />',
    },
    {
      title: 'Session tokens in localStorage',
      symptom:
        'One XSS bug lets an attacker copy a long-lived token and use it from their own machine',
      cause: 'Any script on the page can read `localStorage` and `sessionStorage`',
      fix: 'Keep the token in an `HttpOnly`, `Secure`, `SameSite` cookie set by a BFF, and add CSRF protection for state-changing requests',
      bad: "localStorage.setItem('access_token', token);",
      good: 'Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/',
    },
    {
      title: 'User-controlled URLs in href',
      symptom:
        'A profile link or redirect parameter opens `javascript:` or `data:` content when clicked',
      cause:
        'The scheme comes from user input and the page renders it as a link without checking it',
      fix: 'Parse the URL and allow only `https:` and `mailto:`. Never build an `href` from unchecked input',
      bad: '<a href={profile.website}>Website</a>',
      good: '<a href={safeHttpUrl(profile.website)}>Website</a>',
    },
    {
      title: 'Secrets in the bundle',
      symptom: 'An API key shows up in the shipped JavaScript, and in every browser cache',
      cause:
        'Variables with a public prefix such as `VITE_` and `NEXT_PUBLIC_` are inlined at build time on purpose',
      fix: 'Keep the secret on a server and call it through your own endpoint. Rotate any key that has already shipped',
    },
    {
      title: 'Installing whatever is newest',
      symptom: 'A build picks up a version published an hour ago, and a postinstall script runs',
      cause: 'No lockfile, loose ranges and install scripts enabled for every package',
      fix: 'Commit the lockfile, install with `--frozen-lockfile`, set a release-age gate and allow install scripts only for packages that need them',
    },
  ],
  meeting: {
    say: [
      'React escapes text, so XSS needs an escape hatch: `dangerouslySetInnerHTML`, a user-controlled URL or a third-party script. Those are the places to review.',
      'We assume an injection will eventually happen, so tokens live in `HttpOnly` cookies behind a BFF and a CSP limits what injected code can do.',
      'Everything shipped to the browser is public. Secrets belong on the server.',
      'Our first defences against npm worms are the lockfile, frozen installs and a release-age gate.',
    ],
    ask: [
      'Where do we use `dangerouslySetInnerHTML`, and what sanitises that HTML?',
      'Where is the access token stored, and what can a script on the page read?',
      'Is our CSP enforcing, and does it use nonces instead of `unsafe-inline`?',
      'How soon can a newly published dependency version reach our build, and who may run install scripts?',
    ],
    redFlags: [
      'Tokens or personal data in `localStorage`',
      'A hand-written HTML sanitiser, or a regex that strips `<script>`',
      'API keys in `VITE_` or `NEXT_PUBLIC_` variables',
      'CI that installs without a lockfile, or dependencies on `latest`',
    ],
    tradeoff:
      'A strict CSP, a BFF and delayed dependency updates raise the cost of an attack and cost you flexibility: no inline scripts, more backend work and slower access to patches.',
  },
  selfCheck: [
    {
      question:
        'A comment containing `<img src=x onerror=...>` is rendered as `{comment}` in JSX. Does the handler run? What changes with `dangerouslySetInnerHTML`?',
      answer:
        'It does not run: React escapes the string and shows it as text. Through `dangerouslySetInnerHTML` it becomes real markup and the handler runs with full access to the page, unless it is sanitised, blocked by a CSP or isolated in a sandboxed iframe. A `<script>` tag inserted that way does not run, which is why attackers use event handlers.',
    },
    {
      question:
        'Why is an `HttpOnly` cookie safer than `localStorage` for a session, and what does it cost?',
      answer:
        'Script cannot read an `HttpOnly` cookie, so an XSS bug cannot copy the token, although injected code can still act as the user while the page is open. It brings back CSRF, which you handle with `SameSite` and anti-forgery tokens.',
    },
    {
      question: 'What does a release-age gate protect against, and what does it not?',
      answer:
        'It delays installs of brand-new versions, so most malicious releases are detected and pulled before they reach your build. It does not help against a package that was malicious for longer than the gate, so you still need a lockfile, review and a policy for install scripts.',
    },
  ],
  links: [
    {
      label: 'React: dangerouslySetInnerHTML',
      url: 'https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html',
    },
    {
      label: 'MDN: Content Security Policy',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP',
    },
    {
      label: 'OWASP: XSS Prevention Cheat Sheet',
      url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
    },
    {
      label: 'MDN: iframe sandbox',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox',
    },
    { label: 'pnpm settings', url: 'https://pnpm.io/settings' },
  ],
  glossary: [
    {
      term: 'XSS',
      definition:
        "Cross-site scripting: an attacker gets their script to run in your page, where it has your page's access to cookies, storage and the DOM.",
    },
    {
      term: 'Sanitisation',
      definition:
        'Rebuilding untrusted HTML from an allow-list of tags and attributes so it cannot carry script. Use a maintained library such as DOMPurify.',
    },
    {
      term: 'CSP',
      definition:
        'Content Security Policy: a response header that tells the browser which sources of script, images and connections to allow, limiting what injected code can do.',
    },
    {
      term: 'BFF',
      definition:
        'Backend for frontend: a small server that holds the real tokens, sets a session cookie for the browser and proxies calls to the APIs.',
    },
    {
      term: 'CSRF',
      definition:
        'Cross-site request forgery: another site makes the browser send an authenticated request. `SameSite` cookies and anti-forgery tokens defend against it.',
    },
    {
      term: 'Trusted Types',
      definition:
        'A browser feature that makes dangerous DOM sinks such as `innerHTML` accept only values produced by a policy you define.',
    },
    {
      term: 'Release-age gate',
      definition:
        "A package manager setting, such as pnpm's `minimumReleaseAge`, that refuses versions published less than a set time ago.",
    },
  ],
};
