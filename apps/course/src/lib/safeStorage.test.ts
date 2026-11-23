import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJSON, writeJSON } from './safeStorage';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('safeStorage', () => {
  it('returns the fallback when nothing is stored', () => {
    expect(readJSON('missing', 'fallback')).toBe('fallback');
  });

  it('round-trips values under the rfg: prefix', () => {
    writeJSON('answer', { n: 42 });
    expect(localStorage.getItem('rfg:answer')).toBe('{"n":42}');
    expect(readJSON('answer', null)).toEqual({ n: 42 });
  });

  it('returns the fallback for malformed JSON', () => {
    localStorage.setItem('rfg:broken', '{not json');
    expect(readJSON('broken', 'fallback')).toBe('fallback');
  });

  it('returns the fallback and does not throw when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => readJSON('k', 'fallback')).not.toThrow();
    expect(readJSON('k', 'fallback')).toBe('fallback');
  });

  it('does not throw when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => writeJSON('k', { a: 1 })).not.toThrow();
  });

  it('does not throw when the value cannot be serialised', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => writeJSON('k', circular)).not.toThrow();
  });
});
