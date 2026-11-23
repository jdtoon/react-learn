import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Callout, CodePeek } from '../../kit';
import { cn } from '../../kit/cn';
import {
  buildDocument,
  nonceFor,
  presets,
  sanitise,
  type FrameEvent,
  type RenderMode,
} from './xssDocument';

const modes: { id: RenderMode; label: string; summary: string }[] = [
  {
    id: 'escaped',
    label: 'React text (escaped)',
    summary: 'The comment is rendered as a JSX value, so React turns it into text.',
  },
  {
    id: 'raw',
    label: 'Raw HTML',
    summary: 'The comment goes in through dangerouslySetInnerHTML, exactly as typed.',
  },
  {
    id: 'sanitised',
    label: 'Sanitised HTML',
    summary:
      'The comment is rebuilt from an allow-list of tags and safe links first. A toy version of what DOMPurify does.',
  },
];

function toHtml(mode: RenderMode, payload: string): string {
  if (mode === 'escaped') return renderToStaticMarkup(<>{payload}</>);
  if (mode === 'sanitised') return sanitise(payload);
  return payload;
}

function isFrameEvent(value: unknown): value is FrameEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { source?: unknown }).source === 'rfg-xss-lab'
  );
}

function Row({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="grid gap-0.5 border-b border-line py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-3">
      <dt className="text-[0.84rem] text-muted">{label}</dt>
      <dd className={cn('font-mono text-[0.8rem] break-words', bad && 'tone-bad')}>{value}</dd>
    </div>
  );
}

export function XssLab() {
  const [payload, setPayload] = useState(presets[0]?.html ?? '');
  const [mode, setMode] = useState<RenderMode>('escaped');
  const [strictCsp, setStrictCsp] = useState(false);
  const [replay, setReplay] = useState(0);
  const [events, setEvents] = useState<FrameEvent[]>([]);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(() => toHtml(mode, payload), [mode, payload]);
  const nonce = nonceFor(`${mode}|${strictCsp}|${replay}|${payload}`);
  const doc = useMemo(() => buildDocument(html, nonce, strictCsp), [html, nonce, strictCsp]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isFrameEvent(event.data)) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      setEvents((current) => [...current, message].slice(-40));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const visible = events.filter((event) => event.nonce === nonce);
  const executed = visible.find((event) => event.kind === 'executed');
  const violations = visible.filter((event) => event.kind === 'csp');
  const rendered = visible.some((event) => event.kind === 'rendered');
  const violationNames = [...new Set(violations.map((event) => event.directive ?? 'unknown'))];
  const activeMode = modes.find((item) => item.id === mode);
  const activePreset = presets.find((preset) => preset.html === payload);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="eyebrow">Untrusted comment</p>
        <div role="group" aria-label="Payload presets" className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="kit-btn"
              aria-pressed={payload === preset.html}
              onClick={() => setPayload(preset.html)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-[0.84rem] text-muted">
          <span className="sr-only">Comment HTML</span>
          <textarea
            value={payload}
            rows={2}
            spellCheck={false}
            onChange={(event) => setPayload(event.target.value)}
            className="w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[0.8rem] text-fg"
          />
        </label>
        {activePreset && <p className="text-[0.84rem] text-muted">{activePreset.note}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Render mode" className="kit-seg">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[0.86rem]">
          <input
            type="checkbox"
            checked={strictCsp}
            onChange={(event) => setStrictCsp(event.target.checked)}
          />
          Strict CSP in the preview
        </label>
        <button type="button" className="kit-btn" onClick={() => setReplay((count) => count + 1)}>
          Replay
        </button>
      </div>
      <p className="text-[0.86rem] text-muted">{activeMode?.summary}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <p className="eyebrow">Preview, sandboxed</p>
          <iframe
            key={nonce}
            ref={frameRef}
            title="Untrusted comment preview"
            sandbox="allow-scripts"
            srcDoc={doc}
            className="h-32 w-full rounded-lg border border-line bg-white"
          />
          <p className="font-mono text-[0.72rem] text-muted">
            {'sandbox="allow-scripts"  (no allow-same-origin)'}
          </p>
        </div>

        <div className="grid content-start gap-1.5">
          <p className="eyebrow">What the attacker got</p>
          <dl aria-label="Attack outcome" className="border-t border-line">
            <Row
              label="Attacker code ran in the preview"
              value={
                executed ? `yes, via ${executed.via ?? 'unknown'}` : rendered ? 'no' : 'waiting'
              }
              bad={Boolean(executed)}
            />
            <Row
              label="Read the page secret (window.__token)"
              value={executed?.token ?? 'no'}
              bad={Boolean(executed?.token)}
            />
            <Row label="Reached your app (parent.document)" value={executed?.host ?? 'no'} />
            <Row
              label="CSP violations"
              value={violationNames.length > 0 ? violationNames.join(', ') : 'none'}
            />
          </dl>
        </div>
      </div>

      <CodePeek code={html || ' '} lang="html" title="The HTML handed to innerHTML" defaultOpen />

      <Callout tone="info" title="Why the iframe is safe to attack">
        The preview runs scripts so the attack is visible, but without{' '}
        <code>allow-same-origin</code> it gets an opaque origin. It cannot read your storage or DOM,
        which is why the last row stays blocked. The secret it steals is a fake value that lives
        inside the preview itself.
      </Callout>
    </div>
  );
}
