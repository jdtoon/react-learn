import type { RemoteDescriptor, RemoteManifest } from '@react-field-guide/mfe-contracts';
import { useEffect, useState, type CSSProperties } from 'react';
import { loadManifest } from './manifest';
import { RemoteSlot } from './RemoteSlot';
import { SlotFrame } from './SlotFrame';
import { storefrontSlots } from './slots';
import './storefront.css';

export type StorefrontControl = 'xray' | 'kill' | 'version' | 'isolation' | 'css-leak' | 'log';

export interface StorefrontProps {
  controls: StorefrontControl[];
}

type ManifestState =
  | { status: 'loading' }
  | { status: 'ready'; manifest: RemoteManifest }
  | { status: 'error'; message: string };

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

function liveDescriptor(manifest: RemoteManifest, slot: string): RemoteDescriptor | undefined {
  const id = manifest.live[slot];
  return id === undefined ? undefined : manifest.remotes.find((remote) => remote.id === id);
}

function summary(state: ManifestState): string {
  if (state.status === 'loading') return 'loading remotes';
  if (state.status === 'error') return 'no remotes loaded';
  const live = storefrontSlots.filter((slot) => liveDescriptor(state.manifest, slot.id)).length;
  return `loads ${live} ${live === 1 ? 'remote' : 'remotes'} · 1 shared React`;
}

export function Storefront({ controls }: StorefrontProps) {
  const manifest = useManifest();
  const [xray, setXray] = useState(false);
  const hasXray = controls.includes('xray');
  const hasPanel = controls.length > 0;

  return (
    <section className="storefront" data-panel={hasPanel ? 'true' : undefined}>
      <div className="sf-shell">
        <div className="sf-bar">
          <b>Course page (the host)</b>
          <span>{summary(manifest)}</span>
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
          <div className="sf-grid">
            {storefrontSlots.map((slot) => {
              const descriptor =
                manifest.status === 'ready'
                  ? liveDescriptor(manifest.manifest, slot.id)
                  : undefined;
              if (descriptor) {
                return <RemoteSlot key={slot.id} descriptor={descriptor} xray={xray} />;
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
