export interface UpdateSummary {
  id: number;
  trigger: string;
  rendered: string[];
  domChanges: number;
}

export interface RenderLog {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => UpdateSummary | null;
  trigger: (label: string) => void;
  rendered: (name: string) => void;
  observe: (target: HTMLElement) => () => void;
}

const settleMs = 120;

function elementOf(node: Node): Element | null {
  return node instanceof Element ? node : node.parentElement;
}

function isRenderBoxStyling(element: Element, name: string): boolean {
  return element.classList.contains('rb') && (name === 'class' || name === 'data-latest');
}

export function countChanges(records: MutationRecord[]): number {
  const texts = new Map<Node, string | null>();
  const attributes = new Map<Element, Map<string, string | null>>();
  let structural = 0;

  for (const record of records) {
    const target = record.target;
    if (elementOf(target)?.closest('.rb-count')) continue;
    if (record.type === 'childList') {
      structural += 1;
    } else if (record.type === 'characterData') {
      if (!texts.has(target)) texts.set(target, record.oldValue);
    } else if (target instanceof Element && record.attributeName) {
      const name = record.attributeName;
      if (isRenderBoxStyling(target, name)) continue;
      const seen = attributes.get(target) ?? new Map<string, string | null>();
      if (!seen.has(name)) seen.set(name, record.oldValue);
      attributes.set(target, seen);
    }
  }

  let changes = structural;
  for (const [node, before] of texts) {
    if (node.nodeValue !== before) changes += 1;
  }
  for (const [element, seen] of attributes) {
    for (const [name, before] of seen) {
      if (element.getAttribute(name) !== before) changes += 1;
    }
  }
  return changes;
}

export function createRenderLog(): RenderLog {
  const listeners = new Set<() => void>();
  let snapshot: UpdateSummary | null = null;
  let current: UpdateSummary | null = null;
  let collecting = false;
  let nextId = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function publish() {
    if (!current) return;
    collecting = false;
    snapshot = { ...current, rendered: [...current.rendered] };
    for (const listener of listeners) listener();
  }

  function publishSoon(delay: number) {
    clearTimeout(timer);
    timer = setTimeout(publish, delay);
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    trigger(label) {
      nextId += 1;
      current = { id: nextId, trigger: label, rendered: [], domChanges: 0 };
      collecting = true;
      publishSoon(settleMs);
    },
    rendered(name) {
      if (!current || !collecting || current.rendered.includes(name)) return;
      current.rendered.push(name);
      publishSoon(0);
    },
    observe(target) {
      const observer = new MutationObserver((records) => {
        if (!current || !collecting) return;
        const changes = countChanges(records);
        if (changes === 0) return;
        current.domChanges += changes;
        publishSoon(0);
      });
      observer.observe(target, {
        subtree: true,
        childList: true,
        characterData: true,
        characterDataOldValue: true,
        attributes: true,
        attributeOldValue: true,
      });
      return () => observer.disconnect();
    },
  };
}
