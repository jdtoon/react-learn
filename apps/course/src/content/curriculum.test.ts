import { describe, expect, it } from 'vitest';
import { curriculum, trackById, tracks } from './curriculum';

const expectedSlugs = [
  '01-how-react-thinks',
  '02-rendering',
  '03-state-snapshots',
  '04-effects-and-refs',
  '05-component-design',
  '06-state-management',
  '07-data-fetching',
  '08-forms-and-actions',
  '09-routing-and-splitting',
  '10-rendering-strategies',
  '11-frame-budget',
  '12-memoization-and-compiler',
  '13-concurrent-react',
  '14-web-vitals',
  '15-styling-and-design-systems',
  '16-accessibility',
  '17-motion-and-perceived-performance',
  '18-testing-strategy',
  '19-frontend-security',
  '20-build-ship-observe',
  '21-mfe-why-and-when',
  '22-mfe-composition',
  '23-mfe-sharing-and-communication',
  '24-mfe-in-production',
];

describe('tracks', () => {
  it('defines six tracks with unique ids, orders and matching colour variables', () => {
    expect(tracks).toHaveLength(6);
    expect(new Set(tracks.map((t) => t.id)).size).toBe(6);
    expect(tracks.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const track of tracks) {
      expect(track.colorVar).toBe(`--track-${track.id}`);
      expect(trackById[track.id]).toBe(track);
    }
  });
});

describe('curriculum', () => {
  it('has 24 unique slugs', () => {
    expect(curriculum).toHaveLength(24);
    expect(new Set(curriculum.map((m) => m.slug)).size).toBe(24);
  });

  it('uses the agreed slugs in order', () => {
    expect(curriculum.map((m) => m.slug)).toEqual(expectedSlugs);
  });

  it('numbers modules 1 to 24 and prefixes each slug with its number', () => {
    expect(curriculum.map((m) => m.number)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    for (const module of curriculum) {
      expect(module.slug.startsWith(String(module.number).padStart(2, '0'))).toBe(true);
    }
  });

  it('gives every module a slug of the right shape and an existing track', () => {
    const trackIds = new Set(tracks.map((t) => t.id));
    for (const module of curriculum) {
      expect(module.slug).toMatch(/^\d{2}-[a-z0-9-]+$/);
      expect(trackIds.has(module.track)).toBe(true);
    }
  });

  it('gives every module a title, one idea and 12 minutes', () => {
    for (const module of curriculum) {
      expect(module.title.length).toBeGreaterThan(0);
      expect(module.oneIdea.length).toBeGreaterThan(0);
      expect(module.minutes).toBe(12);
    }
  });

  it('assigns phases as planned', () => {
    const phaseOf = (number: number) => curriculum.find((m) => m.number === number)?.phase;
    expect(phaseOf(2)).toBe(0);
    for (const n of [21, 22, 23, 24]) expect(phaseOf(n)).toBe(1);
    for (const n of [1, 3, 4, 11, 12, 13, 14]) expect(phaseOf(n)).toBe(2);
    for (const n of [5, 6, 7, 8, 9, 10]) expect(phaseOf(n)).toBe(3);
    for (const n of [15, 16, 17, 18, 19, 20]) expect(phaseOf(n)).toBe(4);
  });

  it('distributes modules across tracks as planned', () => {
    const count = (id: string) => curriculum.filter((m) => m.track === id).length;
    expect(count('foundations')).toBe(4);
    expect(count('architecture')).toBe(6);
    expect(count('performance')).toBe(4);
    expect(count('craft')).toBe(3);
    expect(count('production')).toBe(3);
    expect(count('micro-frontends')).toBe(4);
  });
});
