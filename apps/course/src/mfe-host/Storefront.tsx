import {
  getSubscribers,
  type RemoteDescriptor,
  type RemoteManifest,
} from '@react-field-guide/mfe-contracts';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BusLog } from './BusLog';
import { loadManifest } from './manifest';
import { RemoteSlot, type SlotMeasure } from './RemoteSlot';
import { SlotFrame } from './SlotFrame';
import { formatBytes, storefrontSlots } from './slots';
import { ComponentVariantContext, type ComponentVariant } from './variant';
import './storefront.css';

export type StorefrontControl = 'xray' | 'kill' | 'version' | 'isolation' | 'css-leak' | 'log';

export interface StorefrontProps {
  controls: StorefrontControl[];
}

type ManifestState =
  | { status: 'loading' }
  | { status: 'ready'; manifest: RemoteManifest }
  | { status: 'error'; message: string };

type RecsVersion = 'v1' | 'v2';

const legend = [
  { framework: 'react', label: 'React · Module Federation' },
  { framework: 'vue', label: 'Vue · web component' },
  { framework: 'svelte', label: 'Svelte · web component' },
  { framework: 'angular', label: 'Angular · web component' },
  { framework: 'plain', label: 'iframe' },
] as const;

const explainOff = "With X-ray off, the page looks like one app. That's the point.";
const explainOn =
  'Each dashed box is a separate app owned by a separate team, built and deployed on its own schedule. Colour shows framework and integration style.';

const leakStyleId = 'rfg-css-leak';
const leakStyles = `.storefront .slot-body :is(h3, h4, p, li, span, strong, label, a, button, input, code) {
  font-family: Georgia, 'Times New Roman', serif !important;
  color: crimson !important;
  letter-spacing: 0.04em !important;
}`;

const recsVersions: readonly RecsVersion[] = ['v1', 'v2'];
const isolatedRecsId = 'react-recs-isolated';
const killedEntry = `data:text/javascript,${encodeURIComponent(
  'throw new Error("The remote stopped responding (killed from the lab)");',
)}`;

function useManifest(): ManifestState {
  const [state, setState] = useState<ManifestState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    loadManifest().then(
      (manifest) => {
        if (active) setState({ status: 'ready', manifest });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return state;
}

function useRecsSubscribers(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const read = () => setCount(getSubscribers('cart:updated').filter((n) => n === 'recs').length);
    const timer = setInterval(read, 250);
    return () => clearInterval(timer);
  }, [enabled]);

  return count;
}

function liveDescriptor(manifest: RemoteManifest, slot: string): RemoteDescriptor | undefined {
  const id = manifest.live[slot];
  return id === undefined ? undefined : manifest.remotes.find((remote) => remote.id === id);
}

function summary(state: ManifestState, copies: number): string {
  if (state.status === 'loading') return 'loading remotes';
  if (state.status === 'error') return 'no remotes loaded';
  const live = storefrontSlots.filter((slot) => liveDescriptor(state.manifest, slot.id)).length;
  const react = copies === 1 ? '1 shared React' : `${copies} React copies`;
  return `loads ${live} ${live === 1 ? 'remote' : 'remotes'} · ${react}`;
}

interface Switches {
  version: RecsVersion | null;
  isolated: boolean;
  killed: ReadonlySet<string>;
}

function resolveDescriptor(
  manifest: RemoteManifest,
  slot: string,
  switches: Switches,
): RemoteDescriptor | undefined {
  let descriptor = liveDescriptor(manifest, slot);
  if (slot === 'recs' && (switches.version !== null || switches.isolated)) {
    const id = switches.isolated ? isolatedRecsId : `react-recs-${switches.version ?? 'v1'}`;
    descriptor = manifest.remotes.find((remote) => remote.id === id) ?? descriptor;
  }
  if (descriptor && switches.killed.has(slot)) return { ...descriptor, url: killedEntry };
  return descriptor;
}

