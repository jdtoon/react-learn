import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from './progress';

afterEach(() => {
  useProgress.setState({ completed: {} });
  localStorage.clear();
  vi.resetModules();
});

describe('useProgress', () => {
  it('starts empty', () => {
    expect(useProgress.getState().completed).toEqual({});
    expect(useProgress.getState().isComplete('02-rendering')).toBe(false);
  });

  it('toggles completion and persists it', () => {
    useProgress.getState().toggleComplete('02-rendering');
    expect(useProgress.getState().isComplete('02-rendering')).toBe(true);
    expect(localStorage.getItem('rfg:progress')).toBe('{"02-rendering":true}');

    useProgress.getState().toggleComplete('02-rendering');
    expect(useProgress.getState().isComplete('02-rendering')).toBe(false);
    expect(localStorage.getItem('rfg:progress')).toBe('{}');
  });

  it('restores stored progress and drops entries that are not true', async () => {
    localStorage.setItem('rfg:progress', '{"02-rendering":true,"03-state-snapshots":false,"x":1}');
    const { useProgress: fresh } = await import('./progress');
    expect(fresh.getState().completed).toEqual({ '02-rendering': true });
  });

  it('ignores stored data of the wrong shape', async () => {
    localStorage.setItem('rfg:progress', '["02-rendering"]');
    const { useProgress: fresh } = await import('./progress');
    expect(fresh.getState().completed).toEqual({});
  });

  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => useProgress.getState().toggleComplete('02-rendering')).not.toThrow();
    expect(useProgress.getState().isComplete('02-rendering')).toBe(true);
  });
});
