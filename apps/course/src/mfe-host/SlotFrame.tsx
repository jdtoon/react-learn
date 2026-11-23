import type { RemoteDescriptor } from '@react-field-guide/mfe-contracts';
import type { CSSProperties, ReactNode } from 'react';
import { formatBytes, frameworkLabels, kindLabels, slotMeta } from './slots';

export type SlotState = 'loading' | 'ready' | 'failed' | 'empty' | 'unwired';
export type ReactIdentity = 'same' | 'different';

export interface SlotFrameProps {
  slot: string;
  title: string;
  xray: boolean;
  state: SlotState;
  descriptor?: RemoteDescriptor;
  loadMs?: number | null;
  identity?: ReactIdentity | null;
  children: ReactNode;
}

function xrayLine(
  descriptor: RemoteDescriptor,
  state: SlotState,
  loadMs: number | null | undefined,
): string {
  const parts = [
    `Team ${descriptor.team}`,
    frameworkLabels[descriptor.framework],
    kindLabels[descriptor.kind],
    `v${descriptor.version}`,
  ];
  if (descriptor.bytes !== undefined) parts.push(formatBytes(descriptor.bytes));
  if (state === 'loading') parts.push('loading');
  else if (state === 'failed') parts.push('failed');
  else if (typeof loadMs === 'number') parts.push(`${Math.round(loadMs)} ms`);
  return parts.join(' · ');
}

export function SlotFrame({
  slot,
  title,
  xray,
  state,
  descriptor,
  loadMs,
  identity,
  children,
}: SlotFrameProps) {
  const colour = descriptor ? `var(--${descriptor.framework})` : 'var(--faint)';
  const wide = slotMeta(slot)?.wide ?? false;

  return (
    <div
      className="slot"
      data-slot={slot}
      data-state={state}
      data-xray={String(xray)}
      data-wide={wide ? 'true' : undefined}
      data-remote={descriptor?.id}
      aria-busy={state === 'loading' ? true : undefined}
      style={{ '--fc': colour } as CSSProperties}
    >
      {xray && (
        <p className="xtag">
          <span>{descriptor ? xrayLine(descriptor, state, loadMs) : 'Not deployed'}</span>{' '}
          {identity && <span className="xtag-identity">{`${identity} React`}</span>}
        </p>
      )}
      <h3 className="slot-title">{title}</h3>
      <div className="slot-body">{children}</div>
    </div>
  );
}
