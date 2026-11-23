export type RenderMode = 'escaped' | 'raw' | 'sanitised';

export interface Preset {
  id: string;
  label: string;
  html: string;
  note: string;
}

export interface FrameEvent {
  source: 'rfg-xss-lab';
  nonce: string;
  kind: 'rendered' | 'executed' | 'csp';
  via?: string;
  token?: string;
  host?: string;
  directive?: string;
}

export const presets: Preset[] = [
  {
    id: 'image',
    label: 'Image onerror',
    html: `<img src=x onerror="__probe('img onerror')">`,
    note: 'A broken image fires its inline handler as soon as the markup is inserted.',
  },
  {
    id: 'svg',
    label: 'SVG onload',
    html: `<svg onload="__probe('svg onload')"></svg>`,
    note: 'Another handler that fires on insertion, with no user action.',
  },
  {
    id: 'link',
    label: 'javascript: link',
    html: `<a href="javascript:__probe('javascript: link')">Click for a prize</a>`,
    note: 'In an unsandboxed page this runs on click. Chromium refuses to run it inside this opaque-origin sandbox, so watch the sanitiser drop the href instead.',
  },
  {
    id: 'script',
    label: 'Script tag',
    html: `<script>__probe('script tag')</script>Hello`,
    note: 'Browsers do not run script elements inserted through innerHTML, so attackers use handlers instead.',
  },
  {
    id: 'benign',
    label: 'Benign HTML',
    html: `Great course, <b>thanks</b>! Read <a href="https://react.dev">the docs</a>.`,
    note: 'Harmless formatting. Escaping shows the tags as text, raw HTML renders them.',
  },
];

const allowedTags = new Set([
  'B',
  'I',
  'EM',
  'STRONG',
  'U',
  'P',
  'BR',
  'UL',
  'OL',
  'LI',
  'CODE',
  'A',
]);
const droppedTags = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'TEMPLATE',
  'NOSCRIPT',
]);
const safeProtocols = new Set(['http:', 'https:', 'mailto:']);

function isSafeHref(href: string): boolean {
  try {
    return safeProtocols.has(new URL(href, 'https://example.invalid/').protocol);
  } catch {
    return false;
  }
}

function copyAllowed(from: Node, into: Node): void {
  for (const child of Array.from(from.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      into.appendChild(document.createTextNode(child.textContent ?? ''));
      continue;
    }
    if (!(child instanceof Element)) continue;
    if (droppedTags.has(child.tagName)) continue;
    if (!allowedTags.has(child.tagName)) {
      copyAllowed(child, into);
      continue;
    }
    const copy = document.createElement(child.tagName.toLowerCase());
    const href = child.getAttribute('href');
    if (child.tagName === 'A' && href !== null && isSafeHref(href)) {
      copy.setAttribute('href', href);
      copy.setAttribute('rel', 'noopener noreferrer');
    }
    copyAllowed(child, copy);
    into.appendChild(copy);
  }
}

export function sanitise(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const output = document.createElement('div');
  copyAllowed(parsed.body, output);
  return output.innerHTML;
}

export function nonceFor(seed: string): string {
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(index);
  }
  return `n${(hash >>> 0).toString(36)}`;
}

function literal(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildDocument(html: string, nonce: string, strictCsp: boolean): string {
  const policy = strictCsp
    ? `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'">`
    : '';
  const script = [
    `const NONCE = ${literal(nonce)};`,
    `const HTML = ${literal(html)};`,
    `window.__token = 'demo-session-token-7f3a';`,
    `function send(message) { message.source = 'rfg-xss-lab'; message.nonce = NONCE; parent.postMessage(message, '*'); }`,
    `document.addEventListener('securitypolicyviolation', function (event) { send({ kind: 'csp', directive: event.violatedDirective }); });`,
    `window.__probe = function (via) {`,
    `  var host;`,
    `  try { host = 'reached: ' + String(parent.document.title); } catch (error) { host = 'blocked (' + error.name + ')'; }`,
    `  send({ kind: 'executed', via: via, token: window.__token, host: host });`,
    `};`,
    `document.getElementById('comment').innerHTML = HTML;`,
    `send({ kind: 'rendered' });`,
  ].join('\n');

  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    policy,
    '<style>body{margin:12px;font:14px/1.5 system-ui,sans-serif;color:#1f2937;background:#fff}a{color:#0b6b87}</style>',
    '</head><body><div id="comment"></div>',
    `<script nonce="${nonce}">`,
    script,
    '</script></body></html>',
  ].join('');
}
