import { describe, expect, it } from 'vitest';
import { tracks } from '../content/curriculum';
import { padNumber, trackStyle } from './trackStyle';

describe('trackStyle', () => {
  it('exposes the track colour and its text variant', () => {
    expect(trackStyle('foundations')).toEqual({
      '--tc': 'var(--track-foundations)',
      '--tc-text': 'var(--track-foundations-text)',
    });
  });

  it('points every track at its own tokens', () => {
    for (const track of tracks) {
      expect(trackStyle(track.id)).toMatchObject({
        '--tc': `var(${track.colorVar})`,
        '--tc-text': `var(${track.colorVar}-text)`,
      });
    }
  });
});

describe('padNumber', () => {
  it('pads to two digits', () => {
    expect(padNumber(2)).toBe('02');
    expect(padNumber(24)).toBe('24');
  });
});
