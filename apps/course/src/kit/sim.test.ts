import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRng, simulateRequest, sleep } from './sim';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createRng', () => {
  it('produces equal sequences for equal seeds', () => {
    const a = createRng(1);
    const b = createRng(1);
    const first = Array.from({ length: 8 }, () => a());
    const second = Array.from({ length: 8 }, () => b());
    expect(first).toEqual(second);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(Array.from({ length: 4 }, () => a())).not.toEqual(Array.from({ length: 4 }, () => b()));
  });

  it('stays within zero (inclusive) and one (exclusive)', () => {
    const rng = createRng(42);
    for (let index = 0; index < 500; index += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('sleep', () => {
  it('resolves once the delay has passed', async () => {
    const done = vi.fn();
    void sleep(100).then(done);
    await vi.advanceTimersByTimeAsync(99);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('rejects with the abort reason and clears its timer', async () => {
    const controller = new AbortController();
    const pending = sleep(1000, controller.signal);
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sleep(1000, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('simulateRequest', () => {
  it('rejects when failRate is 1', async () => {
    const pending = simulateRequest({ value: 'ok', latencyMs: 50, failRate: 1 });
    const assertion = expect(pending).rejects.toThrow('Simulated request failed');
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('resolves with the value after latencyMs', async () => {
    const settled = vi.fn();
    const pending = simulateRequest({ value: { id: 7 }, latencyMs: 300 }).then(settled);
    await vi.advanceTimersByTimeAsync(299);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toHaveBeenCalledWith({ id: 7 });
  });

  it('never fails when failRate is 0, whatever the rng returns', async () => {
    const pending = simulateRequest({ value: 1, latencyMs: 10, failRate: 0, rng: () => 0 });
    await vi.advanceTimersByTimeAsync(10);
    await expect(pending).resolves.toBe(1);
  });

  it('uses the supplied rng to decide failure', async () => {
    const fails = simulateRequest({ value: 1, latencyMs: 10, failRate: 0.5, rng: () => 0.2 });
    const failsAssertion = expect(fails).rejects.toThrow('Simulated request failed');
    const succeeds = simulateRequest({ value: 2, latencyMs: 10, failRate: 0.5, rng: () => 0.8 });
    await vi.advanceTimersByTimeAsync(10);
    await failsAssertion;
    await expect(succeeds).resolves.toBe(2);
  });

  it('rejects on abort before the latency has passed', async () => {
    const controller = new AbortController();
    const pending = simulateRequest({ value: 'late', latencyMs: 500, signal: controller.signal });
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
