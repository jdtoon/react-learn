import type { RemoteDescriptor } from '@react-field-guide/mfe-contracts';
import { Check, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Callout, CodePeek } from '../../kit';
import { cn } from '../../kit/cn';
import { loadManifest } from '../../mfe-host/manifest';
import { transferredBytes } from '../../mfe-host/RemoteSlot';
import { formatBytes } from '../../mfe-host/slots';
import { Storefront } from '../../mfe-host/Storefront';
import { StorefrontPlaceholder, useStorefrontLease } from './StorefrontLease';

type Range = '^19.0.0' | '^18.0.0' | '^19.4.0';
type Verdict = 'shared' | 'warned' | 'refused' | 'crash';

interface Settings {
  shared: boolean;
  range: Range;
  singleton: boolean;
  strict: boolean;
}

interface Outcome {
  verdict: Verdict;
  copies: 1 | 2;
  headline: string;
  detail: string;
  console: string | null;
  cost: string;
}

const hostVersion = '19.3.1';
const ranges: readonly Range[] = ['^19.0.0', '^18.0.0', '^19.4.0'];
const satisfied: Record<Range, boolean> = { '^19.0.0': true, '^18.0.0': false, '^19.4.0': false };

const verdictLabel: Record<Verdict, string> = {
  shared: 'Shared',
  warned: 'Shared, with a warning',
  refused: 'Refused to load',
  crash: 'Crashes on first hook',
};

const ownCopyCost =
  'A second React: about +8 KB for a components-only remote, about +219 KB if it also bundles a renderer.';

function negotiate({ shared, range, singleton, strict }: Settings): Outcome {
  const mismatch = `Version ${hostVersion} of shared singleton react does not satisfy the requirement of the remote, which needs ${range}`;
  if (!shared) {
    return {
      verdict: 'crash',
      copies: 2,
      headline: 'The remote bundled its own React',
      detail:
        'Its hooks run against a React that is not rendering this tree, so the first useState reads a null dispatcher. The remote loaded without a single error and then took the slot down.',
      console: "TypeError: Cannot read properties of null (reading 'useState')",
      cost: ownCopyCost,
    };
  }
  if (satisfied[range]) {
    return {
      verdict: 'shared',
      copies: 1,
      headline: `The host's React ${hostVersion} satisfies ${range}`,
      detail: singleton
        ? 'The share scope hands the remote the registered copy. One React, one dispatcher.'
        : 'It works, but without singleton a second registered version could be chosen later. Keep singleton on for React.',
      console: null,
      cost: 'No second copy. The remote adds only its own code.',
    };
  }
  if (singleton && !strict) {
    return {
      verdict: 'warned',
      copies: 1,
      headline: 'A singleton shares even when the range is not met',
      detail:
        'The runtime warns and still uses the host copy. The risk moves to runtime: the remote was built for an API the host may not have.',
      console: `Warning: ${mismatch}`,
      cost: 'No second copy.',
    };
  }
  if (singleton) {
    return {
      verdict: 'refused',
      copies: 1,
      headline: 'strictVersion turns the mismatch into an error',
      detail:
        "The remote fails to load, the host shows that slot's fallback, and the rest of the page keeps working. This is the safest failure.",
      console: `Error: ${mismatch}`,
      cost: 'No second copy, and no remote either.',
    };
  }
  return {
    verdict: 'crash',
    copies: 2,
    headline: 'No registered version satisfies the range',
    detail:
      'Without singleton the runtime looks for any registered version that fits, finds none and falls back to the copy bundled in the remote. That is a second React in the host tree.',
    console: "TypeError: Cannot read properties of null (reading 'useState')",
    cost: ownCopyCost,
  };
}

function configSnippet({ shared, range, singleton, strict }: Settings): string {
  if (!shared) return 'shared: {}';
  const entry = `{ singleton: ${singleton}, strictVersion: ${strict}, requiredVersion: '${range}' }`;
  return `shared: {\n  react: ${entry},\n  'react-dom': ${entry},\n}`;
}

function Toggle({
  label,
  pressed,
  onToggle,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="kit-btn" aria-pressed={pressed} onClick={onToggle}>
      {label}
    </button>
  );
}

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === 'shared') return <Check aria-hidden="true" size={16} className="tone-ok" />;
  if (verdict === 'crash') return <X aria-hidden="true" size={16} className="tone-bad" />;
  return <TriangleAlert aria-hidden="true" size={16} className="tone-warn" />;
}

