import { useEffect } from 'react';
import { useLocation } from 'react-router';

function targetFor(hash: string): HTMLElement | null {
  const raw = hash.slice(1);
  if (!raw) return null;
  try {
    return document.getElementById(decodeURIComponent(raw));
  } catch {
    return document.getElementById(raw);
  }
}

export function useScrollToHash(): void {
  const { hash } = useLocation();

  useEffect(() => {
    const target = targetFor(hash);
    if (!target) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [hash]);
}
