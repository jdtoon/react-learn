import { useId, type CSSProperties } from 'react';
import { clamp, cn } from './cn';

export interface MeterThresholds {
  warn: number;
  bad: number;
}

export interface MeterProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  thresholds?: MeterThresholds;
}

type MeterLevel = 'ok' | 'warn' | 'bad' | 'neutral';

const levelText: Record<MeterLevel, string> = {
  ok: 'ok',
  warn: 'warning',
  bad: 'bad',
  neutral: '',
};

function levelOf(value: number, thresholds: MeterThresholds | undefined): MeterLevel {
  if (!thresholds) return 'neutral';
  const lowIsBad = thresholds.warn > thresholds.bad;
  const reached = (limit: number) => (lowIsBad ? value <= limit : value >= limit);
  if (reached(thresholds.bad)) return 'bad';
  if (reached(thresholds.warn)) return 'warn';
  return 'ok';
}

export function Meter({ label, value, max, unit = '', thresholds }: MeterProps) {
  const labelId = useId();
  const span = max > 0 ? max : 1;
  const level = levelOf(value, thresholds);
  const reading = `${value}${unit ? ` ${unit}` : ''}`;
  const limit = `${max}${unit ? ` ${unit}` : ''}`;
  const status = levelText[level];

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-[0.86rem] text-muted">
          {label}
        </span>
        <span className="font-mono text-[0.86rem] tabular-nums">
          <b className="font-medium">{reading}</b>
          <span className="text-muted">{` / ${limit}`}</span>
          {status && (
            <span
              className={cn(
                'ml-2 text-[0.68rem] uppercase tracking-[0.08em]',
                level === 'ok' && 'tone-ok',
                level === 'warn' && 'tone-warn',
                level === 'bad' && 'tone-bad',
              )}
            >
              {status}
            </span>
          )}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${reading} of ${limit}${status ? `, ${status}` : ''}`}
        className="meter-track"
      >
        <div
          className="meter-fill"
          data-level={level}
          style={{ '--w': `${clamp((value / span) * 100, 0, 100)}%` } as CSSProperties}
        />
        {thresholds &&
          [thresholds.warn, thresholds.bad].map((limitValue) => (
            <span
              key={limitValue}
              aria-hidden="true"
              className="meter-tick"
              style={{ '--l': `${clamp((limitValue / span) * 100, 0, 100)}%` } as CSSProperties}
            />
          ))}
      </div>
    </div>
  );
}
