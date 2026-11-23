import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emit,
  getLog,
  getSubscribers,
  on,
  subscribeLog,
  type BusEntry,
  type MfeEventType,
} from './index';

const busKey = Symbol.for('rfg.mfe-bus');

const cartAdd = { sku: 'jacket', name: 'Field jacket', price: 1899 };

let cleanups: Array<() => void> = [];

function track(unsubscribe: () => void): () => void {
  cleanups.push(unsubscribe);
  return unsubscribe;
}

beforeEach(() => {
  Reflect.deleteProperty(globalThis, busKey);
});

afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
});

describe('emit', () => {
  it('returns the number of subscribers that received the event', () => {
    const first = vi.fn();
    const second = vi.fn();
    track(on('cart:add', first, 'cart'));
    track(on('cart:add', second, 'analytics'));

    expect(emit('cart:add', cartAdd, 'catalog')).toBe(2);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('passes the payload and the source to the handler', () => {
    const handler = vi.fn();
    track(on('cart:add', handler, 'cart'));

    emit('cart:add', cartAdd, 'catalog');

    expect(handler).toHaveBeenCalledWith(cartAdd, { source: 'catalog' });
  });

  it('only delivers to subscribers of the same event type', () => {
    const promo = vi.fn();
    track(on('promo:applied', promo, 'cart'));

    expect(emit('cart:add', cartAdd, 'catalog')).toBe(0);
    expect(promo).not.toHaveBeenCalled();
  });

  it('returns 0 and does not throw when nobody is listening', () => {
    expect(() => emit('cart:add', cartAdd, 'catalog')).not.toThrow();
    expect(emit('cart:add', cartAdd, 'catalog')).toBe(0);
  });

  it('dispatches a window CustomEvent named rfg:<type> with payload and source in detail', () => {
    const seen: unknown[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent).detail);
    window.addEventListener('rfg:cart:add', listener);

    emit('cart:add', cartAdd, 'catalog');
    window.removeEventListener('rfg:cart:add', listener);

    expect(seen).toEqual([{ payload: cartAdd, source: 'catalog' }]);
  });
});

describe('on', () => {
  it('stops delivering after unsubscribe', () => {
    const handler = vi.fn();
    const unsubscribe = on('cart:add', handler, 'cart');

    emit('cart:add', cartAdd, 'catalog');
    unsubscribe();

    expect(emit('cart:add', cartAdd, 'catalog')).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('tolerates unsubscribing twice', () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = on('cart:add', first, 'cart');
    track(on('cart:add', second, 'analytics'));

    unsubscribeFirst();
    unsubscribeFirst();

    expect(emit('cart:add', cartAdd, 'catalog')).toBe(1);
  });

  it('lists the current subscribers by name', () => {
    const unsubscribeRecs = on('cart:updated', vi.fn(), 'recs');
    track(on('cart:updated', vi.fn(), 'header'));
    track(on('promo:applied', vi.fn(), 'cart'));

    expect(getSubscribers('cart:updated')).toEqual(['recs', 'header']);
    expect(getSubscribers()).toEqual(['recs', 'header', 'cart']);

    unsubscribeRecs();
    expect(getSubscribers('cart:updated')).toEqual(['header']);
  });
});

describe('the log', () => {
  it('records a dropped event with delivered 0', () => {
    const entries: BusEntry[] = [];
    track(subscribeLog((entry) => entries.push(entry)));

    emit('cart:add', cartAdd, 'catalog');

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      type: 'cart:add',
      source: 'catalog',
      payload: cartAdd,
      delivered: 0,
    });
    expect(typeof entries[0]?.at).toBe('number');
  });

  it('records the delivered count for a handled event', () => {
    const entries: BusEntry[] = [];
    track(subscribeLog((entry) => entries.push(entry)));
    track(on('cart:add', vi.fn(), 'cart'));

    emit('cart:add', cartAdd, 'catalog');

    expect(entries[0]?.delivered).toBe(1);
  });

  it('gives the listener entries in the order they were emitted, with rising ids', () => {
    const entries: BusEntry[] = [];
    track(subscribeLog((entry) => entries.push(entry)));

    const types: MfeEventType[] = ['cart:add', 'promo:applied', 'account:changed'];
    emit('cart:add', cartAdd, 'catalog');
    emit('promo:applied', { code: 'FIELD10', percentOff: 10 }, 'promo');
    emit('account:changed', { signedIn: true, name: 'Sam' }, 'account');

    expect(entries.map((entry) => entry.type)).toEqual(types);
    const ids = entries.map((entry) => entry.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(3);
  });

  it('records an event before any emit its handlers make', () => {
    const entries: BusEntry[] = [];
    track(subscribeLog((entry) => entries.push(entry)));
    track(
      on(
        'cart:add',
        (payload) => {
          emit('cart:updated', { count: 1, total: payload.price }, 'cart');
        },
        'cart',
      ),
    );

    emit('cart:add', cartAdd, 'catalog');

    expect(entries.map((entry) => entry.type)).toEqual(['cart:add', 'cart:updated']);
    expect(entries.map((entry) => entry.delivered)).toEqual([1, 0]);
  });

  it('stops notifying a log listener after it unsubscribes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLog(listener);

    emit('cart:add', cartAdd, 'catalog');
    unsubscribe();
    emit('cart:add', cartAdd, 'catalog');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps the latest 100 entries for late subscribers', () => {
    for (let index = 0; index < 105; index += 1) {
      emit('cart:updated', { count: index, total: index }, 'cart');
    }

    const log = getLog();
    expect(log).toHaveLength(100);
    expect(log[0]?.payload).toEqual({ count: 5, total: 5 });
    expect(log.at(-1)?.payload).toEqual({ count: 104, total: 104 });
  });
});

describe('separately bundled copies of the package', () => {
  it('share subscribers and the log through the window-wide bus', async () => {
    vi.resetModules();
    const host = await import('./index');
    vi.resetModules();
    const remote = await import('./index');
    expect(remote.emit).not.toBe(host.emit);

    const received = vi.fn();
    const entries: BusEntry[] = [];
    track(host.on('cart:add', received, 'cart'));
    track(host.subscribeLog((entry) => entries.push(entry)));

    expect(remote.emit('cart:add', cartAdd, 'react-catalog')).toBe(1);
    expect(received).toHaveBeenCalledWith(cartAdd, { source: 'react-catalog' });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ source: 'react-catalog', delivered: 1 });
    expect(remote.getSubscribers('cart:add')).toEqual(['cart']);
    expect(remote.getLog()).toEqual(entries);
  });

  it('give each entry a unique id across copies', async () => {
    vi.resetModules();
    const host = await import('./index');
    vi.resetModules();
    const remote = await import('./index');

    host.emit('cart:add', cartAdd, 'host');
    remote.emit('cart:add', cartAdd, 'remote');

    const ids = host.getLog().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(2);
  });
});
