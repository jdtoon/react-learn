import { useEffect, useSyncExternalStore } from 'react';

let holder: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setHolder(next: string | null) {
  if (holder === next) return;
  holder = next;
  for (const listener of [...listeners]) listener();
}

export function useStorefrontLease(id: string, claimOnMount: boolean) {
  const current = useSyncExternalStore(
    subscribe,
    () => holder,
    () => null,
  );

  useEffect(() => {
    if (claimOnMount && holder === null) setHolder(id);
    return () => {
      if (holder === id) setHolder(null);
    };
  }, [id, claimOnMount]);

  return { active: current === id, claim: () => setHolder(id) };
}

export function StorefrontPlaceholder({ onRun }: { onRun: () => void }) {
  return (
    <div
      data-lease="idle"
      className="grid justify-items-start gap-2 rounded-xl border border-dashed border-line p-4"
    >
      <p className="max-w-[60ch] text-[0.9rem] text-muted">
        The storefront is running in another lab on this page, so the remotes are not loaded twice.
      </p>
      <button type="button" className="kit-btn" onClick={onRun}>
        Run the storefront here
      </button>
    </div>
  );
}
