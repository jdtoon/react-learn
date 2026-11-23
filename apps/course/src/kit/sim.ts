export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function simulateRequest<T>(opts: {
  value: T;
  latencyMs: number;
  failRate?: number;
  rng?: () => number;
  signal?: AbortSignal;
}): Promise<T> {
  const { value, latencyMs, failRate = 0, rng = Math.random, signal } = opts;
  const fails = failRate > 0 && rng() < failRate;
  await sleep(latencyMs, signal);
  if (fails) throw new Error('Simulated request failed');
  return value;
}
