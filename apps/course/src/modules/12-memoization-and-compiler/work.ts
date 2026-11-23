export function burn(ms: number): number {
  const end = performance.now() + ms;
  let spins = 0;
  while (performance.now() < end) spins += 1;
  return spins;
}

export function afterPaint(callback: () => void): void {
  requestAnimationFrame(() => {
    setTimeout(callback, 0);
  });
}

export function typeInto(
  input: HTMLInputElement,
  text: string,
  intervalMs: number,
  onDone: () => void,
): () => void {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  let index = 0;
  let timer = 0;
  const step = () => {
    index += 1;
    setValue?.call(input, text.slice(0, index));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (index < text.length) timer = window.setTimeout(step, intervalMs);
    else onDone();
  };
  timer = window.setTimeout(step, intervalMs);
  return () => window.clearTimeout(timer);
}
