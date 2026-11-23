export type NameSource =
  | 'aria-labelledby'
  | 'aria-label'
  | 'label'
  | 'alt'
  | 'content'
  | 'title'
  | 'placeholder'
  | 'none';

export type NodeKind = 'control' | 'heading' | 'landmark';

export interface XrayNode {
  el: HTMLElement;
  kind: NodeKind;
  role: string;
  name: string;
  source: NameSource;
  tab: number | null;
  mouseOnly: boolean;
}

export interface PlacedNode extends XrayNode {
  left: number;
  top: number;
  width: number;
  height: number;
}

const nativeStops = 'a[href], button, input:not([type="hidden"]), select, textarea';
const candidates = `${nativeStops}, [tabindex], [data-mouse-only], header, nav, main, h1, h2, h3, h4, h5, h6, [role]`;
const nameFromContent = new Set(['button', 'link', 'heading', 'checkbox', 'radio']);

function roleOf(el: HTMLElement): string {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return 'heading';
  switch (tag) {
    case 'a':
      return el.hasAttribute('href') ? 'link' : 'generic';
    case 'button':
      return 'button';
    case 'select':
      return 'combobox';
    case 'textarea':
      return 'textbox';
    case 'nav':
      return 'navigation';
    case 'header':
      return 'banner';
    case 'main':
      return 'main';
    case 'input': {
      const type = (el as HTMLInputElement).type;
      if (type === 'checkbox' || type === 'radio') return type;
      if (type === 'search') return 'searchbox';
      if (type === 'submit' || type === 'button') return 'button';
      return 'textbox';
    }
    default:
      return 'generic';
  }
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
  return Array.from(node.childNodes).map(textOf).join(' ');
}

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function nameOf(el: HTMLElement, role: string): { name: string; source: NameSource } {
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const text = clean(
      labelledby
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .map((target) => (target ? textOf(target) : ''))
        .join(' '),
    );
    if (text) return { name: text, source: 'aria-labelledby' };
  }
  const ariaLabel = clean(el.getAttribute('aria-label') ?? '');
  if (ariaLabel) return { name: ariaLabel, source: 'aria-label' };

  const labels = (el as HTMLInputElement).labels;
  if (labels && labels.length > 0) {
    const text = clean(Array.from(labels).map(textOf).join(' '));
    if (text) return { name: text, source: 'label' };
  }
  const alt = clean(el.getAttribute('alt') ?? '');
  if (alt) return { name: alt, source: 'alt' };

  if (nameFromContent.has(role)) {
    const text = clean(textOf(el));
    if (text) return { name: text, source: 'content' };
  }
  const title = clean(el.getAttribute('title') ?? '');
  if (title) return { name: title, source: 'title' };
  const placeholder = clean(el.getAttribute('placeholder') ?? '');
  if (placeholder) return { name: placeholder, source: 'placeholder' };
  return { name: '', source: 'none' };
}

function stopValue(el: HTMLElement): number | null {
  if (el.hasAttribute('disabled')) return null;
  const attribute = el.getAttribute('tabindex');
  if (attribute !== null && attribute.trim() !== '' && !Number.isNaN(Number(attribute))) {
    const value = Number(attribute);
    return value >= 0 ? value : null;
  }
  return el.matches(nativeStops) ? 0 : null;
}

export function inspect(root: HTMLElement): XrayNode[] {
  const nodes: XrayNode[] = [];
  const order = new Map<HTMLElement, number>();

  root.querySelectorAll<HTMLElement>(candidates).forEach((el) => {
    const role = roleOf(el);
    const stop = stopValue(el);
    const mouseOnly = el.hasAttribute('data-mouse-only') && stop === null;
    const isHeading = role === 'heading';
    const isLandmark = role === 'banner' || role === 'navigation' || role === 'main';
    if (stop === null && !mouseOnly && !isHeading && !isLandmark) return;
    const { name, source } = nameOf(el, role);
    const kind: NodeKind = stop !== null || mouseOnly ? 'control' : isHeading ? 'heading' : 'landmark';
    order.set(el, stop ?? -1);
    nodes.push({
      el,
      kind,
      role: mouseOnly ? 'generic' : role,
      name: mouseOnly && !name ? clean(textOf(el)) : name,
      source: mouseOnly ? 'content' : source,
      tab: null,
      mouseOnly,
    });
  });

  const stops = nodes
    .map((node, index) => ({ node, index, value: order.get(node.el) ?? -1 }))
    .filter((entry) => entry.value >= 0);
  stops.sort((a, b) => {
    const aKey = a.value > 0 ? a.value : Number.POSITIVE_INFINITY;
    const bKey = b.value > 0 ? b.value : Number.POSITIVE_INFINITY;
    if (aKey !== bKey) return aKey < bKey ? -1 : 1;
    return a.index - b.index;
  });
  stops.forEach((entry, position) => {
    entry.node.tab = position + 1;
  });
  return nodes;
}

export function place(root: HTMLElement): PlacedNode[] {
  const rootRect = root.getBoundingClientRect();
  return inspect(root).map((node) => {
    const rect = node.el.getBoundingClientRect();
    return {
      ...node,
      left: rect.left - rootRect.left - root.clientLeft,
      top: rect.top - rootRect.top - root.clientTop,
      width: rect.width,
      height: rect.height,
    };
  });
}