export function Storefront({ controls }: StorefrontProps) {
  const manifest = useManifest();
  const [xray, setXray] = useState(false);
  const [recsVersion, setRecsVersion] = useState<RecsVersion>('v1');
  const [isolated, setIsolated] = useState(false);
  const [killed, setKilled] = useState<ReadonlySet<string>>(new Set());
  const [measures, setMeasures] = useState<Record<string, SlotMeasure>>({});
  const [leak, setLeak] = useState(false);
  const [variant, setVariant] = useState<ComponentVariant>('shadow');

  const hasXray = controls.includes('xray');
  const hasKill = controls.includes('kill');
  const hasVersion = controls.includes('version');
  const hasIsolation = controls.includes('isolation');
  const hasLog = controls.includes('log');
  const hasLeak = controls.includes('css-leak');
  const hasPanel = controls.length > 0;

  const onMeasure = useCallback((slot: string, measure: SlotMeasure | null) => {
    setMeasures((previous) => {
      if (measure) return { ...previous, [slot]: measure };
      return Object.fromEntries(Object.entries(previous).filter(([key]) => key !== slot));
    });
  }, []);

  const recsSubscribers = useRecsSubscribers(hasVersion || hasIsolation);

  useEffect(() => {
    if (!hasLeak || !leak) return;
    const style = document.createElement('style');
    style.id = leakStyleId;
    style.textContent = leakStyles;
    document.head.append(style);
    return () => style.remove();
  }, [hasLeak, leak]);

  const descriptors = useMemo(() => {
    const switches: Switches = {
      version: hasVersion ? recsVersion : null,
      isolated: hasIsolation && isolated,
      killed: hasKill ? killed : new Set(),
    };
    const map = new Map<string, RemoteDescriptor>();
    if (manifest.status !== 'ready') return map;
    for (const slot of storefrontSlots) {
      const descriptor = resolveDescriptor(manifest.manifest, slot.id, switches);
      if (descriptor) map.set(slot.id, descriptor);
    }
    return map;
  }, [manifest, hasVersion, hasIsolation, hasKill, recsVersion, isolated, killed]);

  const copies = 1 + Object.values(measures).filter((m) => m.identity === 'different').length;
  const recsMeasure = measures['recs'];

  function toggleKill(slot: string) {
    setKilled((previous) => {
      const next = new Set(previous);
      if (!next.delete(slot)) next.add(slot);
      return next;
    });
  }

  const killable = storefrontSlots.filter((slot) => descriptors.has(slot.id));

  return (
    <section className="storefront" data-panel={hasPanel ? 'true' : undefined}>
      <div className="sf-shell">
        <div className="sf-bar">
          <b>Course page (the host)</b>
          <span>{summary(manifest, copies)}</span>
        </div>
        {manifest.status === 'error' ? (
          <div role="status" className="sf-error">
            <p>
              <strong>The remote manifest could not be loaded.</strong> No remotes are available,
              and the rest of the course is unaffected.
            </p>
            <p className="slot-reason">{manifest.message}</p>
          </div>
        ) : (
          <ComponentVariantContext value={hasLeak ? variant : 'shadow'}>
            <div className="sf-grid">
              {storefrontSlots.map((slot) => {
                const descriptor = descriptors.get(slot.id);
                if (descriptor) {
                  return (
                    <RemoteSlot
                      key={slot.id}
                      descriptor={descriptor}
                      xray={xray}
                      onMeasure={onMeasure}
                      {...(slot.id === 'recs' && hasVersion ? { version: recsVersion } : {})}
                    />
                  );
                }
                const loading = manifest.status === 'loading';
                return (
                  <SlotFrame
                    key={slot.id}
                    slot={slot.id}
                    title={slot.title}
                    xray={xray}
                    state={loading ? 'loading' : 'empty'}
                  >
                    <p className="slot-note">{loading ? 'Loading' : 'Not built yet'}</p>
                  </SlotFrame>
                );
              })}
            </div>
          </ComponentVariantContext>
        )}
      </div>

      {hasPanel && (
        <aside className="sf-panel" aria-label="Lab controls">
          <div className="sf-group">
            <span className="eyebrow">Lab controls</span>
            <div className="sf-controls">
              {hasXray && (
                <button
                  type="button"
                  className="kit-btn"
                  aria-pressed={xray}
                  onClick={() => setXray((value) => !value)}
                >
                  X-ray
                </button>
              )}
            </div>
            {hasXray && (
              <p className="sf-explain" aria-live="polite">
                {xray ? explainOn : explainOff}
              </p>
            )}
          </div>

          {hasKill && (
            <div className="sf-group" data-control="kill">
              <span className="eyebrow">Kill a remote</span>
              <div className="sf-controls">
                {killable.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className="kit-btn"
                    data-killed={killed.has(slot.id) ? 'true' : 'false'}
                    onClick={() => toggleKill(slot.id)}
                  >
                    {killed.has(slot.id) ? `Restore ${slot.title}` : `Kill ${slot.title}`}
                  </button>
                ))}
              </div>
              <p className="sf-explain">
                Points the slot at a broken URL. The host shows that slot&apos;s fallback and
                everything else keeps working.
              </p>
            </div>
          )}

          {hasVersion && (
            <div className="sf-group" data-control="version">
              <span className="eyebrow">Recommendations version</span>
              <div className="sf-controls">
                {recsVersions.map((version) => (
                  <button
                    key={version}
                    type="button"
                    className="kit-btn"
                    aria-pressed={recsVersion === version}
                    onClick={() => setRecsVersion(version)}
                  >
                    {version}
                  </button>
                ))}
              </div>
              <p className="sf-explain" data-recs-subscribers={recsSubscribers} aria-live="polite">
                Recs listeners on cart:updated: {recsSubscribers}. Switching versions swaps the
                remote without reloading the page, and the old one lets go of its listener.
              </p>
            </div>
          )}

          {hasIsolation && (
            <div className="sf-group" data-control="isolation">
              <span className="eyebrow">Recommendations isolation</span>
              <div className="sf-controls">
                <button
                  type="button"
                  className="kit-btn"
                  aria-pressed={!isolated}
                  onClick={() => setIsolated(false)}
                >
                  Shared React
                </button>
                <button
                  type="button"
                  className="kit-btn"
                  aria-pressed={isolated}
                  onClick={() => setIsolated(true)}
                >
                  Own React
                </button>
              </div>
              <dl className="sf-stats">
                <div>
                  <dt>React copies on page</dt>
                  <dd data-stat="react-copies">{copies}</dd>
                </div>
                <div>
                  <dt>Recommendations transferred</dt>
                  <dd data-stat="recs-bytes">
                    {recsMeasure ? formatBytes(recsMeasure.bytes) : 'not loaded'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {hasLeak && (
            <div className="sf-group" data-control="css-leak">
              <span className="eyebrow">CSS isolation</span>
              <div className="sf-controls">
                <button
                  type="button"
                  className="kit-btn"
                  aria-pressed={leak}
                  onClick={() => setLeak((value) => !value)}
                >
                  CSS leak
                </button>
              </div>
              <div className="sf-controls" role="group" aria-label="Web component variant">
                <button
                  type="button"
                  className="kit-btn"
                  aria-pressed={variant === 'shadow'}
                  onClick={() => setVariant('shadow')}
                >
                  Shadow DOM
                </button>
                <button
                  type="button"
                  className="kit-btn"
                  aria-pressed={variant === 'light'}
                  onClick={() => setVariant('light')}
                >
                  Light DOM
                </button>
              </div>
              <p className="sf-explain" data-leak={leak ? 'on' : 'off'} aria-live="polite">
                {leak
                  ? 'A global stylesheet now restyles every heading, paragraph and button on the page. Light DOM remotes take it. Shadow roots, the Angular element and the iframe do not.'
                  : 'Turn the leak on, then switch the Vue and Svelte web components between shadow and light DOM to see when the host stylesheet can reach them.'}
              </p>
            </div>
          )}

          {hasLog && (
            <div className="sf-group" data-control="log">
              <span className="eyebrow">Event bus log</span>
              <BusLog />
            </div>
          )}

          <ul className="sf-legend" aria-label="Framework colours">
            {legend.map((entry) => (
              <li
                key={entry.framework}
                style={{ '--fc': `var(--${entry.framework})` } as CSSProperties}
              >
                <i aria-hidden="true" />
                {entry.label}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}