function Negotiation() {
  const [settings, setSettings] = useState<Settings>({
    shared: true,
    range: '^19.0.0',
    singleton: true,
    strict: false,
  });
  const outcome = negotiate(settings);

  function change(patch: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="grid gap-3">
      <p className="text-[0.9rem] text-muted">
        The host registers React <code className="kit-inline-code">{hostVersion}</code>. Change what
        the remote asks for.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          label="shared: react"
          pressed={settings.shared}
          onToggle={() => change({ shared: !settings.shared })}
        />
        <Toggle
          label="singleton"
          pressed={settings.singleton}
          onToggle={() => change({ singleton: !settings.singleton })}
        />
        <Toggle
          label="strictVersion"
          pressed={settings.strict}
          onToggle={() => change({ strict: !settings.strict })}
        />
        <div role="group" aria-label="requiredVersion" className="kit-seg">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={settings.range === range}
              onClick={() => change({ range })}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-label="Negotiation result"
        data-verdict={outcome.verdict}
        data-copies={outcome.copies}
        className="grid gap-2 rounded-lg border border-line bg-surface p-3"
      >
        <p className="flex flex-wrap items-center gap-2 font-display font-semibold">
          <VerdictIcon verdict={outcome.verdict} />
          {verdictLabel[outcome.verdict]}
          <span className="font-mono text-[0.78rem] font-normal text-muted">
            React copies on the page: {outcome.copies}
          </span>
        </p>
        <p className="text-[0.9rem]">{outcome.headline}</p>
        <p className="text-[0.88rem] text-muted">{outcome.detail}</p>
        {outcome.console && (
          <code
            className={cn(
              'block break-words rounded-md bg-surface-2 px-2 py-1.5 font-mono text-[0.78rem]',
              outcome.verdict === 'warned' ? 'tone-warn' : 'tone-bad',
            )}
          >
            {outcome.console}
          </code>
        )}
        <p className="text-[0.84rem] text-muted">{outcome.cost}</p>
      </div>

      <CodePeek title="Remote vite.config.ts" lang="ts" code={configSnippet(settings)} />
    </div>
  );
}

interface Build {
  label: string;
  descriptor: RemoteDescriptor;
}

interface Reading {
  bytes: number;
  loaded: boolean;
}

function hasLoaded(url: string): boolean {
  const prefix = url.slice(0, url.lastIndexOf('/') + 1);
  return performance.getEntriesByType('resource').some((entry) => entry.name.startsWith(prefix));
}

function useBuilds(): { builds: Build[]; transferred: Record<string, Reading> } {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [transferred, setTransferred] = useState<Record<string, Reading>>({});

  useEffect(() => {
    let active = true;
    loadManifest().then(
      (manifest) => {
        if (!active) return;
        const pick = (id: string, label: string): Build[] => {
          const descriptor = manifest.remotes.find((remote) => remote.id === id);
          return descriptor ? [{ label, descriptor }] : [];
        };
        setBuilds([
          ...pick('react-recs-v1', 'Shared React'),
          ...pick('react-recs-isolated', 'Own React'),
        ]);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (builds.length === 0) return;
    const read = () => {
      const next = Object.fromEntries(
        builds.map(({ descriptor }) => [
          descriptor.id,
          { bytes: transferredBytes(descriptor.url), loaded: hasLoaded(descriptor.url) },
        ]),
      );
      setTransferred((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    read();
    const timer = setInterval(read, 600);
    return () => clearInterval(timer);
  }, [builds]);

  return { builds, transferred };
}

function Bytes() {
  const { builds, transferred } = useBuilds();
  if (builds.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="eyebrow">Recommendations, measured on this page</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-[0.86rem]">
          <thead className="text-[0.74rem] uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="py-1 pr-3 font-medium">Build</th>
              <th className="py-1 pr-3 font-medium">Emitted (manifest)</th>
              <th className="py-1 font-medium">Transferred (resource timing)</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {builds.map(({ label, descriptor }) => {
              const reading = transferred[descriptor.id];
              const bytes = reading?.bytes ?? 0;
              return (
                <tr key={descriptor.id} data-build={descriptor.id} className="border-t border-line">
                  <th scope="row" className="py-1.5 pr-3 text-left font-body font-medium">
                    {label}
                  </th>
                  <td className="py-1.5 pr-3">
                    {descriptor.bytes === undefined ? 'dev server' : formatBytes(descriptor.bytes)}
                  </td>
                  <td className="py-1.5">
                    {bytes > 0
                      ? formatBytes(bytes)
                      : reading?.loaded
                        ? 'hidden by cross-origin dev server'
                        : 'not loaded yet'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Callout tone="insight" title="Sharing is for correctness">
        For a remote that only exposes components, sharing saved a few KB. The saving appears when a
        remote would otherwise bundle a renderer: <code className="kit-inline-code">react</code>{' '}
        plus <code className="kit-inline-code">react-dom/client</code> is about 219 KB, 68 KB
        gzipped.
      </Callout>
    </div>
  );
}

export function SharedDepsLab() {
  const lease = useStorefrontLease('shared-deps', false);

  return (
    <div className="grid gap-5">
      <Negotiation />
      <Bytes />
      {lease.active ? (
        <Storefront controls={['isolation', 'xray']} />
      ) : (
        <StorefrontPlaceholder onRun={lease.claim} />
      )}
    </div>
  );
}
