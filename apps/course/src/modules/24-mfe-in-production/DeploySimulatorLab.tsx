import { useEffect, useRef, useState } from 'react';
import { CodePeek, Meter } from '../../kit';
import { cn } from '../../kit/cn';
import { Storefront } from '../../mfe-host/Storefront';
import { StorefrontPlaceholder, useStorefrontLease } from './StorefrontLease';

type Version = 'v1' | 'v2';

interface LogLine {
  id: number;
  minute: number;
  text: string;
}

interface State {
  percent: number;
  buggy: boolean;
  minute: number;
  edits: number;
  log: LogLine[];
}

const youBucket = 23;
const buckets = [
  youBucket,
  ...Array.from({ length: 40 }, (_, index) => (37 * (index + 1) + 11) % 100),
];
const ramps = [5, 25, 50, 100];
const healthyRate = 0.4;
const buggyRate = 14;
const warnAt = 1;
const rollbackAt = 2;

function versionFor(bucket: number, percent: number): Version {
  return bucket < percent ? 'v2' : 'v1';
}

function errorRate(percent: number, buggy: boolean): number {
  const onV2 = buckets.filter((bucket) => versionFor(bucket, percent) === 'v2').length;
  const share = onV2 / buckets.length;
  return share * (buggy ? buggyRate : healthyRate) + (1 - share) * healthyRate;
}

function manifestFor(percent: number): string {
  if (percent <= 0) return `{\n  "live": { "recs": "react-recs-v1" }\n}`;
  if (percent >= 100) return `{\n  "live": { "recs": "react-recs-v2" }\n}`;
  return `{\n  "live": {\n    "recs": {\n      "stable": "react-recs-v1",\n      "canary": { "id": "react-recs-v2", "percent": ${percent} }\n    }\n  }\n}`;
}

function gate(percent: number, rate: number): { tone: 'ok' | 'warn' | 'bad'; text: string } {
  if (percent === 0) return { tone: 'ok', text: 'No canary is running. Everyone is on v1.' };
  const shown = rate.toFixed(1);
  if (rate >= rollbackAt) {
    return {
      tone: 'bad',
      text: `Gate failed: ${shown}% errors is over the ${rollbackAt}% budget. Roll back.`,
    };
  }
  if (rate >= warnAt) {
    return {
      tone: 'warn',
      text: `Warning: ${shown}% errors is above ${warnAt}%. Hold here and investigate.`,
    };
  }
  return { tone: 'ok', text: `Healthy: ${shown}% errors is inside the budget. Safe to widen.` };
}

const initial: State = { percent: 0, buggy: true, minute: 0, edits: 0, log: [] };

function stamp(state: State, minutes: number, text: string, percent: number): State {
  const minute = state.minute + minutes;
  return {
    ...state,
    percent,
    minute,
    edits: state.edits + 1,
    log: [...state.log, { id: state.edits + 1, minute, text }].slice(-5),
  };
}

