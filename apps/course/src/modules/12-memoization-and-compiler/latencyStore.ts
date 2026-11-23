export interface LatencySnapshot {
  last: number;
  worst: number;
  average: number;
  count: number;
}

export interface LatencyStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => LatencySnapshot;
  record: (ms: number) => void;
  reset: () => void;
}

const empty: LatencySnapshot = { last: 0, worst: 0, average: 0, count: 0 };

export function createLatencyStore(): LatencyStore {
  let snapshot = empty;
  let total = 0;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    record(ms) {
      total += ms;
      const count = snapshot.count + 1;
      snapshot = {
        last: Math.round(ms),
        worst: Math.max(snapshot.worst, Math.round(ms)),
        average: Math.round(total / count),
        count,
      };
      emit();
    },
    reset() {
      total = 0;
      snapshot = empty;
      emit();
    },
  };
}
