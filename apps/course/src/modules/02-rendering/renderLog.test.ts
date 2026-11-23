import { afterEach, describe, expect, it, vi } from 'vitest';
import { countChanges, createRenderLog } from './renderLog';

function observed(setup: (root: HTMLElement) => void, mutate: (root: HTMLElement) => void) {
  const root = document.createElement('div');
  setup(root);
  document.body.append(root);
  const observer = new MutationObserver(() => undefined);
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
  });
  mutate(root);
  const records = observer.takeRecords();
  observer.disconnect();
  root.remove();
  return countChanges(records);
}

describe('countChanges', () => {
  it('counts a changed text node once however often it was written', () => {
    const changes = observed(
      (root) => {
        root.textContent = 'a';
      },
      (root) => {
        const text = root.firstChild;
        if (text) {
          text.nodeValue = 'b';
          text.nodeValue = 'c';
        }
      },
    );
    expect(changes).toBe(1);
  });

  it('does not count a text node rewritten with the same value', () => {
    const changes = observed(
      (root) => {
        root.textContent = 'a';
      },
      (root) => {
        if (root.firstChild) root.firstChild.nodeValue = 'a';
      },
    );
    expect(changes).toBe(0);
  });

  it('does not count an attribute that ends where it started', () => {
    const changes = observed(
      (root) => {
        root.innerHTML = '<input type="checkbox">';
      },
      (root) => {
        const input = root.querySelector('input');
        input?.setAttribute('name', '');
        input?.setAttribute('type', 'checkbox');
        input?.removeAttribute('name');
      },
    );
    expect(changes).toBe(0);
  });

  it('counts an attribute that changed and one that was added', () => {
    const changes = observed(
      (root) => {
        root.innerHTML = '<span class="a"></span>';
      },
      (root) => {
        const span = root.querySelector('span');
        span?.setAttribute('class', 'b');
        span?.setAttribute('title', 'x');
      },
    );
    expect(changes).toBe(2);
  });

  it('counts every inserted and removed node', () => {
    const changes = observed(
      (root) => {
        root.innerHTML = '<p></p>';
      },
      (root) => {
        root.querySelector('p')?.remove();
        root.append(document.createElement('p'));
      },
    );
    expect(changes).toBe(2);
  });

  it('ignores the counter text and the flash styling of a render box', () => {
    const changes = observed(
      (root) => {
        root.innerHTML = '<div class="rb"><span class="rb-count"></span></div>';
      },
      (root) => {
        const box = root.querySelector('.rb');
        const count = root.querySelector('.rb-count');
        if (count) count.textContent = 'renders 2';
        box?.classList.add('rb-flash');
        box?.setAttribute('data-latest', 'true');
      },
    );
    expect(changes).toBe(0);
  });
});

describe('createRenderLog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('publishes an empty update when nothing renders after a trigger', () => {
    vi.useFakeTimers();
    const log = createRenderLog();
    const listener = vi.fn();
    log.subscribe(listener);
    log.trigger('Set same value');
    expect(log.getSnapshot()).toBeNull();
    vi.advanceTimersByTime(200);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(log.getSnapshot()).toMatchObject({ trigger: 'Set same value', ran: [], domChanges: 0 });
  });

  it('groups the components that render after a trigger into one update', () => {
    vi.useFakeTimers();
    const log = createRenderLog();
    log.trigger('Change Feed state');
    log.rendered('Feed');
    log.rendered('Post A');
    log.rendered('Feed');
    vi.advanceTimersByTime(10);
    expect(log.getSnapshot()?.ran).toEqual(['Feed', 'Post A']);
  });

  it('ignores renders that arrive before any trigger and after an update settled', () => {
    vi.useFakeTimers();
    const log = createRenderLog();
    log.rendered('App');
    log.trigger('Change App state');
    log.rendered('App');
    vi.advanceTimersByTime(10);
    log.rendered('Feed');
    vi.advanceTimersByTime(10);
    expect(log.getSnapshot()?.ran).toEqual(['App']);
  });

  it('stops notifying a listener that unsubscribed', () => {
    vi.useFakeTimers();
    const log = createRenderLog();
    const listener = vi.fn();
    const unsubscribe = log.subscribe(listener);
    unsubscribe();
    log.trigger('x');
    vi.advanceTimersByTime(200);
    expect(listener).not.toHaveBeenCalled();
  });
});