export function DeploySimulatorLab() {
  const [state, setState] = useState<State>(initial);
  const storefront = useRef<HTMLDivElement>(null);
  const lease = useStorefrontLease('deploy-simulator', true);
  const { percent, buggy } = state;

  const rate = errorRate(percent, buggy);
  const onV2 = buckets.filter((bucket) => versionFor(bucket, percent) === 'v2').length;
  const yours = versionFor(youBucket, percent);
  const verdict = gate(percent, rate);

  useEffect(() => {
    const buttons = storefront.current?.querySelectorAll<HTMLButtonElement>(
      '[data-control="version"] button',
    );
    buttons?.forEach((button) => {
      if (button.textContent === yours && button.getAttribute('aria-pressed') !== 'true') {
        button.click();
      }
    });
  }, [yours, lease.active]);

  function ramp(target: number) {
    setState((current) =>
      stamp(
        current,
        10,
        target >= 100 ? 'Promoted v2 to everyone' : `Canary raised to ${target}% for react-recs-v2`,
        target,
      ),
    );
  }

  function rollBack() {
    setState((current) =>
      current.percent === 0
        ? current
        : stamp(current, 2, 'Rolled back: live.recs points at react-recs-v1 again', 0),
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {ramps.map((target) => (
          <button
            key={target}
            type="button"
            className="kit-btn"
            aria-pressed={percent === target}
            onClick={() => ramp(target)}
          >
            Ramp to {target}%
          </button>
        ))}
        <button
          type="button"
          className="kit-btn"
          aria-disabled={percent === 0 ? true : undefined}
          onClick={rollBack}
        >
          Roll back
        </button>
        <button
          type="button"
          className="kit-btn"
          aria-pressed={buggy}
          onClick={() => setState((current) => ({ ...current, buggy: !current.buggy }))}
        >
          v2 has a bug
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        data-gate={verdict.tone}
        className={cn(
          'border-l-2 pl-3 text-[0.9rem]',
          verdict.tone === 'ok' && 'tone-ok border-ok',
          verdict.tone === 'warn' && 'tone-warn border-warn',
          verdict.tone === 'bad' && 'tone-bad border-bad',
        )}
      >
        {verdict.text}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-2">
          <p className="eyebrow">Visitors, 41 shown</p>
          <ul aria-label="Visitor cohort" data-on-v2={onV2} className="flex flex-wrap gap-1.5">
            {buckets.map((bucket, index) => {
              const version = versionFor(bucket, percent);
              const you = index === 0;
              return (
                <li
                  key={bucket}
                  aria-label={`${you ? 'You, bucket' : 'Bucket'} ${bucket}: ${version}`}
                  title={`${you ? 'You, bucket' : 'Bucket'} ${bucket}: ${version}`}
                  className={cn(
                    'size-5 rounded border',
                    version === 'v1' && 'border-line bg-surface-2',
                    version === 'v2' && (buggy ? 'border-bad bg-bad' : 'border-accent bg-accent'),
                    you && 'outline-2 outline-offset-2 outline-fg',
                  )}
                />
              );
            })}
          </ul>
          <p className="text-[0.84rem] text-muted">
            You are the outlined square, bucket {youBucket}. You get{' '}
            <b data-your-version={yours}>{yours}</b>
            {yours === 'v2'
              ? ' because the canary has reached your bucket.'
              : ' until the canary passes bucket 23.'}
          </p>
        </div>

        <div className="grid content-start gap-3">
          <Meter
            label="Error rate across all visitors"
            value={Number(rate.toFixed(1))}
            max={15}
            unit="%"
            thresholds={{ warn: warnAt, bad: rollbackAt }}
          />
          <Meter
            label="Visitors on v2"
            value={Math.round((onV2 / buckets.length) * 100)}
            max={100}
            unit="%"
          />
          <dl className="grid grid-cols-3 gap-2 text-[0.84rem]">
            <div>
              <dt className="text-muted">Host builds</dt>
              <dd className="font-mono tabular-nums" data-stat="host-builds">
                0
              </dd>
            </div>
            <div>
              <dt className="text-muted">Page reloads</dt>
              <dd className="font-mono tabular-nums" data-stat="page-reloads">
                0
              </dd>
            </div>
            <div>
              <dt className="text-muted">Manifest edits</dt>
              <dd className="font-mono tabular-nums" data-stat="manifest-edits">
                {state.edits}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="eyebrow">Deploy log, simulated clock</p>
        {state.log.length === 0 ? (
          <p className="text-[0.88rem] text-muted">Nothing deployed yet.</p>
        ) : (
          <ol aria-label="Deploy log" className="grid gap-1 font-mono text-[0.8rem]">
            {state.log.map((line) => (
              <li key={line.id}>
                <span className="text-muted">t+{line.minute} min</span> {line.text}
              </li>
            ))}
          </ol>
        )}
      </div>

      <CodePeek
        title="The manifest a production host would read"
        lang="ts"
        code={manifestFor(percent)}
        defaultOpen
      />

      <div ref={storefront}>
        {lease.active ? (
          <Storefront controls={['version']} />
        ) : (
          <StorefrontPlaceholder onRun={lease.claim} />
        )}
      </div>
    </div>
  );
}
