import { useSyncExternalStore } from 'react';
import { cn } from '../../kit/cn';
import { getVitals, subscribeVitals, type VitalName } from './vitals';

interface VitalSpec {
  name: VitalName;
  label: string;
  good: number;
  poor: number;
  format: (value: number) => string;
  waiting: string;
}

const specs: VitalSpec[] = [
  {
    name: 'lcp',
    label: 'LCP',
    good: 2500,
    poor: 4000,
    format: (value) => `${(value / 1000).toFixed(2)} s`,
    waiting: 'not reported yet',
  },
  {
    name: 'inp',
    label: 'INP',
    good: 200,
    poor: 500,
    format: (value) => `${Math.round(value)} ms`,
    waiting: 'no interaction yet',
  },
  {
    name: 'cls',
    label: 'CLS',
    good: 0.1,
    poor: 0.25,
    format: (value) => value.toFixed(3),
    waiting: 'not reported yet',
  },
];

type Rating = 'good' | 'needs improvement' | 'poor';

function rate(value: number, spec: VitalSpec): Rating {
  if (value <= spec.good) return 'good';
  if (value <= spec.poor) return 'needs improvement';
  return 'poor';
}

export function VitalsReadout() {
  const vitals = useSyncExternalStore(subscribeVitals, getVitals, getVitals);

  return (
    <section aria-label="This page, live" className="grid gap-2">
      <p className="eyebrow">This page, live (PerformanceObserver)</p>
      <dl className="grid gap-2 sm:grid-cols-3">
        {specs.map((spec) => {
          const value = vitals[spec.name];
          const supported = vitals.supported[spec.name];
          const rating = value === null ? null : rate(value, spec);
          return (
            <div
              key={spec.name}
              className="grid gap-0.5 rounded-lg border border-line bg-surface px-3 py-2"
            >
              <dt className="font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                {spec.label}
              </dt>
              <dd className="font-mono text-[1.05rem] tabular-nums" data-vital={spec.name}>
                {supported ? (value === null ? '--' : spec.format(value)) : 'n/a'}
              </dd>
              <dd
                className={cn(
                  'text-[0.74rem]',
                  rating === 'good' && 'tone-ok',
                  rating === 'needs improvement' && 'tone-warn',
                  rating === 'poor' && 'tone-bad',
                  rating === null && 'text-faint',
                )}
              >
                {!supported ? 'not supported here' : (rating ?? spec.waiting)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
