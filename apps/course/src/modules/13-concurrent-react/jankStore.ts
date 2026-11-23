export const sampleLimit = 24;

export interface JankSnapshot {
  samples: number[];
  last: number;
  worst: number;
  listLag: number | null;
}

export interface JankStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => JankSnapshot;
  keystroke: (value: string, startedAt: number) => void;
  record: (ms: number) => void;
  listCommitted: (value: string) => void;
  reset: () => void;
}

const empty: JankSnapshot = { samples: [], last: 0, worst: 0, listLag: null };

export function createJankStore(): JankStore {
  let snapshot = empty;
  let latest: { value: string; startedAt: number; reported: boolean } | null = null;
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
    keystroke(value, startedAt) {
      latest = { value, startedAt, reported: false };
    },
    record(ms) {
      const rounded = Math.round(ms);
      snapshot = {
        ...snapshot,
        samples: [...snapshot.samples, rounded].slice(-sampleLimit),
        last: rounded,
        worst: Math.max(snapshot.worst, rounded),
      };
      emit();
    },
    listCommitted(value) {
      if (!latest || latest.reported || latest.value !== value) return;
      latest.reported = true;
      snapshot = { ...snapshot, listLag: Math.round(performance.now() - latest.startedAt) };
      emit();
    },
    reset() {
      snapshot = empty;
      latest = null;
      emit();
    },
  };
}
