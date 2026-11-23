> Generated from the app's content. Edit `apps/course/src/modules/19-frontend-security/content.ts`.

# 19. Frontend security

**Production** · Module 19 · 12 min · [Open in the app](https://jdtoon.github.io/react-learn/modules/19-frontend-security)

**The one idea:** React escapes text by default. The risks live in the escape hatches, tokens and dependencies.

## After this you can

- Explain why React output is safe by default, and list the escape hatches where XSS gets in
- Choose where tokens live and what a CSP and a sandboxed iframe limit when an injection succeeds
- Name the supply chain controls that matter: lockfile, frozen installs, release-age gates and install-script policy

## The model

### What React gives you

React escapes every value in JSX, so `{comment}` renders as text even when it contains `<script>`. Cross-site scripting (XSS) arrives through the escape hatches: `dangerouslySetInnerHTML`, `href` or `src` taken from user data, HTML built by hand and third-party scripts. React 19 blocks `javascript:` URLs set through props, but not HTML you inject yourself. If you must render HTML, sanitise it with an allow-list library such as DOMPurify, and enable Trusted Types where supported.

### Contain the damage

Assume one injection will eventually get through. A **Content Security Policy** limits what scripts may run: use nonces or hashes, avoid `unsafe-inline`, and set `object-src` and `base-uri` to `none`. A sandboxed iframe without `allow-same-origin` gets an opaque origin and cannot reach your DOM or storage.

Token storage decides what an injection can steal. Anything in `localStorage` is readable by any script on the page. Prefer an `HttpOnly`, `Secure`, `SameSite` cookie issued by a backend-for-frontend (BFF) that holds the real tokens and proxies API calls. Cookies bring back CSRF, which `SameSite` and anti-forgery tokens handle.

### Supply chain

Most code in your bundle is someone else's. Commit the lockfile and install with `--frozen-lockfile`, so CI builds what you reviewed. Add a release-age gate such as pnpm's `minimumReleaseAge`, because poisoned releases are usually caught within hours or days. Self-replicating npm worms, from Shai-Hulud in 2025 onward, steal maintainer tokens and republish infected versions of every package they reach. Block install scripts by default, allow the few that need them, and pin CI actions to commit hashes.

### Secrets and Server Functions

Nothing in a client bundle is secret. A key in `import.meta.env` or `NEXT_PUBLIC_*` ships to every visitor, so keep secrets on a server. Server Functions are public HTTP endpoints: validate input and check authorisation inside each one, because hiding a button protects nothing.

## Labs

The labs run in the app. Each one below links to the live version.

### XSS sandbox

Try this:

- With **Image onerror** and **React text (escaped)** selected, look at the preview and the HTML box. The payload is text and nothing runs
- Switch to **Raw HTML**. The handler fires, the fake token is read, and the attempt to reach your app stays blocked by the sandbox
- Stay on **Raw HTML** and tick **Strict CSP in the preview**. The same HTML is in the page, but the handler is refused and the violations row names the directive
- Try **Sanitised HTML** with each payload, then try **Script tag** under **Raw HTML** and read why nothing runs

[Open the live lab](https://jdtoon.github.io/react-learn/modules/19-frontend-security#lab-xss-sandbox)

## Pitfalls

### Raw HTML from users or a CMS

- **Symptom:** A comment, profile or CMS field runs script for every visitor who views it
- **Cause:** `dangerouslySetInnerHTML` inserts the string as live markup, so any event handler or `javascript:` URL in it runs
- **Fix:** Render as text where you can. Where you must render HTML, sanitise it with a maintained allow-list library, and back it with a CSP

Bad:

```tsx
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
```

Good:

```tsx
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />
```

### Session tokens in localStorage

- **Symptom:** One XSS bug lets an attacker copy a long-lived token and use it from their own machine
- **Cause:** Any script on the page can read `localStorage` and `sessionStorage`
- **Fix:** Keep the token in an `HttpOnly`, `Secure`, `SameSite` cookie set by a BFF, and add CSRF protection for state-changing requests

Bad:

```tsx
localStorage.setItem('access_token', token);
```

Good:

```tsx
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
```

### User-controlled URLs in href

- **Symptom:** A profile link or redirect parameter opens `javascript:` or `data:` content when clicked
- **Cause:** The scheme comes from user input and the page renders it as a link without checking it
- **Fix:** Parse the URL and allow only `https:` and `mailto:`. Never build an `href` from unchecked input

Bad:

```tsx
<a href={profile.website}>Website</a>
```

Good:

```tsx
<a href={safeHttpUrl(profile.website)}>Website</a>
```

### Secrets in the bundle

- **Symptom:** An API key shows up in the shipped JavaScript, and in every browser cache
- **Cause:** Variables with a public prefix such as `VITE_` and `NEXT_PUBLIC_` are inlined at build time on purpose
- **Fix:** Keep the secret on a server and call it through your own endpoint. Rotate any key that has already shipped

### Installing whatever is newest

- **Symptom:** A build picks up a version published an hour ago, and a postinstall script runs
- **Cause:** No lockfile, loose ranges and install scripts enabled for every package
- **Fix:** Commit the lockfile, install with `--frozen-lockfile`, set a release-age gate and allow install scripts only for packages that need them

## In the meeting

**Say**

- React escapes text, so XSS needs an escape hatch: `dangerouslySetInnerHTML`, a user-controlled URL or a third-party script. Those are the places to review.
- We assume an injection will eventually happen, so tokens live in `HttpOnly` cookies behind a BFF and a CSP limits what injected code can do.
- Everything shipped to the browser is public. Secrets belong on the server.
- Our first defences against npm worms are the lockfile, frozen installs and a release-age gate.

**Ask**

- Where do we use `dangerouslySetInnerHTML`, and what sanitises that HTML?
- Where is the access token stored, and what can a script on the page read?
- Is our CSP enforcing, and does it use nonces instead of `unsafe-inline`?
- How soon can a newly published dependency version reach our build, and who may run install scripts?

**Red flags**

- Tokens or personal data in `localStorage`
- A hand-written HTML sanitiser, or a regex that strips `<script>`
- API keys in `VITE_` or `NEXT_PUBLIC_` variables
- CI that installs without a lockfile, or dependencies on `latest`

**Trade-off:** A strict CSP, a BFF and delayed dependency updates raise the cost of an attack and cost you flexibility: no inline scripts, more backend work and slower access to patches.

## Self-check

1. A comment containing `<img src=x onerror=...>` is rendered as `{comment}` in JSX. Does the handler run? What changes with `dangerouslySetInnerHTML`?

   <details>
   <summary>Answer</summary>

   It does not run: React escapes the string and shows it as text. Through `dangerouslySetInnerHTML` it becomes real markup and the handler runs with full access to the page, unless it is sanitised, blocked by a CSP or isolated in a sandboxed iframe. A `<script>` tag inserted that way does not run, which is why attackers use event handlers.

   </details>

2. Why is an `HttpOnly` cookie safer than `localStorage` for a session, and what does it cost?

   <details>
   <summary>Answer</summary>

   Script cannot read an `HttpOnly` cookie, so an XSS bug cannot copy the token, although injected code can still act as the user while the page is open. It brings back CSRF, which you handle with `SameSite` and anti-forgery tokens.

   </details>

3. What does a release-age gate protect against, and what does it not?

   <details>
   <summary>Answer</summary>

   It delays installs of brand-new versions, so most malicious releases are detected and pulled before they reach your build. It does not help against a package that was malicious for longer than the gate, so you still need a lockfile, review and a policy for install scripts.

   </details>

## Go deeper

- [React: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox)
- [pnpm settings](https://pnpm.io/settings)
