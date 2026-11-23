export const frameBudgetMs = 16.7;
export const historyLength = 90;

export interface FrameSnapshot {
  deltas: number[];
  longest: number;
  missed: number;
  frames: number;
}

export interface FrameStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => FrameSnapshot;
  start: () => () => void;
  reset: () => void;
}

const warmupFrames = 30;

const empty: FrameSnapshot = { deltas: [], longest: 0, missed: 0, frames: 0 };

export function createFrameStore(): FrameStore {
  let snapshot = empty;
  let previous = 0;
  let handle = 0;
  let seen = 0;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function tick(now: number) {
    seen += 1;
    if (previous !== 0 && seen > warmupFrames) {
      const delta = now - previous;
      if (delta < 1000) {
        const lost = delta > frameBudgetMs * 1.5 ? Math.round(delta / frameBudgetMs) - 1 : 0;
        snapshot = {
          deltas: [...snapshot.deltas, delta].slice(-historyLength),
          longest: Math.max(snapshot.longest, delta),
          missed: snapshot.missed + lost,
          frames: snapshot.frames + 1,
        };
        emit();
      }
    }
    previous = now;
    handle = requestAnimationFrame(tick);
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    start() {
      previous = 0;
      seen = 0;
      handle = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(handle);
    },
    reset() {
      snapshot = empty;
      emit();
    },
  };
}
