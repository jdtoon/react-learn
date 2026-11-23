export type VitalName = 'lcp' | 'cls' | 'inp';

export interface PageVitals {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  supported: Record<VitalName, boolean>;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface InteractionEntry extends PerformanceEntry {
  interactionId?: number;
}

const sessionGap = 1000;
const sessionCap = 5000;

function supportsType(type: string): boolean {
  return (
    typeof PerformanceObserver !== 'undefined' &&
    (PerformanceObserver.supportedEntryTypes ?? []).includes(type)
  );
}

let snapshot: PageVitals = {
  lcp: null,
  cls: null,
  inp: null,
  supported: { lcp: false, cls: false, inp: false },
};
let started = false;
const listeners = new Set<() => void>();

function publish(next: Partial<Omit<PageVitals, 'supported'>>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function observe(type: string, onEntries: (entries: PerformanceEntry[]) => void): void {
  try {
    const observer = new PerformanceObserver((list) => onEntries(list.getEntries()));
    observer.observe({ type, buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  } catch {
    return;
  }
}

function startLcp(): void {
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) publish({ lcp: last.startTime });
  });
}

function startCls(): void {
  let windowValue = 0;
  let windowStart = 0;
  let previous = 0;
  let worst = 0;
  observe('layout-shift', (entries) => {
    for (const entry of entries as LayoutShiftEntry[]) {
      if (entry.hadRecentInput) continue;
      const continues =
        windowValue > 0 &&
        entry.startTime - previous < sessionGap &&
        entry.startTime - windowStart < sessionCap;
      if (continues) {
        windowValue += entry.value;
      } else {
        windowValue = entry.value;
        windowStart = entry.startTime;
      }
      previous = entry.startTime;
      worst = Math.max(worst, windowValue);
    }
    publish({ cls: worst });
  });
}

function startInp(): void {
  const longest = new Map<number, number>();
  observe('event', (entries) => {
    for (const entry of entries as InteractionEntry[]) {
      const id = entry.interactionId ?? 0;
      if (id === 0) continue;
      longest.set(id, Math.max(longest.get(id) ?? 0, entry.duration));
    }
    const durations = [...longest.values()].sort((a, b) => b - a);
    if (durations.length === 0) return;
    const index = Math.min(durations.length - 1, Math.floor(durations.length / 50));
    publish({ inp: durations[index] ?? null });
  });
}

function start(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const supported = {
    lcp: supportsType('largest-contentful-paint'),
    cls: supportsType('layout-shift'),
    inp: supportsType('event'),
  };
  snapshot = { ...snapshot, supported, cls: supported.cls ? 0 : null };
  if (supported.lcp) startLcp();
  if (supported.cls) startCls();
  if (supported.inp) startInp();
}

export function subscribeVitals(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVitals(): PageVitals {
  return snapshot;
}
