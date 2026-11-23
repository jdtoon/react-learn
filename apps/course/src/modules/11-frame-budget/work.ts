export function burn(ms: number): number {
  const end = performance.now() + ms;
  let spins = 0;
  while (performance.now() < end) spins += 1;
  return spins;
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
