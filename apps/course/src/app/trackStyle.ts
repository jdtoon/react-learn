import type { CSSProperties } from 'react';
import { trackById } from '../content/curriculum';
import type { TrackId } from '../content/types';

export function trackStyle(id: TrackId): CSSProperties {
  const { colorVar } = trackById[id];
  return { '--tc': `var(${colorVar})`, '--tc-text': `var(${colorVar}-text)` } as CSSProperties;
}

export function padNumber(number: number): string {
  return String(number).padStart(2, '0');
}
