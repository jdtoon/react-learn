import { useId, useState, type CSSProperties } from 'react';
import { Callout } from '../../kit';
import { cn } from '../../kit/cn';

type Theme = 'light' | 'dark';

interface PrimitiveSpec {
  name: string;
  lightness: number;
  chroma: number;
}

interface ComponentToken {
  id: string;
  label: string;
  target: string;
}

const primitiveSpecs: PrimitiveSpec[] = [
  { name: 'gray-0', lightness: 1, chroma: 0 },
  { name: 'gray-50', lightness: 0.98, chroma: 0.006 },
  { name: 'gray-200', lightness: 0.9, chroma: 0.01 },
  { name: 'gray-400', lightness: 0.7, chroma: 0.015 },
  { name: 'gray-600', lightness: 0.5, chroma: 0.02 },
  { name: 'gray-700', lightness: 0.4, chroma: 0.025 },
  { name: 'gray-900', lightness: 0.22, chroma: 0.03 },
  { name: 'gray-950', lightness: 0.16, chroma: 0.03 },
  { name: 'brand-100', lightness: 0.94, chroma: 0.04 },
  { name: 'brand-300', lightness: 0.82, chroma: 0.09 },
  { name: 'brand-400', lightness: 0.74, chroma: 0.13 },
  { name: 'brand-600', lightness: 0.52, chroma: 0.19 },
  { name: 'brand-700', lightness: 0.45, chroma: 0.17 },
  { name: 'brand-900', lightness: 0.28, chroma: 0.08 },
];

const semanticMap: Record<Theme, Record<string, string>> = {
  light: {
    'color-bg': 'gray-50',
    'color-surface': 'gray-0',
    'color-text': 'gray-900',
    'color-muted': 'gray-600',
    'color-border': 'gray-200',
    'color-action': 'brand-600',
    'color-on-action': 'gray-0',
    'color-soft': 'brand-100',
    'color-soft-text': 'brand-700',
  },
  dark: {
    'color-bg': 'gray-950',
    'color-surface': 'gray-900',
    'color-text': 'gray-50',
    'color-muted': 'gray-400',
    'color-border': 'gray-700',
    'color-action': 'brand-400',
    'color-on-action': 'gray-950',
    'color-soft': 'brand-900',
    'color-soft-text': 'brand-300',
  },
};

const componentTokens: ComponentToken[] = [
  { id: 'button-bg', label: 'Button background', target: 'color-action' },
  { id: 'button-fg', label: 'Button label', target: 'color-on-action' },
  { id: 'card-bg', label: 'Card background', target: 'color-surface' },
  { id: 'card-border', label: 'Card border', target: 'color-border' },
  { id: 'badge-bg', label: 'Badge background', target: 'color-soft' },
  { id: 'badge-fg', label: 'Badge text', target: 'color-soft-text' },
  { id: 'link-fg', label: 'Link colour', target: 'color-action' },
];

const traced = ['button-bg', 'card-bg', 'link-fg'];
const radii = [0, 4, 8, 16];
const bypassedPrimitive = 'brand-600';

function primitiveValue(spec: PrimitiveSpec, hue: number): string {
  return `oklch(${spec.lightness} ${spec.chroma} ${hue})`;
}

function findPrimitive(name: string): PrimitiveSpec {
  return primitiveSpecs.find((spec) => spec.name === name) ?? primitiveSpecs[0]!;
}

function buildVariables(hue: number, theme: Theme, radius: number, bypass: boolean): CSSProperties {
  const vars: Record<string, string> = {
    '--radius-md': `${radius}px`,
    '--radius-lg': `${Math.round(radius * 1.5)}px`,
    '--button-radius': 'var(--radius-md)',
    '--input-radius': 'var(--radius-md)',
    '--card-radius': 'var(--radius-lg)',
  };
  for (const spec of primitiveSpecs) vars[`--${spec.name}`] = primitiveValue(spec, hue);
  for (const [name, primitive] of Object.entries(semanticMap[theme])) {
    vars[`--${name}`] = `var(--${primitive})`;
  }
  for (const token of componentTokens) vars[`--${token.id}`] = `var(--${token.target})`;
  if (bypass) vars['--button-bg'] = `var(--${bypassedPrimitive})`;
  return vars as CSSProperties;
}

