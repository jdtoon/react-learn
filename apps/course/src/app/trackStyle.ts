import type { CSSProperties } from 'react';
import { trackById } from '../content/curriculum';
import type { TrackId } from '../content/types';

export function trackStyle(id: TrackId): CSSProperties {
  return { '--tc': `var(${trackById[id].colorVar})` } as CSSProperties;
}

export function padNumber(number: number): string {
  return String(number).padStart(2, '0');
}
