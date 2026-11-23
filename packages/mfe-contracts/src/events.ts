export type MfeEventMap = {
  'cart:add': { sku: string; name: string; price: number };
  'cart:updated': { count: number; total: number };
  'promo:applied': { code: string; percentOff: number };
  'account:changed': { signedIn: boolean; name: string | null };
  'locator:store-selected': { storeId: string; label: string };
};

export type MfeEventType = keyof MfeEventMap;

export interface BusEntry {
  id: number;
  type: MfeEventType;
  source: string;
  payload: unknown;
  at: number;
  delivered: number;
  subscribers: string[];
}

interface Subscription {
  type: MfeEventType;
  name: string;
}

interface BusState {
  nextEntryId: number;
  nextSubscriptionId: number;
  subscriptions: Map<number, Subscription>;
  log: BusEntry[];
  logListeners: Set<(entry: BusEntry) => void>;
}

const busKey = Symbol.for('rfg.mfe-bus');
const logLimit = 100;

function bus(): BusState {
  const holder = globalThis as unknown as Record<symbol, BusState | undefined>;
  let state = holder[busKey];
  if (!state) {
    state = {
      nextEntryId: 1,
      nextSubscriptionId: 1,
      subscriptions: new Map(),
      log: [],
      logListeners: new Set(),
    };
    holder[busKey] = state;
  }
  return state;
}

function eventName(type: MfeEventType): string {
  return `rfg:${type}`;
}

export function emit<K extends MfeEventType>(
  type: K,
  payload: MfeEventMap[K],
  source: string,
): number {
  const state = bus();
  const subscribers: string[] = [];
  for (const subscription of state.subscriptions.values()) {
    if (subscription.type === type) subscribers.push(subscription.name);
  }
  const delivered = subscribers.length;

  const entry: BusEntry = {
    id: state.nextEntryId,
    type,
    source,
    payload,
    at: Date.now(),
    delivered,
    subscribers,
  };
  state.nextEntryId += 1;
  state.log.push(entry);
  if (state.log.length > logLimit) state.log.shift();
  for (const listener of [...state.logListeners]) {
    try {
      listener(entry);
    } catch (error) {
      queueMicrotask(() => {
        throw error;
      });
    }
  }

  window.dispatchEvent(new CustomEvent(eventName(type), { detail: { payload, source } }));
  return delivered;
}

export function on<K extends MfeEventType>(
  type: K,
  handler: (payload: MfeEventMap[K], meta: { source: string }) => void,
  subscriber: string,
): () => void {
  const state = bus();
  const id = state.nextSubscriptionId;
  state.nextSubscriptionId += 1;

  const listener = (event: Event) => {
    const { payload, source } = (event as CustomEvent<{ payload: MfeEventMap[K]; source: string }>)
      .detail;
    handler(payload, { source });
  };

  window.addEventListener(eventName(type), listener);
  state.subscriptions.set(id, { type, name: subscriber });

  return () => {
    window.removeEventListener(eventName(type), listener);
    state.subscriptions.delete(id);
  };
}

export function subscribeLog(listener: (entry: BusEntry) => void): () => void {
  const { logListeners } = bus();
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
}

export function getLog(): BusEntry[] {
  return [...bus().log];
}

export function getSubscribers(type?: MfeEventType): string[] {
  return [...bus().subscriptions.values()]
    .filter((subscription) => type === undefined || subscription.type === type)
    .map((subscription) => subscription.name);
}