export function TokenPlaygroundLab() {
  const [hue, setHue] = useState(250);
  const [theme, setTheme] = useState<Theme>('light');
  const [radius, setRadius] = useState(8);
  const [bypass, setBypass] = useState(false);
  const [traceId, setTraceId] = useState('button-bg');
  const hueId = useId();

  const vars = buildVariables(hue, theme, radius, bypass);
  const token = componentTokens.find((item) => item.id === traceId) ?? componentTokens[0]!;
  const skipped = bypass && token.id === 'button-bg';
  const primitiveName = skipped ? bypassedPrimitive : (semanticMap[theme][token.target] ?? '');
  const chain = [
    { layer: 'Component', name: `--${token.id}` },
    { layer: 'Semantic', name: skipped ? 'skipped' : `--${token.target}` },
    { layer: 'Primitive', name: `--${primitiveName}` },
    { layer: 'Value', name: primitiveValue(findPrimitive(primitiveName), hue) },
  ];

  return (
    <div className="grid gap-4" style={vars}>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label htmlFor={hueId} className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">{`Brand hue: ${hue}`}</span>
          <input
            id={hueId}
            type="range"
            min={0}
            max={360}
            step={5}
            value={hue}
            onChange={(event) => setHue(Number(event.target.value))}
            className="w-56 max-w-full accent-(--accent)"
          />
        </label>
        <div className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">Theme</span>
          <div role="group" aria-label="Theme" className="kit-seg">
            {(['light', 'dark'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={theme === item}
                onClick={() => setTheme(item)}
              >
                {item === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5 text-[0.88rem]">
          <span className="text-muted">Corner radius</span>
          <div role="group" aria-label="Corner radius" className="kit-seg">
            {radii.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={radius === item}
                onClick={() => setRadius(item)}
              >
                {`${item} px`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-muted">
        <input
          type="checkbox"
          className="kit-check mt-0"
          checked={bypass}
          onChange={(event) => setBypass(event.target.checked)}
        />
        Button reads a primitive directly
      </label>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div
          data-sample
          className="grid content-start gap-3 rounded-xl border border-line p-4"
          style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.09em] opacity-70">
            Sample UI
          </p>
          <article
            className="grid gap-3 border p-4"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              borderRadius: 'var(--card-radius)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[1.05rem]">Team plan</h4>
              <span
                className="px-2 py-0.5 text-[0.72rem] font-medium"
                style={{
                  background: 'var(--badge-bg)',
                  color: 'var(--badge-fg)',
                  borderRadius: 'var(--button-radius)',
                }}
              >
                Popular
              </span>
            </div>
            <p className="text-[0.86rem]" style={{ color: 'var(--color-muted)' }}>
              Shared dashboards, audit logs and a single bill for the whole team.
            </p>
            <label className="grid gap-1 text-[0.82rem]">
              <span style={{ color: 'var(--color-muted)' }}>Work email</span>
              <input
                type="email"
                placeholder="you@example.com"
                className="h-9 border px-3 text-[0.88rem] focus-visible:outline-2 focus-visible:outline-(color:--color-action)"
                style={{
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--card-border)',
                  borderRadius: 'var(--input-radius)',
                }}
              />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="h-9 px-4 text-[0.88rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--color-action)"
                style={{
                  background: 'var(--button-bg)',
                  color: 'var(--button-fg)',
                  borderRadius: 'var(--button-radius)',
                }}
              >
                Start trial
              </button>
              <a
                href="#plans"
                onClick={(event) => event.preventDefault()}
                className="text-[0.88rem] font-medium underline"
                style={{ color: 'var(--link-fg)' }}
              >
                Compare plans
              </a>
            </div>
          </article>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <section aria-label="Primitive tokens" className="grid gap-2">
            <p className="eyebrow">Primitives</p>
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {primitiveSpecs.map((spec) => (
                <li key={spec.name} className="grid gap-1">
                  <span
                    aria-hidden="true"
                    className="h-6 rounded-md border border-line"
                    style={{ background: `var(--${spec.name})` }}
                  />
                  <span className="font-mono text-[0.62rem] leading-tight text-muted">
                    {spec.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Semantic tokens" className="grid gap-2">
            <p className="eyebrow">{`Semantic (${theme})`}</p>
            <ul className="grid gap-1">
              {Object.entries(semanticMap[theme]).map(([name, primitive]) => (
                <li key={name} className="flex items-center gap-2 font-mono text-[0.74rem]">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded border border-line"
                    style={{ background: `var(--${name})` }}
                  />
                  <span className="min-w-0 flex-1 truncate">{`--${name}`}</span>
                  <span className="text-muted">{primitive}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Token trace" className="grid gap-2">
            <p className="eyebrow">Trace a component token</p>
            <div role="group" aria-label="Token to trace" className="kit-seg justify-self-start">
              {traced.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={traceId === id}
                  onClick={() => setTraceId(id)}
                >
                  {componentTokens.find((item) => item.id === id)?.label}
                </button>
              ))}
            </div>
            <ol aria-label="Resolution chain" className="grid gap-1.5 sm:grid-cols-4">
              {chain.map((step) => (
                <li
                  key={step.layer}
                  className={cn(
                    'grid min-w-0 gap-0.5 rounded-lg border border-line bg-surface px-2.5 py-1.5',
                    step.name === 'skipped' && 'border-dashed',
                  )}
                >
                  <span className="font-mono text-[0.64rem] uppercase tracking-[0.08em] text-muted">
                    {step.layer}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[0.74rem] [overflow-wrap:anywhere]',
                      step.name === 'skipped' && 'tone-bad',
                    )}
                  >
                    {step.name}
                  </span>
                </li>
              ))}
            </ol>
            {skipped && (
              <Callout tone="warn" title="Contract bypassed">
                The button reads a primitive, so changing the semantic layer no longer reaches it.
              </Callout>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
