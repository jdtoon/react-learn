import type { CSSProperties } from 'react';
import { clamp } from './cn';

export type WaterfallStatus = 'ok' | 'error' | 'pending';

export interface WaterfallRequest {
  id: string;
  label: string;
  start: number;
  end: number;
  status?: WaterfallStatus;
}

export interface WaterfallProps {
  requests: WaterfallRequest[];
  total: number;
}

const statusText: Record<WaterfallStatus, string> = {
  ok: 'ok',
  error: 'failed',
  pending: 'pending',
};

export function Waterfall({ requests, total }: WaterfallProps) {
  const span = total > 0 ? total : 1;

  return (
    <div className="grid gap-2.5">
      <ol aria-label="Requests" className="grid gap-2.5">
        {requests.map((request) => {
          const status = request.status ?? 'ok';
          const left = clamp((request.start / span) * 100, 0, 100);
          const width = clamp(((request.end - request.start) / span) * 100, 0, 100 - left);
          const duration = request.end - request.start;
          return (
            <li key={request.id} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-3 text-[0.82rem]">
                <span className="min-w-0 break-words font-mono">{request.label}</span>
                <span className="shrink-0 font-mono text-[0.72rem] tabular-nums text-muted">
                  {`${request.start} to ${request.end} ms · ${duration} ms · ${statusText[status]}`}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="wf-bar"
                style={{ '--l': `${left}%`, '--w': `${width}%` } as CSSProperties}
              >
                <div className="wf-fill" data-status={status} />
              </div>
            </li>
          );
        })}
      </ol>
      <div
        aria-hidden="true"
        className="flex justify-between font-mono text-[0.68rem] tabular-nums text-muted"
      >
        <span>0 ms</span>
        <span>{`${total} ms`}</span>
      </div>
    </div>
  );
}
