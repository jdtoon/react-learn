import { create } from 'zustand';
import { readJSON, writeJSON } from '../lib/safeStorage';

const storageKey = 'progress';

interface ProgressState {
  completed: Record<string, true>;
  toggleComplete: (slug: string) => void;
  isComplete: (slug: string) => boolean;
}

function readCompleted(): Record<string, true> {
  const stored = readJSON<unknown>(storageKey, {});
  const completed: Record<string, true> = {};
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return completed;
  for (const [slug, value] of Object.entries(stored)) {
    if (value === true) completed[slug] = true;
  }
  return completed;
}

export const useProgress = create<ProgressState>()((set, get) => ({
  completed: readCompleted(),
  toggleComplete: (slug) => {
    const current = get().completed;
    const completed: Record<string, true> = current[slug]
      ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== slug))
      : { ...current, [slug]: true };
    writeJSON(storageKey, completed);
    set({ completed });
  },
  isComplete: (slug) => get().completed[slug] === true,
}));
